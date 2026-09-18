import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyPin } from "@/lib/auth/pin";
import { escapeLikePattern } from "@/lib/auth/validation";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const pin = typeof body?.pin === "string" ? body.pin : "";

  if (!username || !pin) {
    return NextResponse.json({ error: "Username and PIN are required." }, { status: 400 });
  }

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, username, pin_hash, balance, is_admin")
    .ilike("username", escapeLikePattern(username))
    .maybeSingle();

  // Same generic message whether the username doesn't exist or the PIN is
  // wrong, so login can't be used to enumerate registered usernames.
  const invalid = () => NextResponse.json({ error: "Invalid username or PIN." }, { status: 401 });

  if (error || !user) {
    return invalid();
  }

  const valid = await verifyPin(pin, user.pin_hash);
  if (!valid) {
    return invalid();
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
