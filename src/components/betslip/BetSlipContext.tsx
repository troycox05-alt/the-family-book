"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Market } from "@/lib/bets/types";

export type SlipLeg = {
  gameId: string;
  market: Market;
  selection: string;
  /** e.g. "Ohio State -10.5", "Ohio State ML", "Over 54.5" */
  displayLabel: string;
  /** American odds at the moment it was added, for the live preview only — the server re-derives the real odds at submission time. */
  odds: number;
  /** "Away @ Home", for display in the slip. */
  gameLabel: string;
};

type BetSlipContextValue = {
  legs: SlipLeg[];
  addLeg: (leg: SlipLeg) => void;
  clear: () => void;
  isSelected: (gameId: string, market: string, selection: string) => boolean;
};

const BetSlipContext = createContext<BetSlipContextValue | null>(null);

export function BetSlipProvider({ children }: { children: ReactNode }) {
  const [legs, setLegs] = useState<SlipLeg[]>([]);

  const addLeg = useCallback((leg: SlipLeg) => {
    setLegs((prev) => {
      const withoutThisMarket = prev.filter((l) => !(l.gameId === leg.gameId && l.market === leg.market));
      const wasAlreadySelected = prev.some(
        (l) => l.gameId === leg.gameId && l.market === leg.market && l.selection === leg.selection,
      );
      // Clicking the same selection again deselects it; picking the other
      // side of the same market swaps it in.
      return wasAlreadySelected ? withoutThisMarket : [...withoutThisMarket, leg];
    });
  }, []);

  const clear = useCallback(() => setLegs([]), []);

  const isSelected = useCallback(
    (gameId: string, market: string, selection: string) =>
      legs.some((l) => l.gameId === gameId && l.market === market && l.selection === selection),
    [legs],
  );

  const value = useMemo(() => ({ legs, addLeg, clear, isSelected }), [legs, addLeg, clear, isSelected]);

  return <BetSlipContext.Provider value={value}>{children}</BetSlipContext.Provider>;
}

export function useBetSlip() {
  const ctx = useContext(BetSlipContext);
  if (!ctx) throw new Error("useBetSlip must be used within a BetSlipProvider");
  return ctx;
}
