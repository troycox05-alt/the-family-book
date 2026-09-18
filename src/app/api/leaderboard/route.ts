import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";

type GradedBet = {
  id: string;
  user_id: string;
  wager: number;
  payout: number | null;
  status: "won" | "lost" | "push" | "void";
  bet_legs: { games: { week: number } | null }[];
};

function betProfit(bet: GradedBet): number {
  if (bet.status === "won") return Number(bet.payout ?? 0) - Number(bet.wager);
  if (bet.status === "lost") return -Number(bet.wager);
  return 0; // push / void
}

/**
 * A parlay's legs could in principle span more than one CFB week (nothing
 * stops picking games from two different open weeks); we attribute the
 * whole bet to the earliest week among its legs. Straight bets always have
 * exactly one, so this is exact for the common case.
 */
function betWeek(bet: GradedBet): number | null {
  const weeks = bet.bet_legs.map((l) => l.games?.week).filter((w): w is number => w !== undefined && w !== null);
  return weeks.length > 0 ? Math.min(...weeks) : null;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "You need to be logged in." }, { status: 401 });
  }

  const { data: overall } = await supabaseAdmin
    .from("leaderboard")
    .select("id, username, balance")
    .order("balance", { ascending: false });

  const { data: gradedBets } = await supabaseAdmin
    .from("bets")
    .select("id, user_id, wager, payout, status, bet_legs(games(week))")
    .neq("status", "pending")
    .returns<GradedBet[]>();

  const weeksWithActivity = new Set<number>();
  for (const bet of gradedBets ?? []) {
    const week = betWeek(bet);
    if (week !== null) weeksWithActivity.add(week);
  }
  const weeks = [...weeksWithActivity].sort((a, b) => b - a);

  const weekParam = request.nextUrl.searchParams.get("week");
  let weekly: { week: number; standings: { id: string; username: string; profit: number }[] } | null = null;

  if (weekParam !== null) {
    const targetWeek = Number(weekParam);
    const profitByUser = new Map<string, number>();
    for (const bet of gradedBets ?? []) {
      if (betWeek(bet) !== targetWeek) continue;
      profitByUser.set(bet.user_id, (profitByUser.get(bet.user_id) ?? 0) + betProfit(bet));
    }

    const usernameById = new Map((overall ?? []).map((u) => [u.id, u.username]));
    const standings = [...profitByUser.entries()]
      .map(([id, profit]) => ({ id, username: usernameById.get(id) ?? "someone", profit: Math.round(profit * 100) / 100 }))
      .sort((a, b) => b.profit - a.profit);

    weekly = { week: targetWeek, standings };
  }

  return NextResponse.json({ overall: overall ?? [], weeks, weekly });
}
