"use client";

import { useHelpModal } from "./HelpModalContext";

export function HelpButton() {
  const { open } = useHelpModal();
  return (
    <button
      type="button"
      onClick={open}
      aria-label="How this works"
      className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-sm font-semibold text-muted hover:border-primary hover:text-primary cursor-pointer"
    >
      ?
    </button>
  );
}
