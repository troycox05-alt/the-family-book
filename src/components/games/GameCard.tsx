"use client";

import { Card } from "@/components/ui/Card";
import { useBetSlip } from "@/components/betslip/BetSlipContext";
import { formatAmericanOdds, formatSpreadLine } from "@/lib/shared/format";

export type GameCardData = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
  spreadLine: number | null;
  spreadOdds: number | null;
  moneylineHome: number | null;
  moneylineAway: number | null;
  total: number | null;
  totalOdds: number | null;
};

function OddsCell({
  selected,
  onClick,
  line,
  odds,
  disabled,
}: {
  selected: boolean;
  onClick: () => void;
  line?: string;
  odds: number | null;
  disabled?: boolean;
}) {
  if (odds === null) {
    return <div className="flex-1 rounded-lg border border-dashed border-border py-2 text-center text-xs text-muted/60">&mdash;</div>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg border py-2 text-center transition-colors cursor-pointer ${
        selected
          ? "border-primary bg-primary text-white"
          : "border-border bg-surface text-ink hover:border-primary hover:bg-primary-soft"
      }`}
    >
      {line && <span className="text-xs leading-none">{line}</span>}
      <span className="scoreboard text-sm font-bold leading-none">{formatAmericanOdds(odds)}</span>
    </button>
  );
}

export function GameCard({ game }: { game: GameCardData }) {
  const { addLeg, isSelected } = useBetSlip();

  const kickoff = new Date(game.kickoffTime).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const gameLabel = `${game.awayTeam} @ ${game.homeTeam}`;
  const hasSpread = game.spreadLine !== null && game.spreadOdds !== null;
  const hasTotal = game.total !== null && game.totalOdds !== null;

  const rows = [
    {
      team: game.awayTeam,
      spreadLine: game.spreadLine !== null ? formatSpreadLine(-game.spreadLine) : undefined,
      moneyline: game.moneylineAway,
      totalLabel: hasTotal ? `O ${game.total}` : undefined,
      totalSelection: "over",
    },
    {
      team: game.homeTeam,
      spreadLine: game.spreadLine !== null ? formatSpreadLine(game.spreadLine) : undefined,
      moneyline: game.moneylineHome,
      totalLabel: hasTotal ? `U ${game.total}` : undefined,
      totalSelection: "under",
    },
  ];

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold text-ink">{gameLabel}</p>
        <span className="text-xs text-muted">{kickoff}</span>
      </div>

      <div className="mb-1.5 grid grid-cols-[1fr_2.4fr] gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-muted">
        <span />
        <div className="grid grid-cols-3 gap-2">
          <span className="text-center">Spread</span>
          <span className="text-center">Moneyline</span>
          <span className="text-center">Total</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.team} className="grid grid-cols-[1fr_2.4fr] items-center gap-2">
            <span className="truncate text-sm text-ink">{row.team}</span>
            <div className="grid grid-cols-3 gap-2">
              <OddsCell
                selected={isSelected(game.id, "spread", row.team)}
                disabled={!hasSpread}
                line={row.spreadLine}
                odds={hasSpread ? game.spreadOdds : null}
                onClick={() =>
                  addLeg({
                    gameId: game.id,
                    market: "spread",
                    selection: row.team,
                    displayLabel: `${row.team} ${row.spreadLine}`,
                    odds: game.spreadOdds!,
                    gameLabel,
                  })
                }
              />
              <OddsCell
                selected={isSelected(game.id, "moneyline", row.team)}
                odds={row.moneyline}
                onClick={() =>
                  addLeg({
                    gameId: game.id,
                    market: "moneyline",
                    selection: row.team,
                    displayLabel: `${row.team} ML`,
                    odds: row.moneyline!,
                    gameLabel,
                  })
                }
              />
              <OddsCell
                selected={isSelected(game.id, "total", row.totalSelection)}
                disabled={!hasTotal}
                line={row.totalLabel}
                odds={hasTotal ? game.totalOdds : null}
                onClick={() =>
                  addLeg({
                    gameId: game.id,
                    market: "total",
                    selection: row.totalSelection,
                    displayLabel: `${row.totalLabel}`,
                    odds: game.totalOdds!,
                    gameLabel,
                  })
                }
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
