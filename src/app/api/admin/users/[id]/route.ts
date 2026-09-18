import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Directly sets a user's balance (admin correction) — intentionally bypasses increment_balance's non-negative guard, since this IS the correction mechanism of last resort. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const balance = typeof body?.balance === "number" ? body.balance : null;

  if (balance === null || !Number.isFinite(balance)) {
    return NextResponse.json({ error: "Provide a numeric balance." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("users").update({ balance }).eq("id", id);
  if (error) return NextResponse.json({ error: "Could not update balance." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
