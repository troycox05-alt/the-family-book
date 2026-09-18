import type { InputHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-ink placeholder:text-muted/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft ${props.className ?? ""}`}
    />
  );
}
