import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateLeg } from "@/lib/bets/validateLeg";
import type { PlaceBetInput } from "@/lib/bets/types";

function isValidWager(wager: unknown): wager is number {
  return typeof wager === "number" && Number.isFinite(wager) && wager > 0 && Math.round(wager * 100) === wager * 100;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "You need to be logged in." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as PlaceBetInput | null;
  if (!body || (body.type !== "straight" && body.type !== "parlay") || !Array.isArray(body.legs)) {
    return NextResponse.json({ error: "Malformed bet." }, { status: 400 });
  }
  if (!isValidWager(body.wager)) {
    return NextResponse.json({ error: "Wager must be a positive dollar amount." }, { status: 400 });
  }
  if (body.type === "straight" && body.legs.length !== 1) {
    return NextResponse.json({ error: "A straight bet needs exactly one selection." }, { status: 400 });
  }
  if (body.type === "parlay" && body.legs.length < 2) {
    return NextResponse.json({ error: "A parlay needs at least two selections." }, { status: 400 });
  }
  if (body.type === "parlay" && new Set(body.legs.map((l) => l.gameId)).size !== body.legs.length) {
    return NextResponse.json({ error: "A parlay can't have two legs on the same game." }, { status: 400 });
  }

  let validatedLegs;
  try {
    validatedLegs = await Promise.all(body.legs.map(validateLeg));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Invalid bet." }, { status: 400 });
  }

  const { data: betId, error } = await supabaseAdmin.rpc("place_bet", {
    p_user_id: session.sub,
    p_type: body.type,
    p_wager: body.wager,
    p_legs: validatedLegs,
  });

  if (error) {
    const message = error.message.includes("Insufficient balance")
      ? "You don't have enough balance for that wager."
      : "Could not place that bet.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ betId });
}
