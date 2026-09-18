// Pure payout math shared by the bet-slip UI (live payout preview) and the
// settlement logic. Mirrored in supabase/functions/_shared/odds.ts for the
// Deno edge function runtime — keep both in sync if this changes.

export type AmericanOdds = number;

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Profit per $1 wagered, for standard American odds. */
export function americanToProfitMultiplier(odds: AmericanOdds): number {
  return odds > 0 ? odds / 100 : 100 / Math.abs(odds);
}

/** Decimal odds (stake included), for chaining parlay legs. */
export function americanToDecimal(odds: AmericanOdds): number {
  return odds > 0 ? 1 + odds / 100 : 1 + 100 / Math.abs(odds);
}

export function straightPayout(wager: number, odds: AmericanOdds): { profit: number; payout: number } {
  const profit = wager * americanToProfitMultiplier(odds);
  return { profit: round2(profit), payout: round2(wager + profit) };
}

/**
 * Parlay payout given the American odds of every leg that counts (pushed
 * legs must already be excluded by the caller — a push is removed from the
 * calculation entirely, not treated as a loss). An empty list means every
 * leg pushed, so the full stake is refunded.
 */
export function parlayPayout(wager: number, countingLegOdds: AmericanOdds[]): number {
  if (countingLegOdds.length === 0) return round2(wager);
  const decimalProduct = countingLegOdds.reduce((acc, odds) => acc * americanToDecimal(odds), 1);
  return round2(wager * decimalProduct);
}
