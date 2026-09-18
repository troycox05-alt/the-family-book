export type Market = "spread" | "moneyline" | "total";
export type BetType = "straight" | "parlay";

export type LegInput = {
  gameId: string;
  market: Market;
  /** Team name for spread/moneyline, "over"/"under" for total. */
  selection: string;
};

export type PlaceBetInput = {
  type: BetType;
  wager: number;
  legs: LegInput[];
};

export type ValidatedLeg = {
  game_id: string;
  market: Market;
  selection: string;
  line_at_placement: number | null;
  odds_at_placement: number;
};
