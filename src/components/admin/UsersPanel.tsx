"use client";

import { useEffect, useState } from "react";
import { supabasePublic } from "@/lib/supabase/browser";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type User = { id: string; username: string; balance: number; is_admin: boolean };

function UserRow({ user, onSaved }: { user: User; onSaved: () => void }) {
  const [value, setValue] = useState(String(user.balance));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: Number(value) }),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="flex items-center justify-between gap-2 border-b border-cream/10 py-2 text-sm">
      <span className="text-cream">{user.username}</span>
      <div className="flex items-center gap-2">
        <Input value={value} onChange={(e) => setValue(e.target.value)} className="w-28" />
        <Button onClick={save} disabled={saving} className="text-xs px-3 py-1.5">
          Set
        </Button>
      </div>
    </li>
  );
}

export function UsersPanel() {
  const [users, setUsers] = useState<User[]>([]);

  async function load() {
    const { data } = await supabasePublic.from("leaderboard").select("id, username, balance, is_admin").order("username");
    // The view's generated types mark these nullable even though the
    // underlying users columns are NOT NULL, so filter defensively.
    const rows = (data ?? []).filter(
      (u): u is User => u.id !== null && u.username !== null && u.balance !== null && u.is_admin !== null,
    );
    setUsers(rows);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount
    void load();
  }, []);

  return (
    <Card className="p-4">
      <p className="font-display text-lg text-brass-light mb-2">Balance Corrections</p>
      <ul>
        {users.map((u) => (
          <UserRow key={u.id} user={u} onSaved={load} />
        ))}
      </ul>
    </Card>
  );
}
