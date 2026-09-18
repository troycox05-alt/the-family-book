import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";

type NavBarProps = {
  username: string;
  balance: number;
  isAdmin: boolean;
};

const links = [
  { href: "/", label: "Games" },
  { href: "/bets", label: "My Bets" },
  { href: "/toss-up", label: "Toss-Up Five" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function NavBar({ username, balance, isAdmin }: NavBarProps) {
  return (
    <header className="card-texture border-b border-brass/30 sticky top-0 z-20">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-display text-xl text-brass-light shrink-0">
            The Family Book
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-cream-dim hover:text-brass-light">
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" className="text-brass hover:text-brass-light">
                Admin
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right leading-tight">
            <p className="text-xs text-cream-dim">{username}</p>
            <p className="scoreboard text-lg font-bold text-brass-light">${balance.toFixed(2)}</p>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
