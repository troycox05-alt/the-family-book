import { supabaseAdmin } from "@/lib/supabase/admin";
import { BetSlipProvider } from "@/components/betslip/BetSlipContext";
import { BetSlip } from "@/components/betslip/BetSlip";
import { GameCard, type GameCardData } from "@/components/games/GameCard";
import { LiveFeed } from "@/components/feed/LiveFeed";

export default async function GamesPage() {
  const { data: games } = await supabaseAdmin
    .from("games")
    .select(
      "id, week, home_team, away_team, kickoff_time, spread_line, spread_odds, moneyline_home, moneyline_away, total, total_odds",
    )
    .eq("status", "open")
    .order("week", { ascending: true })
    .order("kickoff_time", { ascending: true });

  const gamesByWeek = new Map<number, GameCardData[]>();
  for (const g of games ?? []) {
    const list = gamesByWeek.get(g.week) ?? [];
    list.push({
      id: g.id,
      homeTeam: g.home_team,
      awayTeam: g.away_team,
      kickoffTime: g.kickoff_time,
      spreadLine: g.spread_line !== null ? Number(g.spread_line) : null,
      spreadOdds: g.spread_odds,
      moneylineHome: g.moneyline_home,
      moneylineAway: g.moneyline_away,
      total: g.total !== null ? Number(g.total) : null,
      totalOdds: g.total_odds,
    });
    gamesByWeek.set(g.week, list);
  }
  const weeks = [...gamesByWeek.keys()].sort((a, b) => a - b);

  return (
    <BetSlipProvider>
      <div className="flex flex-col gap-6 pb-32 lg:flex-row lg:items-start lg:gap-6 lg:pb-6">
        <div className="flex-1">
          <h1 className="font-display text-2xl text-brass-light mb-4">This Week&rsquo;s Slate</h1>
          {weeks.length === 0 && (
            <p className="text-cream-dim">
              No open games yet. The odds sync runs hourly Friday noon through Saturday night, Central.
            </p>
          )}
          {weeks.map((week) => (
            <div key={week} className="mb-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brass">
                {week === 0 ? "Week 0" : `Week ${week}`}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {gamesByWeek.get(week)!.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="lg:w-80 lg:shrink-0 flex flex-col gap-6">
          <BetSlip />
          <LiveFeed />
        </div>
      </div>
    </BetSlipProvider>
  );
}
