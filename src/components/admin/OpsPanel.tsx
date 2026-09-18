"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type QuotaRow = {
  id: string;
  sync_type: "odds" | "scores";
  requests_used: number | null;
  requests_remaining: number | null;
  checked_at: string;
};

export function OpsPanel() {
  const [log, setLog] = useState<QuotaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<"odds" | "scores" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadQuota() {
    const res = await fetch("/api/admin/quota");
    if (res.ok) setLog((await res.json()).log);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount
    void loadQuota();
  }, []);

  async function triggerSync(kind: "odds" | "scores") {
    setSyncing(kind);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const data = await res.json();
      setMessage(res.ok ? `${kind} sync: ${JSON.stringify(data)}` : (data.error ?? "Sync failed."));
      await loadQuota();
    } finally {
      setSyncing(null);
    }
  }

  const latest = log[0];

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <p className="text-lg text-primary mb-2">The Odds API Quota</p>
        {loading ? (
          <p className="text-muted text-sm">Loading…</p>
        ) : latest ? (
          <p className="scoreboard text-2xl text-primary">
            {latest.requests_remaining ?? "?"} <span className="text-sm text-muted">remaining</span>
          </p>
        ) : (
          <p className="text-muted text-sm">No syncs logged yet.</p>
        )}
        <div className="mt-3 flex gap-2">
          <Button onClick={() => triggerSync("odds")} disabled={syncing !== null} className="text-sm">
            {syncing === "odds" ? "Syncing…" : "Sync odds now"}
          </Button>
          <Button onClick={() => triggerSync("scores")} disabled={syncing !== null} variant="ghost" className="text-sm">
            {syncing === "scores" ? "Checking…" : "Check scores now"}
          </Button>
        </div>
        {message && <p className="mt-2 text-xs text-muted break-words">{message}</p>}
      </Card>

      <Card className="p-4">
        <p className="text-lg text-primary mb-2">Recent Syncs</p>
        <ul className="flex flex-col gap-1 text-sm">
          {log.map((row) => (
            <li key={row.id} className="flex justify-between border-b border-border/10 py-1 text-muted">
              <span>
                {row.sync_type} &middot; {new Date(row.checked_at).toLocaleString()}
              </span>
              <span className="scoreboard">
                {row.requests_used ?? "?"} used / {row.requests_remaining ?? "?"} left
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
