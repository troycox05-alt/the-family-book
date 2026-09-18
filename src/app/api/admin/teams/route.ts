import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { supabaseAdmin } from "@/lib/supabase/admin";

const CONFERENCES = ["ACC", "Big Ten", "Big 12", "SEC"];

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: teams } = await supabaseAdmin.from("teams").select("*").order("conference").order("name");
  return NextResponse.json({ teams: teams ?? [] });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const conference = typeof body?.conference === "string" ? body.conference : "";

  if (!name || !CONFERENCES.includes(conference)) {
    return NextResponse.json({ error: "Provide a name and a valid conference." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("teams").insert({ name, conference });
  if (error) {
    return NextResponse.json({ error: error.code === "23505" ? "That team already exists." : "Could not add team." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
