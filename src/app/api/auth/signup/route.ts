import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hashPin } from "@/lib/auth/pin";
import { validateUsername, validatePin, isAdminUsername } from "@/lib/auth/validation";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";

const STARTING_BALANCE = 500;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const pin = typeof body?.pin === "string" ? body.pin : "";

  const usernameError = validateUsername(username);
  if (usernameError) {
    return NextResponse.json({ error: usernameError }, { status: 400 });
  }
  const pinError = validatePin(pin);
  if (pinError) {
    return NextResponse.json({ error: pinError }, { status: 400 });
  }

  const pinHash = await hashPin(pin);
  const isAdmin = isAdminUsername(username);

  // Race conditions on duplicate usernames are handled by the unique index
  // on lower(username), not a check-then-insert (which would be racy).
  const { data: user, error: insertError } = await supabaseAdmin
    .from("users")
    .insert({ username, pin_hash: pinHash, balance: STARTING_BALANCE, is_admin: isAdmin })
    .select("id, username, balance, is_admin")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "That username is taken." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not create account." }, { status: 500 });
  }

  const token = await createSessionToken({
    sub: user.id,
    username: user.username,
    isAdmin: user.is_admin,
  });
  await setSessionCookie(token);

  return NextResponse.json({
    user: { id: user.id, username: user.username, balance: user.balance, isAdmin: user.is_admin },
  });
}
