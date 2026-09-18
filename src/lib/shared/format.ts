export function formatAmericanOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

export function formatSpreadLine(line: number): string {
  return line > 0 ? `+${line}` : `${line}`;
}
