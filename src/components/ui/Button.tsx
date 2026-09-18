import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    "rounded-md px-4 py-2.5 font-semibold tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
  const variants: Record<Variant, string> = {
    primary:
      "bg-brass text-felt-darker hover:bg-brass-light border border-brass-dark shadow-[0_2px_0_0_var(--color-brass-dark)] active:translate-y-px active:shadow-none",
    ghost:
      "bg-transparent text-cream border border-cream/30 hover:border-brass hover:text-brass-light",
  };

  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
