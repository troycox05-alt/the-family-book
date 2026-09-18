import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { voidGameBets } from "@/lib/bets/settle";
import type { Database } from "@/lib/supabase/database.types";

type GameUpdate = Database["public"]["Tables"]["games"]["Update"];

const EDITABLE_FIELDS = [
  "week",
  "home_team",
  "away_team",
  "kickoff_time",
  "spread_line",
  "spread_odds",
  "moneyline_home",
  "moneyline_away",
  "total",
  "total_odds",
  "status",
  "home_score",
  "away_score",
] as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Malformed request." }, { status: 400 });

  const update: GameUpdate = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) update[field] = body[field];
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("games").update(update).eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Could not update game." }, { status: 500 });
  }

  if (update.status === "void") {
    await voidGameBets(id);
  }

  return NextResponse.json({ ok: true });
}
