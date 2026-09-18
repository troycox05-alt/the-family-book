"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { HelpModal } from "./HelpModal";

const STORAGE_KEY = "fb_onboarded";

const HelpModalContext = createContext<{ open: () => void } | null>(null);

export function HelpModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.localStorage.getItem(STORAGE_KEY)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing initial state from localStorage, not derived from other React state
      setIsOpen(true);
    }
  }, []);

  function close() {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setIsOpen(false);
  }

  return (
    <HelpModalContext.Provider value={{ open: () => setIsOpen(true) }}>
      {children}
      {isOpen && <HelpModal onClose={close} />}
    </HelpModalContext.Provider>
  );
}

export function useHelpModal() {
  const ctx = useContext(HelpModalContext);
  if (!ctx) throw new Error("useHelpModal must be used within a HelpModalProvider");
  return ctx;
}
