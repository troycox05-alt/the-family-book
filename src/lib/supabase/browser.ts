import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Anon-key client for public, read-only data (leaderboard, games, live bet
 * feed). RLS on those tables allows anonymous SELECT; every write in the
 * app goes through a server route instead, so this client is never used
 * for mutations.
 */
export const supabasePublic = createClient<Database>(url, anonKey, {
  auth: { persistSession: false },
});
