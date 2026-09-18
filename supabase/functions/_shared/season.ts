// Assigns a CFB week number to a kickoff time using the standard
// Tuesday-through-Monday "game week" convention, anchored to the 2026
// season's Week 1 Tuesday (Sep 1, 2026 00:00 Central = Sep 1, 2026 05:00
// UTC, since CDT is UTC-5). Verified against ESPN's 2026 schedule pages:
// Week 1 Saturday = Sep 5, 2026; Week 3 Saturday = Sep 19, 2026.
//
// Games before this anchor (the season-opening "Week 0" slate, Aug 27-30)
// are assigned week 0. Admins can always override the computed week when
// editing a game manually.
//
// Mirrored in supabase/functions/_shared/season.ts — keep both in sync,
// and bump the anchor date at the start of each new season.

const WEEK_1_TUESDAY_UTC = new Date("2026-09-01T05:00:00Z").getTime();
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export function computeWeekNumber(kickoffUtc: Date): number {
  const diffMs = kickoffUtc.getTime() - WEEK_1_TUESDAY_UTC;
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / MS_PER_WEEK) + 1;
}
