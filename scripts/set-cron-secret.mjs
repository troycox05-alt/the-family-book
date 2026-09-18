// Seeds/rotates the 'cron_secret' entry in Supabase Vault that the
// odds-sync and score-check cron jobs (see supabase/migrations/0003_cron.sql)
// use to authenticate to the edge functions. Reads CRON_SECRET from
// .env.local so the value never appears in a committed file.
//
// Usage: node scripts/set-cron-secret.mjs

import { readFileSync } from "node:fs";
import { Client } from "pg";

function loadEnvLocal() {
  const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const env = {};
  for (const line of text.split("\n")) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) env[match[1]] = match[2];
  }
  return env;
}

const env = loadEnvLocal();
const required = ["SUPABASE_DB_PASSWORD", "SUPABASE_PROJECT_REF", "CRON_SECRET"];
for (const key of required) {
  if (!env[key]) {
    console.error(`Missing ${key} in .env.local`);
    process.exit(1);
  }
}

const client = new Client({
  connectionString: `postgresql://postgres:${env.SUPABASE_DB_PASSWORD}@db.${env.SUPABASE_PROJECT_REF}.supabase.co:5432/postgres`,
});

await client.connect();

const { rows } = await client.query("select id from vault.secrets where name = 'cron_secret'");

if (rows.length > 0) {
  await client.query("select vault.update_secret($1, $2)", [rows[0].id, env.CRON_SECRET]);
  console.log("Updated existing 'cron_secret' in Vault.");
} else {
  await client.query("select vault.create_secret($1, 'cron_secret', 'Shared secret for odds-sync / score-check cron auth')", [
    env.CRON_SECRET,
  ]);
  console.log("Created 'cron_secret' in Vault.");
}

await client.end();
