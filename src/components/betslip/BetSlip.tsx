"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useBetSlip } from "./BetSlipContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { straightPayout, parlayPayout, americanToDecimal } from "@/lib/shared/odds";
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

  const combinedOdds = useMemo(() => {
    if (legs.length < 2) return null;
    const decimal = legs.reduce((acc, l) => acc * americanToDecimal(l.odds), 1);
    const americanEquivalent = decimal >= 2 ? (decimal - 1) * 100 : -100 / (decimal - 1);
    return Math.round(americanEquivalent);
  }, [legs]);

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
      <div className="mx-auto max-w-5xl rounded-t-xl border border-border bg-surface shadow-[0_-4px_20px_rgba(15,23,42,0.08)] lg:rounded-xl lg:shadow-sm">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center justify-between px-4 py-3 lg:hidden cursor-pointer"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-ink">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
              {legs.length}
            </span>
            Bet Slip
          </span>
          <span className="flex items-center gap-2">
            {preview && <span className="scoreboard text-sm font-bold text-ink">${preview.payout.toFixed(2)}</span>}
            <span className="text-xs text-primary">{expanded ? "Hide" : "View"}</span>
          </span>
        </button>

        <div className={`${expanded ? "block" : "hidden"} lg:block px-4 pb-4 lg:pt-4`}>
          <p className="mb-3 hidden text-base font-bold text-ink lg:block">Bet Slip</p>

          {legs.length === 0 ? (
            <p className="text-sm text-muted">Pick a line to get started.</p>
          ) : (
            <ul className="mb-3 flex flex-col gap-2">
              {legs.map((leg) => (
                <li
                  key={`${leg.gameId}-${leg.market}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{leg.displayLabel}</p>
                    <p className="truncate text-xs text-muted">{leg.gameLabel}</p>
                  </div>
                  <span className="scoreboard shrink-0 rounded-md bg-surface px-2 py-1 text-xs font-bold text-ink">
                    {formatAmericanOdds(leg.odds)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {legs.length >= 2 && (
            <div className="mb-3 flex items-center justify-between rounded-lg bg-primary-soft px-3 py-2 text-xs">
              <span className="font-medium text-primary">{legs.length}-Leg Parlay &middot; all legs must win or push</span>
              {combinedOdds !== null && <span className="scoreboard font-bold text-primary">{formatAmericanOdds(combinedOdds)}</span>}
            </div>
          )}

          <label className="mb-1 block text-xs font-medium text-muted">Wager</label>
          <div className="relative mb-3">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">$</span>
            <Input
              inputMode="decimal"
              placeholder="0.00"
              value={wagerInput}
              onChange={(e) => setWagerInput(e.target.value)}
              className="pl-6"
            />
          </div>

          {preview && (
            <div className="mb-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-surface-muted px-3 py-2 text-center">
                <p className="text-[11px] uppercase tracking-wide text-muted">To Win</p>
                <p className="scoreboard text-lg font-bold text-win">${preview.profit.toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-surface-muted px-3 py-2 text-center">
                <p className="text-[11px] uppercase tracking-wide text-muted">Total Payout</p>
                <p className="scoreboard text-lg font-bold text-ink">${preview.payout.toFixed(2)}</p>
              </div>
            </div>
          )}

          {error && <p className="mb-2 text-sm text-loss">{error}</p>}
          {success && <p className="mb-2 text-sm text-win">{success}</p>}

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={submitting || legs.length === 0} className="flex-1">
              {submitting ? "Placing…" : "Place Bet"}
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
