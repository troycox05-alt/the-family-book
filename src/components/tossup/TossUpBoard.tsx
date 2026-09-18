"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastContext";

type Game = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
};

type PickInfo = { pick: string; correct: boolean | null };

type TossUpData = {
  week: { id: string; label: string; lockTime: string; bonusAmount: number; bonusAwarded: boolean } | null;
  games: Game[];
  myPicks: Record<string, PickInfo>;
  isPastLock: boolean;
  visible: boolean;
  others: { userId: string; username: string; picks: Record<string, PickInfo> }[];
};

export function TossUpBoard() {
  const { showToast } = useToast();
  const [data, setData] = useState<TossUpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingGameId, setSubmittingGameId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/toss-up");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount; load() is also reused by submitPick()
    void load();
  }, []);

  async function submitPick(gameId: string, pick: string) {
    if (!data?.week) return;
    setSubmittingGameId(gameId);
    setError(null);
    try {
      const res = await fetch("/api/toss-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekId: data.week.id, gameId, pick }),
      });
      const body = await res.json();
      if (!res.ok) {
        const message = body.error ?? "Could not save that pick.";
        setError(message);
        showToast("error", message);
        return;
      }
      showToast("success", `Pick saved: ${pick}`);
      await load();
    } finally {
      setSubmittingGameId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }
  if (!data?.week) {
    return <p className="text-muted">No Toss-Up Five has been set for this week yet.</p>;
  }

  const { week, games, myPicks, isPastLock, visible, others } = data;
  const submittedCount = games.filter((g) => myPicks[g.id]).length;

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xl text-primary">{week.label}</p>
            <p className="text-sm text-muted">
              Locks {new Date(week.lockTime).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
          <p className="text-sm text-muted">
            Bonus: <span className="scoreboard text-primary">${week.bonusAmount.toFixed(2)}</span>
            {week.bonusAwarded && <span className="ml-2 text-win">awarded</span>}
          </p>
        </div>
        <p className="mt-2 text-xs text-muted">{submittedCount} / 5 picks submitted</p>
        {!visible && (
          <p className="mt-1 text-xs text-primary">
            Submit all 5 to see everyone else&rsquo;s picks &mdash; or wait for lock, when everything opens up.
          </p>
        )}
        {error && <p className="mt-2 text-sm text-loss">{error}</p>}
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {games.map((game) => {
          const myPick = myPicks[game.id];
          const locked = isPastLock;
          return (
            <Card key={game.id} className="p-4">
              <p className="mb-2 text-sm text-muted">
                {new Date(game.kickoffTime).toLocaleString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              <div className="flex gap-2">
                {[game.awayTeam, game.homeTeam].map((team) => {
                  const selected = myPick?.pick === team;
                  const showResult = game.status === "final" && myPick;
                  return (
                    <button
                      key={team}
                      type="button"
                      disabled={locked || submittingGameId === game.id}
                      onClick={() => submitPick(game.id, team)}
                      className={`flex-1 rounded-md border px-2 py-2 text-sm transition-colors disabled:cursor-not-allowed ${
                        selected
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-border/15 bg-surface-muted/40 text-ink hover:border-primary/60"
                      }`}
                    >
                      {team}
                      {showResult && selected && (
                        <span className={`ml-1 ${myPick.correct ? "text-win" : "text-loss"}`}>
                          {myPick.correct ? "✓" : "✗"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {game.status === "final" && (
                <p className="mt-2 text-xs text-muted">
                  Final: {game.awayTeam} {game.awayScore} &ndash; {game.homeTeam} {game.homeScore}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {visible && others.length > 0 && (
        <Card className="p-4">
          <p className="text-lg text-primary mb-3">Everyone&rsquo;s Picks</p>
          <div className="flex flex-col gap-3">
            {others.map((other) => {
              const correctCount = Object.values(other.picks).filter((p) => p.correct === true).length;
              return (
                <div key={other.userId} className="border-b border-border/10 pb-2 last:border-b-0">
                  <p className="text-sm text-ink">
                    <span className="font-semibold text-primary">{other.username}</span>
                    {games.every((g) => g.status === "final") && (
                      <span className="ml-2 text-muted">
                        {correctCount} / {games.length} correct
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    {games
                      .map((g) => {
                        const p = other.picks[g.id];
                        if (!p) return null;
                        const mark = p.correct === null ? "" : p.correct ? " ✓" : " ✗";
                        return `${p.pick}${mark}`;
                      })
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
