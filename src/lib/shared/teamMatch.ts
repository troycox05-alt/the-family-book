// Matches a "<School> <Mascot>" string from The Odds API (e.g. "Ohio State
// Buckeyes") against our short P4 school names (e.g. "Ohio State"). Mirrored
// in supabase/functions/_shared/teamMatch.ts — keep both in sync.

export function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Returns the matching short team name, or null if none of the candidates
 * appear in the odds-api string. When multiple candidates match as a
 * substring (e.g. both "Kansas" and "Kansas State" are substrings of
 * "Kansas State Wildcats"), the longest / most specific match wins.
 */
export function matchP4Team(oddsApiTeamName: string, p4TeamNames: string[]): string | null {
  const normalizedOdds = normalizeTeamName(oddsApiTeamName);
  let best: string | null = null;
  let bestLength = -1;

  for (const candidate of p4TeamNames) {
    const normalizedCandidate = normalizeTeamName(candidate);
    if (normalizedOdds.includes(normalizedCandidate) && normalizedCandidate.length > bestLength) {
      best = candidate;
      bestLength = normalizedCandidate.length;
    }
  }

  return best;
}
