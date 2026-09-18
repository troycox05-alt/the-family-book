"use client";

import { useEffect, useState } from "react";
import { supabasePublic } from "@/lib/supabase/browser";
import { formatAmericanOdds } from "@/lib/shared/format";
import { legSelectionLabel } from "@/lib/shared/legLabel";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

const PAGE_SIZE = 50;
const POLL_MS = 8000;

type FeedLeg = {
  market: "spread" | "moneyline" | "total";
  selection: string;
  line_at_placement: number | null;
  odds_at_placement: number;
  result: "pending" | "won" | "lost" | "push";
  games: { home_team: string; away_team: string } | null;
};

type FeedBet = {
  id: string;
  user_id: string;
  type: "straight" | "parlay";
  status: "pending" | "won" | "lost" | "push" | "void";
  wager: number;
  payout: number | null;
  placed_at: string;
  bet_legs: FeedLeg[];
};

type FeedEntry = FeedBet & { username: string };

const STATUS_LABEL: Record<FeedBet["status"], string> = {
  pending: "pending",
  won: "won",
  lost: "lost",
  push: "pushed",
  void: "voided",
};

const STATUS_CLASS: Record<FeedBet["status"], string> = {
  pending: "text-muted",
  won: "text-win",
  lost: "text-loss",
  push: "text-push",
  void: "text-muted",
};

async function fetchPage(limit: number): Promise<FeedEntry[]> {
  const { data: bets, error } = await supabasePublic
    .from("bets")
    .select(
      "id, user_id, type, status, wager, payout, placed_at, bet_legs(market, selection, line_at_placement, odds_at_placement, result, games(home_team, away_team))",
    )
    .order("placed_at", { ascending: false })
    .limit(limit);

  if (error || !bets) return [];

  const userIds = [...new Set(bets.map((b) => b.user_id))];
  const { data: users } = await supabasePublic.from("leaderboard").select("id, username").in("id", userIds);
  const usernameById = new Map((users ?? []).map((u) => [u.id, u.username]));

  return (bets as unknown as FeedBet[]).map((bet) => ({
    ...bet,
    username: usernameById.get(bet.user_id) ?? "someone",
  }));
}

function FeedEntryRow({ entry }: { entry: FeedEntry }) {
  const legLabels = entry.bet_legs.map((leg) => {
    const gameLabel = leg.games ? `${leg.games.away_team} @ ${leg.games.home_team}` : "";
    return `${legSelectionLabel(leg)} (${formatAmericanOdds(leg.odds_at_placement)})${gameLabel ? ` — ${gameLabel}` : ""}`;
  });

  return (
    <li className="border-b border-border/10 py-3 text-sm">
      <p className="text-ink">
        <span className="font-semibold text-primary">{entry.username}</span> put{" "}
        <span className="scoreboard">${Number(entry.wager).toFixed(2)}</span> on{" "}
        {entry.type === "parlay" ? `a ${entry.bet_legs.length}-leg parlay` : legLabels[0]}
      </p>
      {entry.type === "parlay" && (
        <ul className="mt-1 ml-3 list-disc text-muted text-xs">
          {legLabels.map((label, i) => (
            <li key={i}>{label}</li>
          ))}
        </ul>
      )}
      <p className={`mt-1 text-xs ${STATUS_CLASS[entry.status]}`}>
        {STATUS_LABEL[entry.status]}
        {entry.status !== "pending" && entry.payout !== null && ` — payout $${Number(entry.payout).toFixed(2)}`}
      </p>
    </li>
  );
}

export function LiveFeed() {
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const data = await fetchPage(pageSize);
      if (cancelled) return;
      setEntries(data);
      setLoading(false);
    }

    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pageSize]);

  return (
    <Card className="p-4">
      <p className="text-lg text-primary mb-2">Live Action</p>
      {loading && entries.length === 0 && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}
      {!loading && entries.length === 0 && <p className="text-sm text-muted">No bets placed yet.</p>}
      <ul>
        {entries.map((entry) => (
          <FeedEntryRow key={entry.id} entry={entry} />
        ))}
      </ul>
      {entries.length >= pageSize && (
        <button
          type="button"
          onClick={() => setPageSize((s) => s + PAGE_SIZE)}
          className="mt-3 text-sm text-primary underline underline-offset-2 hover:text-primary cursor-pointer"
        >
          Load more
        </button>
      )}
    </Card>
  );
}
