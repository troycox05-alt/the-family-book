"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Card } from "@/components/ui/Card";
import { formatAmericanOdds } from "@/lib/shared/format";
import { legSelectionLabel } from "@/lib/shared/legLabel";
import { useToast } from "@/components/ui/ToastContext";

const STATUS_CLASS: Record<string, string> = {
  pending: "text-muted",
  won: "text-win",
  lost: "text-loss",
  push: "text-push",
  void: "text-muted",
};

type Leg = {
  market: string;
  selection: string;
  line_at_placement: number | null;
  odds_at_placement: number;
  result: string;
  games: { home_team: string; away_team: string } | null;
};

export type BetWithLegs = {
  id: string;
  type: string;
  status: string;
  wager: number;
  payout: number | null;
  bet_legs: Leg[];
};

const SEEN_KEY = "fb_seen_bet_status";

export function MyBetsList({ bets }: { bets: BetWithLegs[] }) {
  const { showToast } = useToast();

  useEffect(() => {
    let seen: Record<string, string> = {};
    try {
      seen = JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? "{}");
    } catch {
      seen = {};
    }

    for (const bet of bets) {
      const previousStatus = seen[bet.id];
      if (previousStatus !== undefined && previousStatus !== bet.status) {
        if (bet.status === "won") {
          showToast("success", `You won! +$${Number(bet.payout ?? 0).toFixed(2)}`);
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } else if (bet.status === "lost") {
          showToast("info", "That one didn't hit — better luck next time.");
        } else if (bet.status === "push") {
          showToast("info", "Pushed — stake refunded.");
        }
      }
      seen[bet.id] = bet.status;
    }

    window.localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  }, [bets, showToast]);

  if (bets.length === 0) {
    return <p className="text-muted">No bets yet &mdash; head to Games to get started.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {bets.map((bet) => (
        <Card key={bet.id} className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted">
              {bet.type} &middot; ${Number(bet.wager).toFixed(2)}
            </span>
            <span className={`text-sm font-semibold ${STATUS_CLASS[bet.status]}`}>
              {bet.status}
              {bet.status !== "pending" && bet.payout !== null && ` — $${Number(bet.payout).toFixed(2)}`}
            </span>
          </div>
          <ul className="flex flex-col gap-1">
            {bet.bet_legs.map((leg, i) => (
              <li key={i} className="text-sm text-ink">
                {legSelectionLabel(leg)} ({formatAmericanOdds(leg.odds_at_placement)})
                {leg.games && (
                  <span className="text-muted">
                    {" "}
                    &mdash; {leg.games.away_team} @ {leg.games.home_team}
                  </span>
                )}
                <span className={`ml-2 text-xs ${STATUS_CLASS[leg.result]}`}>[{leg.result}]</span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
