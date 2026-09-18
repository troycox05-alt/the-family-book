import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { HelpButton } from "@/components/onboarding/HelpButton";

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
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-ink shrink-0">
            The Family Book
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm font-medium">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-muted hover:text-ink">
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" className="text-primary hover:text-primary-hover">
                Admin
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right leading-tight">
            <p className="text-xs text-muted">{username}</p>
            <p className="scoreboard text-lg font-bold text-ink">${balance.toFixed(2)}</p>
          </div>
          <HelpButton />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
