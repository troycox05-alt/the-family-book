import "server-only";
import { getSession } from "./session";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Re-checks is_admin from the DB rather than trusting the JWT claim, so
// revoking admin (there's no UI for that yet, but there will be) takes
// effect immediately rather than waiting for the session to expire.
export async function requireAdmin() {
  const session = await getSession();
  if (!session) return null;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, username, is_admin")
    .eq("id", session.sub)
    .maybeSingle();

  if (!user || !user.is_admin) return null;
  return user;
}
