-- The Family Book: core schema
-- Auth is custom (username + bcrypt PIN), not Supabase Auth, so RLS below is
-- deliberately coarse: public tables allow anonymous SELECT, and there are
-- NO client-side write policies anywhere. Every write (account creation,
-- bet placement, grading, balance changes, toss-up picks, admin edits) goes
-- through a Next.js server route using the service role key, which bypasses
-- RLS and enforces ownership/business rules in application code. See
-- src/lib/auth/session.ts and src/lib/supabase/admin.ts.

create extension if not exists pgcrypto;

-- =========================================================================
-- users
-- =========================================================================
create table public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  pin_hash text not null,
  balance numeric(12, 2) not null default 500.00,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- case-insensitive uniqueness ("Troy" and "troy" are the same account)
create unique index users_username_lower_idx on public.users (lower(username));

alter table public.users enable row level security;
-- Intentionally no SELECT/INSERT/UPDATE/DELETE policies for anon/authenticated.
-- pin_hash must never be readable by the client; the base table is reached
-- only via the service role from server routes. Public-safe columns are
-- exposed through the public.leaderboard view below.

-- Public-safe view for the leaderboard / general "who is who" reads.
-- Never include pin_hash here.
create view public.leaderboard as
  select id, username, balance, is_admin, created_at
  from public.users;

grant select on public.leaderboard to anon, authenticated;

-- =========================================================================
-- teams (Power 4 roster, used to filter incoming odds)
-- =========================================================================
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  conference text not null check (conference in ('ACC', 'Big Ten', 'Big 12', 'SEC')),
  created_at timestamptz not null default now()
);

create unique index teams_name_lower_idx on public.teams (lower(name));

alter table public.teams enable row level security;
create policy "teams are publicly readable" on public.teams
  for select using (true);
-- No client write policies; admin panel writes via service role.

-- =========================================================================
-- games
-- =========================================================================
create table public.games (
  id uuid primary key default gen_random_uuid(),
  odds_api_event_id text unique,
  week integer not null,
  home_team text not null,
  away_team text not null,
  home_team_id uuid references public.teams (id),
  away_team_id uuid references public.teams (id),
  kickoff_time timestamptz not null,
  spread_line numeric(5, 1),
  spread_odds integer,
  moneyline_home integer,
  moneyline_away integer,
  total numeric(5, 1),
  total_odds integer,
  status text not null default 'open' check (status in ('open', 'final', 'void')),
  home_score integer,
  away_score integer,
  last_odds_sync timestamptz,
  created_at timestamptz not null default now()
);

create index games_week_idx on public.games (week);
create index games_status_idx on public.games (status);
create index games_kickoff_idx on public.games (kickoff_time);

alter table public.games enable row level security;
create policy "games are publicly readable" on public.games
  for select using (true);
-- No client write policies; odds sync (service role) and admin panel own writes.

-- =========================================================================
-- game_line_history (snapshot of the previous line, taken right before an
-- odds-sync update overwrites it in place, so we can show line movement)
-- =========================================================================
create table public.game_line_history (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  spread_line numeric(5, 1),
  spread_odds integer,
  moneyline_home integer,
  moneyline_away integer,
  total numeric(5, 1),
  total_odds integer,
  recorded_at timestamptz not null default now()
);

create index game_line_history_game_id_idx on public.game_line_history (game_id);

alter table public.game_line_history enable row level security;
create policy "line history is publicly readable" on public.game_line_history
  for select using (true);

-- =========================================================================
-- bets / bet_legs
-- =========================================================================
create table public.bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id),
  type text not null check (type in ('straight', 'parlay')),
  status text not null default 'pending' check (status in ('pending', 'won', 'lost', 'push', 'void')),
  wager numeric(12, 2) not null check (wager > 0),
  payout numeric(12, 2),
  placed_at timestamptz not null default now(),
  graded_at timestamptz
);

create index bets_user_id_idx on public.bets (user_id);
create index bets_status_idx on public.bets (status);
create index bets_placed_at_idx on public.bets (placed_at desc);

alter table public.bets enable row level security;
create policy "bets are publicly readable" on public.bets
  for select using (true);
-- Public on purpose: the live bet feed broadcasts every wager to everyone,
-- same as the real signage in a sportsbook lounge. No client write policies;
-- placement/grading happens server-side (deducts/credits balance atomically).

create table public.bet_legs (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references public.bets (id) on delete cascade,
  game_id uuid not null references public.games (id),
  market text not null check (market in ('spread', 'moneyline', 'total')),
  selection text not null,
  line_at_placement numeric(5, 1),
  odds_at_placement integer not null,
  result text not null default 'pending' check (result in ('pending', 'won', 'lost', 'push'))
);

create index bet_legs_bet_id_idx on public.bet_legs (bet_id);
create index bet_legs_game_id_idx on public.bet_legs (game_id);

alter table public.bet_legs enable row level security;
create policy "bet legs are publicly readable" on public.bet_legs
  for select using (true);

-- =========================================================================
-- Toss-Up Five
-- =========================================================================
create table public.toss_up_weeks (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  lock_time timestamptz not null,
  bonus_amount numeric(12, 2) not null default 100.00,
  created_at timestamptz not null default now()
);

alter table public.toss_up_weeks enable row level security;
create policy "toss-up weeks are publicly readable" on public.toss_up_weeks
  for select using (true);

create table public.toss_up_games (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.toss_up_weeks (id) on delete cascade,
  game_id uuid not null references public.games (id),
  unique (week_id, game_id)
);

alter table public.toss_up_games enable row level security;
create policy "toss-up games are publicly readable" on public.toss_up_games
  for select using (true);

-- Enforce "exactly 5 per week" at the DB level as a backstop (the admin API
-- also enforces this before allowing the week to be published).
create function public.enforce_toss_up_games_limit()
returns trigger as $$
begin
  if (select count(*) from public.toss_up_games where week_id = new.week_id) >= 5 then
    raise exception 'A toss-up week can have at most 5 games';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger toss_up_games_limit_trigger
  before insert on public.toss_up_games
  for each row execute function public.enforce_toss_up_games_limit();

-- toss_up_picks is intentionally NOT publicly readable. The "can't see
-- others' picks until you've submitted all 5, unless it's past lock_time"
-- rule is a per-user conditional that RLS can't express cleanly without a
-- real auth.uid(); it's enforced in the /api/toss-up route instead, which
-- reads the session cookie and queries this table with the service role.
create table public.toss_up_picks (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.toss_up_weeks (id) on delete cascade,
  user_id uuid not null references public.users (id),
  game_id uuid not null references public.games (id),
  pick text not null,
  submitted_at timestamptz not null default now(),
  correct boolean,
  unique (week_id, user_id, game_id)
);

create index toss_up_picks_week_id_idx on public.toss_up_picks (week_id);
create index toss_up_picks_user_id_idx on public.toss_up_picks (user_id);

alter table public.toss_up_picks enable row level security;
-- No policies: all access via service role through the server route.

-- =========================================================================
-- odds_api_quota_log (visibility into the-odds-api.com monthly quota)
-- =========================================================================
create table public.odds_api_quota_log (
  id uuid primary key default gen_random_uuid(),
  sync_type text not null check (sync_type in ('odds', 'scores')),
  requests_used integer,
  requests_remaining integer,
  checked_at timestamptz not null default now()
);

alter table public.odds_api_quota_log enable row level security;
-- No client policies at all; admin-only, read via service role in the admin panel.
