import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

/** Manually triggers the odds-sync or score-check edge function, bypassing its Central-time window check. */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const kind = body?.kind === "scores" ? "score-check" : body?.kind === "odds" ? "odds-sync" : null;
  if (!kind) return NextResponse.json({ error: "kind must be 'odds' or 'scores'." }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cronSecret = process.env.CRON_SECRET;
  if (!url || !cronSecret) {
    return NextResponse.json({ error: "Server is missing sync configuration." }, { status: 500 });
  }

  const res = await fetch(`${url}/functions/v1/${kind}?force=true`, {
    method: "POST",
    headers: { "x-cron-secret": cronSecret },
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json({ error: "Sync failed.", detail: data }, { status: 502 });
  }
  return NextResponse.json(data);
}
