// DST-safe Central Time helpers built on the runtime's native Intl/ICU
// timezone database (works identically in Node and Deno — no fixed UTC
// offset anywhere, so this keeps working across the CDT/CST switch).
// Mirrored in supabase/functions/_shared/centralTime.ts — keep both in sync.

export const CENTRAL_TZ = "America/Chicago";

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export type CentralParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** 0 = Sunday .. 6 = Saturday */
  weekday: number;
};

export function getCentralParts(date: Date): CentralParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CENTRAL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  // hour12: false renders midnight as "24"; normalize to 0.
  const rawHour = Number(get("hour"));

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: rawHour === 24 ? 0 : rawHour,
    minute: Number(get("minute")),
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
  };
}

/** Friday 12:00 PM through Saturday 11:59 PM, Central. */
export function isWithinOddsPollingWindow(date: Date): boolean {
  const { weekday, hour } = getCentralParts(date);
  const isFridayAfternoon = weekday === 5 && hour >= 12;
  const isSaturday = weekday === 6;
  return isFridayAfternoon || isSaturday;
}

function getCentralOffsetMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CENTRAL_TZ,
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  const tzName = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-6";
  const match = tzName.match(/GMT([+-]\d+)(?::(\d+))?/);
  const hours = match ? Number(match[1]) : -6;
  const minutes = match?.[2] ? Number(match[2]) : 0;
  return hours * 60 + (hours < 0 ? -minutes : minutes);
}

/**
 * Converts a "wall clock" Central time (e.g. from an HTML datetime-local
 * input, which carries no timezone of its own) into the correct UTC
 * instant, accounting for whichever of CDT/CST is in effect on that date.
 * Used for admin-entered lock times — never for parsing values that
 * already carry an explicit UTC offset (e.g. ISO strings with "Z").
 */
export function centralWallTimeToUtc(year: number, month: number, day: number, hour: number, minute: number): Date {
  const guessUtcMs = Date.UTC(year, month - 1, day, hour, minute);
  const offsetMinutes = getCentralOffsetMinutes(new Date(guessUtcMs));
  return new Date(guessUtcMs - offsetMinutes * 60_000);
}

export type ScoreCheckTarget = {
  label: string;
  /** 0 = Sunday .. 6 = Saturday */
  weekday: number;
  hour: number;
  minute: number;
};

// Saturday 12:30/2:30/4:30/6:30/8:30/10:30 PM, Saturday-midnight (= Sunday
// 12:00 AM), and a Sunday-noon safety sweep.
export const SCORE_CHECK_TARGETS: ScoreCheckTarget[] = [
  { label: "Sat 12:30 PM", weekday: 6, hour: 12, minute: 30 },
  { label: "Sat 2:30 PM", weekday: 6, hour: 14, minute: 30 },
  { label: "Sat 4:30 PM", weekday: 6, hour: 16, minute: 30 },
  { label: "Sat 6:30 PM", weekday: 6, hour: 18, minute: 30 },
  { label: "Sat 8:30 PM", weekday: 6, hour: 20, minute: 30 },
  { label: "Sat 10:30 PM", weekday: 6, hour: 22, minute: 30 },
  { label: "Sun 12:00 AM", weekday: 0, hour: 0, minute: 0 },
  { label: "Sun 12:00 PM safety sweep", weekday: 0, hour: 12, minute: 0 },
];

/**
 * True if `date` (Central time) falls within `toleranceMinutes` of any
 * target in SCORE_CHECK_TARGETS. Tolerance should be >= the cron interval
 * so a target is never skipped between runs.
 */
export function isNearScoreCheckTarget(
  date: Date,
  toleranceMinutes = 12,
): { isTarget: boolean; target: ScoreCheckTarget | null } {
  const { weekday, hour, minute } = getCentralParts(date);
  const currentMinutesOfWeek = weekday * 24 * 60 + hour * 60 + minute;

  for (const target of SCORE_CHECK_TARGETS) {
    const targetMinutesOfWeek = target.weekday * 24 * 60 + target.hour * 60 + target.minute;
    // Handle wraparound (Saturday night -> Sunday) by comparing on a 7-day
    // ring rather than a flat 0..10079 line.
    const diff = Math.abs(currentMinutesOfWeek - targetMinutesOfWeek);
    const wrappedDiff = Math.min(diff, 7 * 24 * 60 - diff);
    if (wrappedDiff <= toleranceMinutes) {
      return { isTarget: true, target };
    }
  }

  return { isTarget: false, target: null };
}
