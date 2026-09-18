import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/toss-up?weekId=... (defaults to the week with the latest lock_time)
//
// Visibility rule: a user can't see anyone else's picks for the week until
// they've submitted all 5 of their own, OR the week has passed lock_time
// (at which point everything opens up to everyone regardless of submission
// status). This can't be expressed as a static RLS policy since it depends
// on the requesting user's own submission state, so toss_up_picks has no
// public RLS policy at all — this route is the only way to read it, using
// the service role after resolving who's asking from the session cookie.
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "You need to be logged in." }, { status: 401 });
  }

  const weekId = request.nextUrl.searchParams.get("weekId");

  const weekQuery = supabaseAdmin
    .from("toss_up_weeks")
    .select("id, label, lock_time, bonus_amount, bonus_awarded_at")
    .order("lock_time", { ascending: false })
    .limit(1);

  const { data: week } = weekId
    ? await supabaseAdmin
        .from("toss_up_weeks")
        .select("id, label, lock_time, bonus_amount, bonus_awarded_at")
        .eq("id", weekId)
        .maybeSingle()
    : await weekQuery.maybeSingle();

  if (!week) {
    return NextResponse.json({ week: null });
  }

  const { data: weekGames } = await supabaseAdmin
    .from("toss_up_games")
    .select("game_id, games(id, home_team, away_team, kickoff_time, status, home_score, away_score)")
    .eq("week_id", week.id);

  const games = (weekGames ?? [])
    .map((wg) => wg.games)
    .filter((g): g is NonNullable<typeof g> => g !== null)
    .sort((a, b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime());

  const { data: myPickRows } = await supabaseAdmin
    .from("toss_up_picks")
    .select("game_id, pick, correct")
    .eq("week_id", week.id)
    .eq("user_id", session.sub);

  const myPicks: Record<string, { pick: string; correct: boolean | null }> = {};
  for (const row of myPickRows ?? []) {
    myPicks[row.game_id] = { pick: row.pick, correct: row.correct };
  }

  const isPastLock = Date.now() >= new Date(week.lock_time).getTime();
  const hasSubmittedAll = games.length > 0 && games.every((g) => myPicks[g.id] !== undefined);
  const visible = isPastLock || hasSubmittedAll;

  let others: { userId: string; username: string; picks: Record<string, { pick: string; correct: boolean | null }> }[] = [];

  if (visible) {
    const { data: allPickRows } = await supabaseAdmin
      .from("toss_up_picks")
      .select("user_id, game_id, pick, correct")
      .eq("week_id", week.id);

    const { data: users } = await supabaseAdmin.from("leaderboard").select("id, username");
    const usernameById = new Map((users ?? []).map((u) => [u.id, u.username]));

    const byUser = new Map<string, Record<string, { pick: string; correct: boolean | null }>>();
    for (const row of allPickRows ?? []) {
      if (!byUser.has(row.user_id)) byUser.set(row.user_id, {});
      byUser.get(row.user_id)![row.game_id] = { pick: row.pick, correct: row.correct };
    }

    others = [...byUser.entries()]
      .filter(([userId]) => userId !== session.sub)
      .map(([userId, picks]) => ({ userId, username: usernameById.get(userId) ?? "someone", picks }));
  }

  return NextResponse.json({
    week: {
      id: week.id,
      label: week.label,
      lockTime: week.lock_time,
      bonusAmount: Number(week.bonus_amount),
      bonusAwarded: week.bonus_awarded_at !== null,
    },
    games: games.map((g) => ({
      id: g.id,
      homeTeam: g.home_team,
      awayTeam: g.away_team,
      kickoffTime: g.kickoff_time,
      status: g.status,
      homeScore: g.home_score,
      awayScore: g.away_score,
    })),
    myPicks,
    isPastLock,
    visible,
    others,
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "You need to be logged in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const weekId = typeof body?.weekId === "string" ? body.weekId : null;
  const gameId = typeof body?.gameId === "string" ? body.gameId : null;
  const pick = typeof body?.pick === "string" ? body.pick : null;

  if (!weekId || !gameId || !pick) {
    return NextResponse.json({ error: "Malformed pick." }, { status: 400 });
  }

  const { data: week } = await supabaseAdmin.from("toss_up_weeks").select("id, lock_time").eq("id", weekId).maybeSingle();
  if (!week) {
    return NextResponse.json({ error: "That week doesn't exist." }, { status: 404 });
  }
  if (Date.now() >= new Date(week.lock_time).getTime()) {
    return NextResponse.json({ error: "Picks are locked for this week." }, { status: 400 });
  }

  const { data: link } = await supabaseAdmin
    .from("toss_up_games")
    .select("game_id, games(home_team, away_team)")
    .eq("week_id", weekId)
    .eq("game_id", gameId)
    .maybeSingle();
  if (!link || !link.games) {
    return NextResponse.json({ error: "That game isn't part of this week's Toss-Up Five." }, { status: 400 });
  }
  if (pick !== link.games.home_team && pick !== link.games.away_team) {
    return NextResponse.json({ error: "Pick must be one of the two teams playing." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("toss_up_picks")
    .upsert(
      { week_id: weekId, user_id: session.sub, game_id: gameId, pick, submitted_at: new Date().toISOString() },
      { onConflict: "week_id,user_id,game_id" },
    );

  if (error) {
    return NextResponse.json({ error: "Could not save your pick." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
