/**
 * Every edge function in this project is invoked either by a Postgres cron
 * job (via pg_net) or by the Next.js admin API (server-to-server, never
 * from a browser), both of which send this header. Returns a 401 Response
 * to short-circuit the caller, or null if the request is authorized.
 */
export function requireCronSecret(req: Request): Response | null {
  const provided = req.headers.get("x-cron-secret");
  const expected = Deno.env.get("CRON_SECRET");
  if (!expected || provided !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}
