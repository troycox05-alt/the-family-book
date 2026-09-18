"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

type OverallRow = { id: string; username: string; balance: number };
type WeeklyRow = { id: string; username: string; profit: number };

type LeaderboardData = {
  overall: OverallRow[];
  weeks: number[];
  weekly: { week: number; standings: WeeklyRow[] } | null;
};

function RankedList({
  rows,
  valueLabel,
}: {
  rows: { id: string; username: string; value: number }[];
  valueLabel: (value: number) => { text: string; className: string };
}) {
  if (rows.length === 0) {
    return <p className="px-4 py-3 text-muted">Nothing to show yet.</p>;
  }
  return (
    <ul>
      {rows.map((row, index) => {
        const { text, className } = valueLabel(row.value);
        return (
          <li key={row.id} className="flex items-center justify-between border-b border-border/10 px-4 py-3 last:border-b-0">
            <div className="flex items-center gap-3">
              <span className="scoreboard w-6 text-right text-muted">{index + 1}</span>
              <span className="text-ink">{row.username}</span>
            </div>
            <span className={`scoreboard text-lg font-bold ${className}`}>{text}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function LeaderboardTabs() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [tab, setTab] = useState<"overall" | "weekly">("overall");
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const overallRes = await fetch("/api/leaderboard");
      if (!overallRes.ok) return;
      const overallData: LeaderboardData = await overallRes.json();
      setData(overallData);
      if (overallData.weeks.length > 0) setSelectedWeek(overallData.weeks[0]);
      setLoading(false);
    }
    void load();
  }, []);

  useEffect(() => {
    if (selectedWeek === null) return;
    async function loadWeek() {
      const res = await fetch(`/api/leaderboard?week=${selectedWeek}`);
      if (!res.ok) return;
      const weekData: LeaderboardData = await res.json();
      setData((prev) => (prev ? { ...prev, weekly: weekData.weekly } : weekData));
    }
    void loadWeek();
  }, [selectedWeek]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setTab("overall")}
          className={`rounded-md border px-3 py-1.5 text-sm cursor-pointer ${
            tab === "overall" ? "border-primary bg-primary-soft text-primary" : "border-border text-muted hover:border-primary/50"
          }`}
        >
          Overall Balance
        </button>
        <button
          onClick={() => setTab("weekly")}
          className={`rounded-md border px-3 py-1.5 text-sm cursor-pointer ${
            tab === "weekly" ? "border-primary bg-primary-soft text-primary" : "border-border text-muted hover:border-primary/50"
          }`}
        >
          Weekly Profit
        </button>
        {tab === "weekly" && data && data.weeks.length > 0 && (
          <select
            value={selectedWeek ?? ""}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
            className="ml-auto rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-ink outline-none focus:border-primary"
          >
            {data.weeks.map((w) => (
              <option key={w} value={w}>
                Week {w}
              </option>
            ))}
          </select>
        )}
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex flex-col gap-3 p-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : tab === "overall" ? (
          <RankedList
            rows={(data?.overall ?? []).map((u) => ({ id: u.id, username: u.username, value: Number(u.balance) }))}
            valueLabel={(v) => ({ text: `$${v.toFixed(2)}`, className: "text-primary" })}
          />
        ) : data?.weekly && data.weeks.length > 0 ? (
          <RankedList
            rows={data.weekly.standings.map((s) => ({ id: s.id, username: s.username, value: s.profit }))}
            valueLabel={(v) => ({
              text: `${v >= 0 ? "+" : ""}$${v.toFixed(2)}`,
              className: v > 0 ? "text-win" : v < 0 ? "text-loss" : "text-muted",
            })}
          />
        ) : (
          <p className="px-4 py-3 text-muted">No graded bets yet this season.</p>
        )}
      </Card>
    </div>
  );
}
