"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Game = { id: string; home_team: string; away_team: string; kickoff_time: string; status: string };

type Week = {
  id: string;
  label: string;
  lock_time: string;
  bonus_amount: number;
  bonus_awarded_at: string | null;
  toss_up_games: { game_id: string; games: { id: string; home_team: string; away_team: string; kickoff_time: string } | null }[];
};

function GamePicker({ games, selected, onToggle }: { games: Game[]; selected: Set<string>; onToggle: (id: string) => void }) {
  return (
    <div className="max-h-48 overflow-y-auto rounded-md border border-cream/10 p-2">
      {games.map((g) => (
        <label key={g.id} className="flex items-center gap-2 py-1 text-sm text-cream">
          <input type="checkbox" checked={selected.has(g.id)} onChange={() => onToggle(g.id)} />
          {g.away_team} @ {g.home_team}
        </label>
      ))}
    </div>
  );
}

function WeekCard({ week, games, onSaved }: { week: Week; games: Game[]; onSaved: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(week.toss_up_games.map((tg) => tg.game_id)));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 5) next.add(id);
      return next;
    });
  }

  async function saveGames() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/toss-up-weeks/${week.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameIds: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error);
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-cream font-semibold">{week.label}</p>
        <span className="text-xs text-cream-dim">
          Locks {new Date(week.lock_time).toLocaleString()} &middot; ${Number(week.bonus_amount).toFixed(2)}
          {week.bonus_awarded_at && " — awarded"}
        </span>
      </div>
      <p className="mb-1 text-xs text-cream-dim">{selected.size} / 5 selected</p>
      <GamePicker games={games} selected={selected} onToggle={toggle} />
      <Button onClick={saveGames} disabled={saving || selected.size !== 5} className="mt-2 text-sm">
        Save 5 games
      </Button>
      {message && <p className="mt-1 text-xs text-loss">{message}</p>}
    </Card>
  );
}

export function TossUpAdminPanel() {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [label, setLabel] = useState("");
  const [lockTime, setLockTime] = useState("");
  const [bonusAmount, setBonusAmount] = useState("100");
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const [weeksRes, gamesRes] = await Promise.all([fetch("/api/admin/toss-up-weeks"), fetch("/api/admin/games")]);
    if (weeksRes.ok) setWeeks((await weeksRes.json()).weeks);
    if (gamesRes.ok) {
      const allGames = (await gamesRes.json()).games as Game[];
      setGames(allGames.filter((g) => g.status === "open"));
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount
    void load();
  }, []);

  async function createWeek() {
    setMessage(null);
    const res = await fetch("/api/admin/toss-up-weeks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, lockTime, bonusAmount: Number(bonusAmount) }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error);
      return;
    }
    setLabel("");
    setLockTime("");
    await load();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <p className="font-display text-lg text-brass-light mb-2">New Toss-Up Week</p>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Label, e.g. Week 4" value={label} onChange={(e) => setLabel(e.target.value)} className="max-w-xs" />
          <input
            type="datetime-local"
            value={lockTime}
            onChange={(e) => setLockTime(e.target.value)}
            className="rounded-md border border-cream/20 bg-felt-darker/60 px-3 py-2 text-cream outline-none focus:border-brass"
          />
          <Input placeholder="Bonus $" value={bonusAmount} onChange={(e) => setBonusAmount(e.target.value)} className="w-28" />
          <Button onClick={createWeek} disabled={!label.trim() || !lockTime}>
            Create
          </Button>
        </div>
        {message && <p className="mt-2 text-sm text-loss">{message}</p>}
      </Card>

      {weeks.map((week) => (
        <WeekCard key={week.id} week={week} games={games} onSaved={load} />
      ))}
    </div>
  );
}
