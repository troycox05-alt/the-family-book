import type { InputHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-cream/20 bg-felt-darker/60 px-3 py-2.5 text-cream placeholder:text-cream-dim/60 outline-none focus:border-brass focus:ring-1 focus:ring-brass ${props.className ?? ""}`}
    />
  );
}
