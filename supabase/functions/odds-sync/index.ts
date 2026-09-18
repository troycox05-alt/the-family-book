// Syncs CFB spreads + moneylines from The Odds API, filtered to games
// involving at least one Power 4 team. Runs on a cron schedule (see
// supabase/migrations/0002_cron.sql) every ~15-30 min; internally decides
// whether it's actually within the Fri-noon-through-Sat-midnight polling
// window using real Central time (DST-safe), so the cron schedule itself
// can be a dumb fixed interval.
//
// Call with ?force=true (still requires the x-cron-secret header) to run
// regardless of the window — used by the admin panel's manual "sync now".

import { requireCronSecret } from "../_shared/auth.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { isWithinOddsPollingWindow } from "../_shared/centralTime.ts";
import { computeWeekNumber } from "../_shared/season.ts";
import { matchP4Team } from "../_shared/teamMatch.ts";

const ODDS_API_SPORT = "americanfootball_ncaaf";
const BOOKMAKER_PRIORITY = ["draftkings", "fanduel", "betmgm", "caesars", "bovada"];

type OddsApiOutcome = { name: string; price: number; point?: number };
type OddsApiMarket = { key: string; outcomes: OddsApiOutcome[] };
type OddsApiBookmaker = { key: string; markets: OddsApiMarket[] };
type OddsApiEvent = {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsApiBookmaker[];
};

function pickBookmaker(event: OddsApiEvent): OddsApiBookmaker | null {
  for (const key of BOOKMAKER_PRIORITY) {
    const found = event.bookmakers.find((b) => b.key === key);
    if (found) return found;
  }
  return event.bookmakers[0] ?? null;
}

Deno.serve(async (req) => {
  const unauthorized = requireCronSecret(req);
  if (unauthorized) return unauthorized;

  const url = new URL(req.url);
  const forced = url.searchParams.get("force") === "true";
  const now = new Date();

  if (!forced && !isWithinOddsPollingWindow(now)) {
    return Response.json({ skipped: true, reason: "outside Fri noon - Sat midnight Central polling window" });
  }

  const apiKey = Deno.env.get("ODDS_API_KEY");
  if (!apiKey) {
    return Response.json({ error: "ODDS_API_KEY is not set" }, { status: 500 });
  }

  const { data: teams, error: teamsError } = await supabaseAdmin.from("teams").select("id, name");
  if (teamsError || !teams) {
    return Response.json({ error: "Could not load teams" }, { status: 500 });
  }
  const p4Names = teams.map((t) => t.name);
  const teamIdByName = new Map(teams.map((t) => [t.name, t.id]));

  const apiUrl = `https://api.the-odds-api.com/v4/sports/${ODDS_API_SPORT}/odds?apiKey=${apiKey}&regions=us&markets=spreads,h2h&oddsFormat=american&dateFormat=iso`;
  const apiRes = await fetch(apiUrl);

  const requestsRemaining = apiRes.headers.get("x-requests-remaining");
  const requestsUsed = apiRes.headers.get("x-requests-used");
  await supabaseAdmin.from("odds_api_quota_log").insert({
    sync_type: "odds",
    requests_remaining: requestsRemaining ? Number(requestsRemaining) : null,
    requests_used: requestsUsed ? Number(requestsUsed) : null,
  });
  console.log(`[odds-sync] quota remaining=${requestsRemaining} used=${requestsUsed}`);

  if (!apiRes.ok) {
    const body = await apiRes.text();
    return Response.json({ error: "Odds API request failed", detail: body }, { status: 502 });
  }

  const events = (await apiRes.json()) as OddsApiEvent[];

  let matched = 0;
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const event of events) {
    const homeMatch = matchP4Team(event.home_team, p4Names);
    const awayMatch = matchP4Team(event.away_team, p4Names);

    if (!homeMatch && !awayMatch) {
      skipped++;
      continue;
    }
    matched++;

    const bookmaker = pickBookmaker(event);
    const h2h = bookmaker?.markets.find((m) => m.key === "h2h");
    const spreads = bookmaker?.markets.find((m) => m.key === "spreads");

    const moneylineHome = h2h?.outcomes.find((o) => o.name === event.home_team)?.price ?? null;
    const moneylineAway = h2h?.outcomes.find((o) => o.name === event.away_team)?.price ?? null;
    const homeSpreadOutcome = spreads?.outcomes.find((o) => o.name === event.home_team);
    const spreadLine = homeSpreadOutcome?.point ?? null;
    // Only one spread_odds column in the schema; we store the home side's
    // juice and apply it symmetrically to away-side spread bets too. Real
    // books quote slightly different juice per side (e.g. -111 / -119) —
    // this is a deliberate simplification for a fake-money family book.
    const spreadOdds = homeSpreadOutcome?.price ?? null;

    const kickoffTime = new Date(event.commence_time);

    const { data: existing } = await supabaseAdmin
      .from("games")
      .select("id, status, spread_line, spread_odds, moneyline_home, moneyline_away, total, total_odds")
      .eq("odds_api_event_id", event.id)
      .maybeSingle();

    if (existing) {
      if (existing.status !== "open") continue;

      const lineChanged =
        existing.spread_line !== spreadLine ||
        existing.spread_odds !== spreadOdds ||
        existing.moneyline_home !== moneylineHome ||
        existing.moneyline_away !== moneylineAway;

      if (lineChanged) {
        await supabaseAdmin.from("game_line_history").insert({
          game_id: existing.id,
          spread_line: existing.spread_line,
          spread_odds: existing.spread_odds,
          moneyline_home: existing.moneyline_home,
          moneyline_away: existing.moneyline_away,
          total: existing.total,
          total_odds: existing.total_odds,
        });
      }

      await supabaseAdmin
        .from("games")
        .update({
          spread_line: spreadLine,
          spread_odds: spreadOdds,
          moneyline_home: moneylineHome,
          moneyline_away: moneylineAway,
          last_odds_sync: now.toISOString(),
        })
        .eq("id", existing.id);
      updated++;
    } else {
      await supabaseAdmin.from("games").insert({
        odds_api_event_id: event.id,
        week: computeWeekNumber(kickoffTime),
        home_team: event.home_team,
        away_team: event.away_team,
        home_team_id: homeMatch ? teamIdByName.get(homeMatch) : null,
        away_team_id: awayMatch ? teamIdByName.get(awayMatch) : null,
        kickoff_time: kickoffTime.toISOString(),
        spread_line: spreadLine,
        spread_odds: spreadOdds,
        moneyline_home: moneylineHome,
        moneyline_away: moneylineAway,
        status: "open",
        last_odds_sync: now.toISOString(),
      });
      inserted++;
    }
  }

  return Response.json({
    matched,
    inserted,
    updated,
    skippedNonP4: skipped,
    quota: { requestsRemaining, requestsUsed },
  });
});
