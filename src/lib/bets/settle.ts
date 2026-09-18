import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { straightPayout, parlayPayout, type AmericanOdds } from "@/lib/shared/odds";

// Node-side port of the settlement pattern in
// supabase/functions/score-check/index.ts, used only for the admin
// "void game" action (the score-check edge function handles every other
// settlement path — normal wins/losses on final scores). Kept small and
// duplicated deliberately rather than round-tripping to the edge function
// for a single manual admin action.

async function finalizeBet(betId: string, userId: string, status: "won" | "lost" | "push", payout: number) {
  const { data: updated } = await supabaseAdmin
    .from("bets")
    .update({ status, payout, graded_at: new Date().toISOString() })
    .eq("id", betId)
    .eq("status", "pending")
    .select("id");
  if (!updated || updated.length === 0) return;

  if (payout > 0) {
    await supabaseAdmin.rpc("increment_balance", { p_user_id: userId, p_amount: payout });
  }
}

async function settleBetIfReady(betId: string) {
  const { data: bet } = await supabaseAdmin
    .from("bets")
    .select("id, user_id, type, wager, status")
    .eq("id", betId)
    .maybeSingle();
  if (!bet || bet.status !== "pending") return;

  const { data: legs } = await supabaseAdmin.from("bet_legs").select("result, odds_at_placement").eq("bet_id", betId);
  if (!legs || legs.length === 0) return;

  if (bet.type === "straight") {
    const leg = legs[0];
    if (leg.result === "pending") return;
    if (leg.result === "lost") return finalizeBet(bet.id, bet.user_id, "lost", 0);
    if (leg.result === "push") return finalizeBet(bet.id, bet.user_id, "push", Number(bet.wager));
    const { payout } = straightPayout(Number(bet.wager), leg.odds_at_placement);
    return finalizeBet(bet.id, bet.user_id, "won", payout);
  }

  const anyLost = legs.some((l) => l.result === "lost");
  if (anyLost) return finalizeBet(bet.id, bet.user_id, "lost", 0);
  const anyPending = legs.some((l) => l.result === "pending");
  if (anyPending) return;
  const countingOdds = legs.filter((l) => l.result === "won").map((l) => l.odds_at_placement as AmericanOdds);
  const allPushed = countingOdds.length === 0;
  const payout = parlayPayout(Number(bet.wager), countingOdds);
  return finalizeBet(bet.id, bet.user_id, allPushed ? "push" : "won", payout);
}

/** Pushes every pending leg on a game and settles any bets that become ready. Used when an admin voids a game. */
export async function voidGameBets(gameId: string) {
  const { data: legs } = await supabaseAdmin
    .from("bet_legs")
    .select("id, bet_id")
    .eq("game_id", gameId)
    .eq("result", "pending");

  const affectedBetIds = new Set<string>();
  for (const leg of legs ?? []) {
    await supabaseAdmin.from("bet_legs").update({ result: "push" }).eq("id", leg.id).eq("result", "pending");
    affectedBetIds.add(leg.bet_id);
  }
  for (const betId of affectedBetIds) {
    await settleBetIfReady(betId);
  }
}
