import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    "rounded-lg px-4 py-2.5 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
  const variants: Record<Variant, string> = {
    primary: "bg-primary text-white hover:bg-primary-hover",
    ghost: "bg-transparent text-ink border border-border hover:bg-surface-muted",
    danger: "bg-transparent text-loss border border-loss/30 hover:bg-loss-soft",
  };

  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
