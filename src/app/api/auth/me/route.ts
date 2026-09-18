import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Re-fetches from the DB rather than trusting the JWT claims, since balance
// changes constantly and the token is only refreshed on login/signup.
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, username, balance, is_admin")
    .eq("id", session.sub)
    .maybeSingle();

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: { id: user.id, username: user.username, balance: user.balance, isAdmin: user.is_admin },
  });
}
