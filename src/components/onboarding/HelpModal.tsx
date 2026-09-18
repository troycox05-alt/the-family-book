"use client";

import { Button } from "@/components/ui/Button";

const SECTIONS = [
  {
    title: "Three ways to bet a game",
    body: "Spread evens out a matchup with a point handicap. Moneyline is a straight pick to win, no handicap — favorites pay less, underdogs pay more. Total is a bet on whether the combined score goes over or under a set number.",
  },
  {
    title: "Parlays",
    body: "Combine 2+ picks into one bet for a bigger payout. Every leg has to win (or push) — a single loss anywhere in the parlay busts the whole thing, even if your other picks are still pending. A push just gets removed from the math, it doesn't break the parlay.",
  },
  {
    title: "Toss-Up Five",
    body: "Every week the admin picks 5 games. Call the winner of each, no odds involved. You can't see anyone else's picks until you've submitted all 5 yourself — or until picks lock Friday at noon, when everyone's picks open up regardless. Most correct wins the weekly bonus.",
  },
  {
    title: "It's all fake money",
    body: "Everyone starts with $500. Brag rights and the leaderboard are the only thing on the line — have fun with it.",
  },
];

export function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-bold text-ink">How The Family Book Works</h2>
        <p className="mb-4 text-sm text-muted">A quick rundown before you place your first bet.</p>
        <div className="flex flex-col gap-4">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <p className="mb-1 text-sm font-semibold text-ink">{s.title}</p>
              <p className="text-sm text-muted">{s.body}</p>
            </div>
          ))}
        </div>
        <Button onClick={onClose} className="mt-6 w-full">
          Got it, let&rsquo;s go
        </Button>
      </div>
    </div>
  );
}
