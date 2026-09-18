"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useBetSlip } from "./BetSlipContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { straightPayout, parlayPayout } from "@/lib/shared/odds";
import { formatAmericanOdds } from "@/lib/shared/format";

export function BetSlip() {
  const router = useRouter();
  const { legs, clear } = useBetSlip();
  const [wagerInput, setWagerInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const wager = Number(wagerInput);
  const wagerValid = Number.isFinite(wager) && wager > 0;
  const betType = legs.length >= 2 ? "parlay" : "straight";

  const preview = useMemo(() => {
    if (!wagerValid || legs.length === 0) return null;
    if (betType === "straight") {
      return straightPayout(wager, legs[0].odds);
    }
    const payout = parlayPayout(
      wager,
      legs.map((l) => l.odds),
    );
    return { profit: Math.round((payout - wager) * 100) / 100, payout };
  }, [wagerValid, wager, legs, betType]);

  async function handleSubmit() {
    setError(null);
    setSuccess(null);
    if (!wagerValid) {
      setError("Enter a wager amount.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: betType,
          wager,
          legs: legs.map((l) => ({ gameId: l.gameId, market: l.market, selection: l.selection })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not place that bet.");
        return;
      }
      setSuccess(`Bet placed for $${wager.toFixed(2)}.`);
      setWagerInput("");
      clear();
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (legs.length === 0 && !success) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 lg:sticky lg:bottom-auto lg:top-20 lg:z-auto">
      <div className="card-texture mx-auto max-w-5xl border-t border-brass/40 lg:rounded-lg lg:border">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center justify-between px-4 py-3 lg:hidden cursor-pointer"
        >
          <span className="text-sm text-cream">
            {legs.length} pick{legs.length === 1 ? "" : "s"}
            {preview ? ` · potential payout $${preview.payout.toFixed(2)}` : ""}
          </span>
          <span className="text-brass-light text-sm">{expanded ? "Hide" : "Bet slip"}</span>
        </button>

        <div className={`${expanded ? "block" : "hidden"} lg:block px-4 pb-4 lg:pt-4`}>
          <p className="font-display text-lg text-brass-light mb-2 hidden lg:block">Bet Slip</p>

          {legs.length === 0 ? (
            <p className="text-sm text-cream-dim">Pick a line to get started.</p>
          ) : (
            <ul className="mb-3 flex flex-col gap-2">
              {legs.map((leg) => (
                <li key={`${leg.gameId}-${leg.market}`} className="text-sm border-b border-cream/10 pb-2">
                  <p className="text-cream-dim text-xs">{leg.gameLabel}</p>
                  <p className="text-cream">{leg.displayLabel}</p>
                </li>
              ))}
            </ul>
          )}

          {legs.length >= 2 && <p className="mb-2 text-xs text-brass-light">Parlay &middot; all legs must win or push</p>}

          <div className="flex items-center gap-2 mb-2">
            <span className="text-cream-dim">$</span>
            <Input
              inputMode="decimal"
              placeholder="Wager"
              value={wagerInput}
              onChange={(e) => setWagerInput(e.target.value)}
            />
          </div>

          {preview && (
            <p className="mb-2 text-sm text-cream-dim">
              To win <span className="scoreboard text-brass-light">${preview.profit.toFixed(2)}</span> &middot; payout{" "}
              <span className="scoreboard text-brass-light">${preview.payout.toFixed(2)}</span>
              {legs.length === 1 && <span> ({formatAmericanOdds(legs[0].odds)})</span>}
            </p>
          )}

          {error && <p className="mb-2 text-sm text-loss">{error}</p>}
          {success && <p className="mb-2 text-sm text-win">{success}</p>}

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={submitting || legs.length === 0} className="flex-1">
              {submitting ? "Placing…" : "Place bet"}
            </Button>
            {legs.length > 0 && (
              <Button variant="ghost" onClick={clear} disabled={submitting}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
