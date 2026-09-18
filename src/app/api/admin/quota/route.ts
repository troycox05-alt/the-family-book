import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: log } = await supabaseAdmin
    .from("odds_api_quota_log")
    .select("*")
    .order("checked_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ log: log ?? [] });
}
