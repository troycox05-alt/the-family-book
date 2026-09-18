import { supabaseAdmin } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";

export default async function LeaderboardPage() {
  const { data: users } = await supabaseAdmin
    .from("leaderboard")
    .select("id, username, balance, is_admin")
    .order("balance", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl text-brass-light mb-4">Leaderboard</h1>
      <Card className="overflow-hidden">
        <ul>
          {(users ?? []).map((user, index) => (
            <li
              key={user.id}
              className="flex items-center justify-between border-b border-cream/10 px-4 py-3 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <span className="scoreboard w-6 text-right text-cream-dim">{index + 1}</span>
                <span className="text-cream">
                  {user.username}
                  {user.is_admin && <span className="ml-2 text-xs uppercase tracking-wider text-brass-light">House</span>}
                </span>
              </div>
              <span className="scoreboard text-lg font-bold text-brass-light">${Number(user.balance).toFixed(2)}</span>
            </li>
          ))}
          {(!users || users.length === 0) && <li className="px-4 py-3 text-cream-dim">No accounts yet.</li>}
        </ul>
      </Card>
    </div>
  );
}
