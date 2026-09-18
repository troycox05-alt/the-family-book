import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { LegInput, ValidatedLeg } from "./types";

type GameRow = {
  id: string;
  status: string;
  kickoff_time: string;
  home_team: string;
  away_team: string;
  spread_line: number | null;
  spread_odds: number | null;
  moneyline_home: number | null;
  moneyline_away: number | null;
  total: number | null;
  total_odds: number | null;
};

/**
 * Re-derives line/odds from the live game row rather than trusting
 * whatever the client displayed, so a bet always settles against the real
 * line at the moment it was placed, not a stale or tampered-with one.
 * Throws a user-facing Error on any validation failure.
 */
export async function validateLeg(input: LegInput): Promise<ValidatedLeg> {
  const { data: game, error } = await supabaseAdmin
    .from("games")
    .select(
      "id, status, kickoff_time, home_team, away_team, spread_line, spread_odds, moneyline_home, moneyline_away, total, total_odds",
    )
    .eq("id", input.gameId)
    .maybeSingle<GameRow>();

  if (error || !game) {
    throw new Error("That game no longer exists.");
  }
  if (game.status !== "open") {
    throw new Error(`${game.away_team} @ ${game.home_team} is no longer open for betting.`);
  }
  if (new Date(game.kickoff_time).getTime() <= Date.now()) {
    throw new Error(`${game.away_team} @ ${game.home_team} has already kicked off.`);
  }

  if (input.market === "moneyline") {
    const isHome = input.selection === game.home_team;
    const isAway = input.selection === game.away_team;
    if (!isHome && !isAway) {
      throw new Error(`Invalid selection for ${game.away_team} @ ${game.home_team}.`);
    }
    const odds = isHome ? game.moneyline_home : game.moneyline_away;
    if (odds === null) {
      throw new Error(`Moneyline isn't available for ${game.away_team} @ ${game.home_team}.`);
    }
    return { game_id: game.id, market: "moneyline", selection: input.selection, line_at_placement: null, odds_at_placement: odds };
  }

  if (input.market === "spread") {
    const isHome = input.selection === game.home_team;
    const isAway = input.selection === game.away_team;
    if (!isHome && !isAway) {
      throw new Error(`Invalid selection for ${game.away_team} @ ${game.home_team}.`);
    }
    if (game.spread_line === null || game.spread_odds === null) {
      throw new Error(`Spread isn't available for ${game.away_team} @ ${game.home_team}.`);
    }
    const line = isHome ? game.spread_line : -game.spread_line;
    return { game_id: game.id, market: "spread", selection: input.selection, line_at_placement: line, odds_at_placement: game.spread_odds };
  }

  // total
  const selection = input.selection.toLowerCase();
  if (selection !== "over" && selection !== "under") {
    throw new Error(`Invalid total selection for ${game.away_team} @ ${game.home_team}.`);
  }
  if (game.total === null || game.total_odds === null) {
    throw new Error(`Total isn't available for ${game.away_team} @ ${game.home_team}.`);
  }
  return { game_id: game.id, market: "total", selection, line_at_placement: game.total, odds_at_placement: game.total_odds };
}
