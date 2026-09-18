import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { centralWallTimeToUtc } from "@/lib/shared/centralTime";
import type { Database } from "@/lib/supabase/database.types";

type WeekUpdate = Database["public"]["Tables"]["toss_up_weeks"]["Update"];

/** Parses an HTML datetime-local value ("YYYY-MM-DDTHH:mm") as Central wall time. */
function parseCentralDateTimeLocal(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number) as unknown as number[];
  return centralWallTimeToUtc(year, month, day, hour, minute);
}

/**
 * PATCH body can include label/lockTime/bonusAmount and/or gameIds (an
 * array of exactly 5 game ids that replaces the week's Toss-Up Five
 * entirely — simplest way to let the admin edit the set without a
 * diff-based add/remove UI).
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Malformed request." }, { status: 400 });

  const update: WeekUpdate = {};
  if (typeof body.label === "string") update.label = body.label.trim();
  if (typeof body.lockTime === "string") {
    const parsed = parseCentralDateTimeLocal(body.lockTime);
    if (!parsed) return NextResponse.json({ error: "Invalid lock time." }, { status: 400 });
    update.lock_time = parsed.toISOString();
  }
  if (typeof body.bonusAmount === "number") update.bonus_amount = body.bonusAmount;

  if (Object.keys(update).length > 0) {
    const { error } = await supabaseAdmin.from("toss_up_weeks").update(update).eq("id", id);
    if (error) return NextResponse.json({ error: "Could not update week." }, { status: 500 });
  }

  if (Array.isArray(body.gameIds)) {
    const gameIds: string[] = body.gameIds;
    if (gameIds.length !== 5 || new Set(gameIds).size !== 5) {
      return NextResponse.json({ error: "A Toss-Up week needs exactly 5 distinct games." }, { status: 400 });
    }

    const { error: deleteError } = await supabaseAdmin.from("toss_up_games").delete().eq("week_id", id);
    if (deleteError) return NextResponse.json({ error: "Could not update the game list." }, { status: 500 });

    const { error: insertError } = await supabaseAdmin
      .from("toss_up_games")
      .insert(gameIds.map((gameId) => ({ week_id: id, game_id: gameId })));
    if (insertError) return NextResponse.json({ error: "Could not save the 5 games." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
