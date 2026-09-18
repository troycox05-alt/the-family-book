import { formatSpreadLine } from "./format";

export type LegLike = {
  market: string;
  selection: string;
  line_at_placement: number | null;
};

export function legSelectionLabel(leg: LegLike): string {
  if (leg.market === "moneyline") return `${leg.selection} ML`;
  if (leg.market === "spread") {
    return `${leg.selection} ${leg.line_at_placement !== null ? formatSpreadLine(leg.line_at_placement) : ""}`;
  }
  return `${leg.selection === "over" ? "Over" : "Under"} ${leg.line_at_placement ?? ""}`;
}
