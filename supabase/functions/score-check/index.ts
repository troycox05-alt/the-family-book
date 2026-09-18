// Checks scores for open games, flips finished games to "final", grades
// every pending bet leg/bet referencing them, and runs Toss-Up Five grading
// for any week whose 5 games are now all final. Runs on a cron schedule
// (every few minutes); internally checks real Central time against the
// exact target checkpoints (with tolerance) so it only does real work at
// Sat 12:30/2:30/4:30/6:30/8:30/10:30pm, Sat-midnight, and the Sun-noon
// safety sweep — DST-safe, no hardcoded UTC cron times.
//
// Call with ?force=true (still requires x-cron-secret) to run regardless
// of the checkpoint window — used by the admin panel's manual "check
// scores now" and for testing.

import { requireCronSecret } from "../_shared/auth.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { isNearScoreCheckTarget } from "../_shared/centralTime.ts";
import { straightPayout, parlayPayout, type AmericanOdds } from "../_shared/odds.ts";

const ODDS_API_SPORT = "americanfootball_ncaaf";

type OddsApiScoreEvent = {
  id: string;
  completed: boolean;
  home_team: string;
  away_team: string;
  scores: { name: string; score: string }[] | null;
};

type BetLegRow = {
  id: string;
  bet_id: string;
  game_id: string;
  market: "spread" | "moneyline" | "total";
  selection: string;
  line_at_placement: number | null;
  odds_at_placement: number;
  result: "pending" | "won" | "lost" | "push";
};

function computeLegResult(
  leg: BetLegRow,
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number,
): "won" | "lost" | "push" {
  if (leg.market === "moneyline") {
    if (homeScore === awayScore) return "push"; // CFB games essentially never tie, but don't pay out either side if it happens
    const winner = homeScore > awayScore ? homeTeam : awayTeam;
    return leg.selection === winner ? "won" : "lost";
  }

  if (leg.market === "spread") {
    const selectedIsHome = leg.selection === homeTeam;
    const selectedScore = selectedIsHome ? homeScore : awayScore;
    const opponentScore = selectedIsHome ? awayScore : homeScore;
    const adjusted = selectedScore + (leg.line_at_placement ?? 0);
    if (adjusted === opponentScore) return "push";
    return adjusted > opponentScore ? "won" : "lost";
  }

  // total
  const totalScore = homeScore + awayScore;
  const line = leg.line_at_placement ?? 0;
  if (totalScore === line) return "push";
  const overHit = totalScore > line;
  const wantsOver = leg.selection.toLowerCase() === "over";
  return overHit === wantsOver ? "won" : "lost";
}

async function finalizeBet(betId: string, userId: string, status: "won" | "lost" | "push", payout: number) {
  const { data: updated } = await supabaseAdmin
    .from("bets")
    .update({ status, payout, graded_at: new Date().toISOString() })
    .eq("id", betId)
    .eq("status", "pending")
    .select("id");

  if (!updated || updated.length === 0) return; // already settled by a previous run

  if (payout > 0) {
    const { error } = await supabaseAdmin.rpc("increment_balance", { p_user_id: userId, p_amount: payout });
    if (error) console.error(`[score-check] failed to credit user ${userId} for bet ${betId}:`, error.message);
  }
}

async function settleBetIfReady(betId: string) {
  const { data: bet } = await supabaseAdmin
    .from("bets")
    .select("id, user_id, type, wager, status")
    .eq("id", betId)
    .maybeSingle();
  if (!bet || bet.status !== "pending") return;

  const { data: legs } = await supabaseAdmin
    .from("bet_legs")
    .select("result, odds_at_placement")
    .eq("bet_id", betId);
  if (!legs || legs.length === 0) return;

  if (bet.type === "straight") {
    const leg = legs[0];
    if (leg.result === "pending") return;
    if (leg.result === "lost") return finalizeBet(bet.id, bet.user_id, "lost", 0);
    if (leg.result === "push") return finalizeBet(bet.id, bet.user_id, "push", Number(bet.wager));
    const { payout } = straightPayout(Number(bet.wager), leg.odds_at_placement);
    return finalizeBet(bet.id, bet.user_id, "won", payout);
  }

  // parlay: a single confirmed loss resolves it immediately, even with
  // other legs still pending. A push is excluded from the calculation
  // entirely. Only finalizes won/push once every leg is resolved.
  const anyLost = legs.some((l) => l.result === "lost");
  if (anyLost) return finalizeBet(bet.id, bet.user_id, "lost", 0);

  const anyPending = legs.some((l) => l.result === "pending");
  if (anyPending) return;

  const countingOdds = legs.filter((l) => l.result === "won").map((l) => l.odds_at_placement as AmericanOdds);
  const allPushed = countingOdds.length === 0;
  const payout = parlayPayout(Number(bet.wager), countingOdds);
  return finalizeBet(bet.id, bet.user_id, allPushed ? "push" : "won", payout);
}

async function gradeGame(gameId: string, homeTeam: string, awayTeam: string, homeScore: number, awayScore: number) {
  const { data: legs } = await supabaseAdmin
    .from("bet_legs")
    .select("id, bet_id, game_id, market, selection, line_at_placement, odds_at_placement, result")
    .eq("game_id", gameId)
    .eq("result", "pending");

  const affectedBetIds = new Set<string>();
  for (const leg of (legs ?? []) as BetLegRow[]) {
    const result = computeLegResult(leg, homeTeam, awayTeam, homeScore, awayScore);
    await supabaseAdmin.from("bet_legs").update({ result }).eq("id", leg.id).eq("result", "pending");
    affectedBetIds.add(leg.bet_id);
  }

  for (const betId of affectedBetIds) {
    await settleBetIfReady(betId);
  }
}

async function maybeAwardWeekBonus(weekId: string) {
  const { data: week } = await supabaseAdmin.from("toss_up_weeks").select("*").eq("id", weekId).maybeSingle();
  if (!week || week.bonus_awarded_at) return;

  const { data: weekGames } = await supabaseAdmin.from("toss_up_games").select("game_id").eq("week_id", weekId);
  if (!weekGames || weekGames.length !== 5) return;

  const gameIds = weekGames.map((g) => g.game_id);
  const { data: games } = await supabaseAdmin.from("games").select("id, status").in("id", gameIds);
  if (!games || games.length !== 5 || !games.every((g) => g.status === "final")) return;

  // Claim the award atomically so a second cron tick (or the Sunday-noon
  // safety sweep) can never double-pay this week's bonus.
  const { data: claimed } = await supabaseAdmin
    .from("toss_up_weeks")
    .update({ bonus_awarded_at: new Date().toISOString() })
    .eq("id", weekId)
    .is("bonus_awarded_at", null)
    .select("id");
  if (!claimed || claimed.length === 0) return;

  const { data: picks } = await supabaseAdmin.from("toss_up_picks").select("user_id, correct").eq("week_id", weekId);
  const scoreByUser = new Map<string, number>();
  for (const pick of picks ?? []) {
    if (!scoreByUser.has(pick.user_id)) scoreByUser.set(pick.user_id, 0);
    if (pick.correct) scoreByUser.set(pick.user_id, (scoreByUser.get(pick.user_id) ?? 0) + 1);
  }
  if (scoreByUser.size === 0) return;

  const maxScore = Math.max(...scoreByUser.values());
  const winners = [...scoreByUser.entries()].filter(([, score]) => score === maxScore).map(([userId]) => userId);
  const share = Math.round((Number(week.bonus_amount) / winners.length) * 100) / 100;

  for (const userId of winners) {
    const { error } = await supabaseAdmin.rpc("increment_balance", { p_user_id: userId, p_amount: share });
    if (error) console.error(`[score-check] failed to award toss-up bonus to ${userId}:`, error.message);
  }
}

async function gradeTossUpPicksForGame(
  gameId: string,
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number,
) {
  if (homeScore === awayScore) return; // no winner to grade against
  const winner = homeScore > awayScore ? homeTeam : awayTeam;

  const { data: picks } = await supabaseAdmin
    .from("toss_up_picks")
    .select("id, pick")
    .eq("game_id", gameId)
    .is("correct", null);

  for (const pick of picks ?? []) {
    await supabaseAdmin
      .from("toss_up_picks")
      .update({ correct: pick.pick === winner })
      .eq("id", pick.id)
      .is("correct", null);
  }

  const { data: weekLinks } = await supabaseAdmin.from("toss_up_games").select("week_id").eq("game_id", gameId);
  for (const link of weekLinks ?? []) {
    await maybeAwardWeekBonus(link.week_id);
  }
}

Deno.serve(async (req) => {
  const unauthorized = requireCronSecret(req);
  if (unauthorized) return unauthorized;

  const url = new URL(req.url);
  const forced = url.searchParams.get("force") === "true";
  const now = new Date();
  const { isTarget, target } = isNearScoreCheckTarget(now);

  if (!forced && !isTarget) {
    return Response.json({ skipped: true, reason: "not within tolerance of a score-check checkpoint" });
  }

  const apiKey = Deno.env.get("ODDS_API_KEY");
  if (!apiKey) {
    return Response.json({ error: "ODDS_API_KEY is not set" }, { status: 500 });
  }

  const apiUrl = `https://api.the-odds-api.com/v4/sports/${ODDS_API_SPORT}/scores?apiKey=${apiKey}&daysFrom=3&dateFormat=iso`;
  const apiRes = await fetch(apiUrl);

  const requestsRemaining = apiRes.headers.get("x-requests-remaining");
  const requestsUsed = apiRes.headers.get("x-requests-used");
  await supabaseAdmin.from("odds_api_quota_log").insert({
    sync_type: "scores",
    requests_remaining: requestsRemaining ? Number(requestsRemaining) : null,
    requests_used: requestsUsed ? Number(requestsUsed) : null,
  });
  console.log(`[score-check] checkpoint=${target?.label ?? "forced"} quota remaining=${requestsRemaining}`);

  if (!apiRes.ok) {
    const body = await apiRes.text();
    return Response.json({ error: "Odds API request failed", detail: body }, { status: 502 });
  }

  const events = (await apiRes.json()) as OddsApiScoreEvent[];
  let finalized = 0;

  for (const event of events) {
    if (!event.completed || !event.scores) continue;

    const { data: game } = await supabaseAdmin
      .from("games")
      .select("id, home_team, away_team, status")
      .eq("odds_api_event_id", event.id)
      .eq("status", "open")
      .maybeSingle();
    if (!game) continue;

    const homeScore = Number(event.scores.find((s) => s.name === event.home_team)?.score ?? NaN);
    const awayScore = Number(event.scores.find((s) => s.name === event.away_team)?.score ?? NaN);
    if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) continue;

    const { data: updatedGame } = await supabaseAdmin
      .from("games")
      .update({ status: "final", home_score: homeScore, away_score: awayScore })
      .eq("id", game.id)
      .eq("status", "open")
      .select("id")
      .maybeSingle();
    if (!updatedGame) continue; // already finalized by a previous run

    await gradeGame(game.id, game.home_team, game.away_team, homeScore, awayScore);
    await gradeTossUpPicksForGame(game.id, game.home_team, game.away_team, homeScore, awayScore);
    finalized++;
  }

  return Response.json({
    checkpoint: target?.label ?? "forced",
    finalized,
    quota: { requestsRemaining, requestsUsed },
  });
});
