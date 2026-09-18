import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { centralWallTimeToUtc } from "@/lib/shared/centralTime";

/** Parses an HTML datetime-local value ("YYYY-MM-DDTHH:mm") as Central wall time. */
function parseCentralDateTimeLocal(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number) as unknown as number[];
  return centralWallTimeToUtc(year, month, day, hour, minute);
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: weeks } = await supabaseAdmin
    .from("toss_up_weeks")
    .select("*, toss_up_games(game_id, games(id, home_team, away_team, kickoff_time))")
    .order("lock_time", { ascending: false });

  return NextResponse.json({ weeks: weeks ?? [] });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const label = typeof body?.label === "string" ? body.label.trim() : "";
  const lockTime = typeof body?.lockTime === "string" ? parseCentralDateTimeLocal(body.lockTime) : null;
  const bonusAmount = typeof body?.bonusAmount === "number" ? body.bonusAmount : 100;

  if (!label || !lockTime || Number.isNaN(lockTime.getTime())) {
    return NextResponse.json({ error: "Provide a label and a valid lock time." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("toss_up_weeks")
    .insert({ label, lock_time: lockTime.toISOString(), bonus_amount: bonusAmount })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: "Could not create week." }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
