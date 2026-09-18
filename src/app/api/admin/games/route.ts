import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: games } = await supabaseAdmin
    .from("games")
    .select("*")
    .order("week", { ascending: false })
    .order("kickoff_time", { ascending: true });

  return NextResponse.json({ games: games ?? [] });
}

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : Number(trimmed);
}

/**
 * Bulk-paste a week's slate. Body: { rows: string } where each line is CSV:
 * week,kickoff_time_iso,home_team,away_team,spread_line,spread_odds,moneyline_home,moneyline_away,total,total_odds
 * Trailing fields may be blank. Always inserts new rows (manually-added
 * games get odds_api_event_id = null, so the odds sync never touches them);
 * use the single-game edit endpoint to correct an existing row.
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const rowsText = typeof body?.rows === "string" ? body.rows : "";
  const lines = rowsText
    .split("\n")
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 0);

  if (lines.length === 0) {
    return NextResponse.json({ error: "No rows to add." }, { status: 400 });
  }

  const inserts = [];
  for (const [index, line] of lines.entries()) {
    const parts = line.split(",").map((p: string) => p.trim());
    if (parts.length < 4) {
      return NextResponse.json({ error: `Line ${index + 1}: need at least week,kickoff_time,home_team,away_team.` }, { status: 400 });
    }
    const [week, kickoff, homeTeam, awayTeam, spreadLine, spreadOdds, moneylineHome, moneylineAway, total, totalOdds] = parts;
    const kickoffDate = new Date(kickoff);
    if (!homeTeam || !awayTeam || Number.isNaN(kickoffDate.getTime())) {
      return NextResponse.json({ error: `Line ${index + 1}: invalid kickoff time or team names.` }, { status: 400 });
    }
    inserts.push({
      week: Number(week),
      kickoff_time: kickoffDate.toISOString(),
      home_team: homeTeam,
      away_team: awayTeam,
      spread_line: spreadLine ? toNullableNumber(spreadLine) : null,
      spread_odds: spreadOdds ? toNullableNumber(spreadOdds) : null,
      moneyline_home: moneylineHome ? toNullableNumber(moneylineHome) : null,
      moneyline_away: moneylineAway ? toNullableNumber(moneylineAway) : null,
      total: total ? toNullableNumber(total) : null,
      total_odds: totalOdds ? toNullableNumber(totalOdds) : null,
      status: "open" as const,
    });
  }

  const { data, error } = await supabaseAdmin.from("games").insert(inserts).select("id");
  if (error) {
    return NextResponse.json({ error: "Could not insert games." }, { status: 500 });
  }

  return NextResponse.json({ inserted: data.length });
}
