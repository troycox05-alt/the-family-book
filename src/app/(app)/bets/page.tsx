import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { MyBetsList } from "@/components/bets/MyBetsList";

export default async function MyBetsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { data: bets } = await supabaseAdmin
    .from("bets")
    .select(
      "id, type, status, wager, payout, placed_at, bet_legs(market, selection, line_at_placement, odds_at_placement, result, games(home_team, away_team))",
    )
    .eq("user_id", session.sub)
    .order("placed_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl text-ink font-bold mb-4">My Bets</h1>
      <MyBetsList bets={bets ?? []} />
    </div>
  );
}
