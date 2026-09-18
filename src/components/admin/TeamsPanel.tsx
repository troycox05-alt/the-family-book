"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const CONFERENCES = ["ACC", "Big Ten", "Big 12", "SEC"];

type Team = { id: string; name: string; conference: string };

export function TeamsPanel() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [name, setName] = useState("");
  const [conference, setConference] = useState(CONFERENCES[0]);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/teams");
    if (res.ok) setTeams((await res.json()).teams);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount
    void load();
  }, []);

  async function addTeam() {
    setMessage(null);
    const res = await fetch("/api/admin/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, conference }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error);
      return;
    }
    setName("");
    await load();
  }

  async function removeTeam(id: string) {
    await fetch(`/api/admin/teams/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <p className="text-lg text-primary mb-2">Add a Team</p>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="School name" value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" />
          <select
            value={conference}
            onChange={(e) => setConference(e.target.value)}
            className="rounded-md border border-border/20 bg-surface-muted/60 px-3 py-2.5 text-ink outline-none focus:border-primary"
          >
            {CONFERENCES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Button onClick={addTeam} disabled={!name.trim()}>
            Add
          </Button>
        </div>
        {message && <p className="mt-2 text-sm text-loss">{message}</p>}
      </Card>

      {CONFERENCES.map((conf) => (
        <Card key={conf} className="p-4">
          <p className="text-lg text-primary mb-2">{conf}</p>
          <ul className="flex flex-col gap-1">
            {teams
              .filter((t) => t.conference === conf)
              .map((t) => (
                <li key={t.id} className="flex items-center justify-between text-sm text-ink">
                  {t.name}
                  <button onClick={() => removeTeam(t.id)} className="text-xs text-loss hover:underline cursor-pointer">
                    remove
                  </button>
                </li>
              ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
