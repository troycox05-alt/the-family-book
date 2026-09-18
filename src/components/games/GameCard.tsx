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

function PickButton({
  selected,
  onClick,
  label,
  odds,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  odds: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-0.5 rounded-md border px-2 py-2 text-center transition-colors cursor-pointer ${
        selected
          ? "border-brass bg-brass/20 text-brass-light"
          : "border-cream/15 bg-felt-darker/40 text-cream hover:border-brass/60"
      }`}
    >
      <span className="text-xs leading-tight">{label}</span>
      <span className="scoreboard text-sm font-bold">{formatAmericanOdds(odds)}</span>
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

  const homeSpreadLabel = game.spreadLine !== null ? `${game.homeTeam} ${formatSpreadLine(game.spreadLine)}` : "";
  const awaySpreadLabel = game.spreadLine !== null ? `${game.awayTeam} ${formatSpreadLine(-game.spreadLine)}` : "";

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between text-xs text-cream-dim">
        <span>{kickoff}</span>
      </div>
      <p className="font-display text-lg text-cream mb-3">{gameLabel}</p>

      {game.spreadLine !== null && game.spreadOdds !== null && (
        <div className="mb-2">
          <p className="mb-1 text-[11px] uppercase tracking-wider text-cream-dim">Spread</p>
          <div className="flex gap-2">
            <PickButton
              label={awaySpreadLabel}
              odds={game.spreadOdds}
              selected={isSelected(game.id, "spread", game.awayTeam)}
              onClick={() =>
                addLeg({
                  gameId: game.id,
                  market: "spread",
                  selection: game.awayTeam,
                  displayLabel: `${awaySpreadLabel} (${formatAmericanOdds(game.spreadOdds!)})`,
                  odds: game.spreadOdds!,
                  gameLabel,
                })
              }
            />
            <PickButton
              label={homeSpreadLabel}
              odds={game.spreadOdds}
              selected={isSelected(game.id, "spread", game.homeTeam)}
              onClick={() =>
                addLeg({
                  gameId: game.id,
                  market: "spread",
                  selection: game.homeTeam,
                  displayLabel: `${homeSpreadLabel} (${formatAmericanOdds(game.spreadOdds!)})`,
                  odds: game.spreadOdds!,
                  gameLabel,
                })
              }
            />
          </div>
        </div>
      )}

      {game.moneylineHome !== null && game.moneylineAway !== null && (
        <div className="mb-2">
          <p className="mb-1 text-[11px] uppercase tracking-wider text-cream-dim">Moneyline</p>
          <div className="flex gap-2">
            <PickButton
              label={game.awayTeam}
              odds={game.moneylineAway}
              selected={isSelected(game.id, "moneyline", game.awayTeam)}
              onClick={() =>
                addLeg({
                  gameId: game.id,
                  market: "moneyline",
                  selection: game.awayTeam,
                  displayLabel: `${game.awayTeam} ML (${formatAmericanOdds(game.moneylineAway!)})`,
                  odds: game.moneylineAway!,
                  gameLabel,
                })
              }
            />
            <PickButton
              label={game.homeTeam}
              odds={game.moneylineHome}
              selected={isSelected(game.id, "moneyline", game.homeTeam)}
              onClick={() =>
                addLeg({
                  gameId: game.id,
                  market: "moneyline",
                  selection: game.homeTeam,
                  displayLabel: `${game.homeTeam} ML (${formatAmericanOdds(game.moneylineHome!)})`,
                  odds: game.moneylineHome!,
                  gameLabel,
                })
              }
            />
          </div>
        </div>
      )}

      {game.total !== null && game.totalOdds !== null && (
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-wider text-cream-dim">Total</p>
          <div className="flex gap-2">
            <PickButton
              label={`Over ${game.total}`}
              odds={game.totalOdds}
              selected={isSelected(game.id, "total", "over")}
              onClick={() =>
                addLeg({
                  gameId: game.id,
                  market: "total",
                  selection: "over",
                  displayLabel: `Over ${game.total} (${formatAmericanOdds(game.totalOdds!)})`,
                  odds: game.totalOdds!,
                  gameLabel,
                })
              }
            />
            <PickButton
              label={`Under ${game.total}`}
              odds={game.totalOdds}
              selected={isSelected(game.id, "total", "under")}
              onClick={() =>
                addLeg({
                  gameId: game.id,
                  market: "total",
                  selection: "under",
                  displayLabel: `Under ${game.total} (${formatAmericanOdds(game.totalOdds!)})`,
                  odds: game.totalOdds!,
                  gameLabel,
                })
              }
            />
          </div>
        </div>
      )}
    </Card>
  );
}
