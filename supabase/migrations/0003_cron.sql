-- Schedules the odds-sync and score-check edge functions. No secrets live
-- in this file: the shared auth header value is looked up from Supabase
-- Vault by name at call time. Seed/rotate that secret with
-- `node scripts/set-cron-secret.mjs` (reads CRON_SECRET from .env.local,
-- never committed).

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- cron.schedule() upserts by job name, so re-running this is always safe.

-- Odds sync: fire every 15 minutes, all week. The function itself checks
-- real Central time and no-ops outside the Fri-noon-through-Sat-midnight
-- window, so this schedule can be a dumb fixed interval.
select cron.schedule(
  'odds-sync-poll',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://gzgpoedlbykpiuwhyluw.supabase.co/functions/v1/odds-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Score check: fire every 5 minutes. The function checks real Central time
-- against the exact checkpoint list (with tolerance) and no-ops otherwise.
select cron.schedule(
  'score-check-poll',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://gzgpoedlbykpiuwhyluw.supabase.co/functions/v1/score-check',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
