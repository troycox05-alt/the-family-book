"use client";

import { useState } from "react";
import { OpsPanel } from "./OpsPanel";
import { GamesPanel } from "./GamesPanel";
import { TossUpAdminPanel } from "./TossUpAdminPanel";
import { TeamsPanel } from "./TeamsPanel";
import { UsersPanel } from "./UsersPanel";

const TABS = [
  { key: "ops", label: "Quota & Sync", Component: OpsPanel },
  { key: "games", label: "Games", Component: GamesPanel },
  { key: "tossup", label: "Toss-Up Five", Component: TossUpAdminPanel },
  { key: "teams", label: "Teams", Component: TeamsPanel },
  { key: "users", label: "Users", Component: UsersPanel },
] as const;

export function AdminPanel() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("ops");
  const Active = TABS.find((t) => t.key === tab)!.Component;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md border px-3 py-1.5 text-sm cursor-pointer ${
              tab === t.key ? "border-brass bg-brass/20 text-brass-light" : "border-cream/15 text-cream-dim hover:border-brass/50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <Active />
    </div>
  );
}
