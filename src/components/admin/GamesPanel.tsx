"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Game = {
  id: string;
  week: number;
  home_team: string;
  away_team: string;
  kickoff_time: string;
  spread_line: number | null;
  spread_odds: number | null;
  moneyline_home: number | null;
  moneyline_away: number | null;
  total: number | null;
  total_odds: number | null;
  status: string;
};

function GameRow({ game, onSaved }: { game: Game; onSaved: () => void }) {
  const [fields, setFields] = useState({
    spread_line: game.spread_line ?? "",
    spread_odds: game.spread_odds ?? "",
    moneyline_home: game.moneyline_home ?? "",
    moneyline_away: game.moneyline_away ?? "",
    total: game.total ?? "",
    total_odds: game.total_odds ?? "",
  });
  const [saving, setSaving] = useState(false);

  function set(key: keyof typeof fields, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const payload: Record<string, number | null> = {};
      for (const [key, value] of Object.entries(fields)) {
        payload[key] = value === "" ? null : Number(value);
      }
      await fetch(`/api/admin/games/${game.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function toggleVoid() {
    setSaving(true);
    try {
      await fetch(`/api/admin/games/${game.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: game.status === "void" ? "open" : "void" }),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-cream">
          Wk {game.week} &middot; {game.away_team} @ {game.home_team}
        </span>
        <span className={`text-xs uppercase ${game.status === "void" ? "text-loss" : game.status === "final" ? "text-cream-dim" : "text-win"}`}>
          {game.status}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <Input placeholder="Spread" value={fields.spread_line} onChange={(e) => set("spread_line", e.target.value)} />
        <Input placeholder="Sprd odds" value={fields.spread_odds} onChange={(e) => set("spread_odds", e.target.value)} />
        <Input placeholder="ML home" value={fields.moneyline_home} onChange={(e) => set("moneyline_home", e.target.value)} />
        <Input placeholder="ML away" value={fields.moneyline_away} onChange={(e) => set("moneyline_away", e.target.value)} />
        <Input placeholder="Total" value={fields.total} onChange={(e) => set("total", e.target.value)} />
        <Input placeholder="Total odds" value={fields.total_odds} onChange={(e) => set("total_odds", e.target.value)} />
      </div>
      <div className="mt-2 flex gap-2">
        <Button onClick={save} disabled={saving} className="text-xs px-3 py-1.5">
          Save lines
        </Button>
        <Button onClick={toggleVoid} disabled={saving} variant="ghost" className="text-xs px-3 py-1.5">
          {game.status === "void" ? "Un-void" : "Void game"}
        </Button>
      </div>
    </Card>
  );
}

export function GamesPanel() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkText, setBulkText] = useState("");
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/games");
    if (res.ok) setGames((await res.json()).games);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount
    void load();
  }, []);

  async function submitBulk() {
    setBulkSubmitting(true);
    setBulkMessage(null);
    try {
      const res = await fetch("/api/admin/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: bulkText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBulkMessage(data.error ?? "Could not add games.");
        return;
      }
      setBulkMessage(`Added ${data.inserted} game(s).`);
      setBulkText("");
      await load();
    } finally {
      setBulkSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <p className="font-display text-lg text-brass-light mb-2">Bulk Paste a Slate</p>
        <p className="mb-2 text-xs text-cream-dim">
          One game per line, CSV: week,kickoff_time_iso,home_team,away_team,spread_line,spread_odds,moneyline_home,moneyline_away,total,total_odds
          &mdash; leave odds fields blank if unknown.
        </p>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          rows={5}
          placeholder="4,2026-09-26T19:00:00Z,Ohio State,Michigan,-3.5,-110,-180,155,,"
          className="w-full rounded-md border border-cream/20 bg-felt-darker/60 px-3 py-2 text-sm text-cream placeholder:text-cream-dim/50 outline-none focus:border-brass"
        />
        <Button onClick={submitBulk} disabled={bulkSubmitting || !bulkText.trim()} className="mt-2 text-sm">
          {bulkSubmitting ? "Adding…" : "Add games"}
        </Button>
        {bulkMessage && <p className="mt-2 text-xs text-cream-dim">{bulkMessage}</p>}
      </Card>

      <div className="flex flex-col gap-2">
        {loading && <p className="text-cream-dim text-sm">Loading…</p>}
        {games.map((g) => (
          <GameRow key={g.id} game={g} onSaved={load} />
        ))}
      </div>
    </div>
  );
}
