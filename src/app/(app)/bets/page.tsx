import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";
import { formatAmericanOdds } from "@/lib/shared/format";
import { legSelectionLabel } from "@/lib/shared/legLabel";

const STATUS_CLASS: Record<string, string> = {
  pending: "text-muted",
  won: "text-win",
  lost: "text-loss",
  push: "text-push",
  void: "text-muted",
};

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
      <h1 className="text-2xl text-primary mb-4">My Bets</h1>
      <div className="flex flex-col gap-3">
        {(bets ?? []).map((bet) => (
          <Card key={bet.id} className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted">
                {bet.type} &middot; ${Number(bet.wager).toFixed(2)}
              </span>
              <span className={`text-sm font-semibold ${STATUS_CLASS[bet.status]}`}>
                {bet.status}
                {bet.status !== "pending" && bet.payout !== null && ` — $${Number(bet.payout).toFixed(2)}`}
              </span>
            </div>
            <ul className="flex flex-col gap-1">
              {bet.bet_legs.map((leg, i) => (
                <li key={i} className="text-sm text-ink">
                  {legSelectionLabel(leg)} ({formatAmericanOdds(leg.odds_at_placement)})
                  {leg.games && (
                    <span className="text-muted">
                      {" "}
                      &mdash; {leg.games.away_team} @ {leg.games.home_team}
                    </span>
                  )}
                  <span className={`ml-2 text-xs ${STATUS_CLASS[leg.result]}`}>[{leg.result}]</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
        {(!bets || bets.length === 0) && <p className="text-muted">No bets yet &mdash; head to Games to get started.</p>}
      </div>
    </div>
  );
}
