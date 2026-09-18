import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`card-texture rounded-lg border border-brass/30 shadow-[0_8px_30px_rgba(0,0,0,0.4)] ${className}`}
    >
      {children}
    </div>
  );
}
