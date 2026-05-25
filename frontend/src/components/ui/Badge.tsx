import { type ReactNode } from "react";

type BadgeVariant = "default" | "success" | "locked" | "ai";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "border border-white/15 bg-white/10 text-emerald-100",
  success: "border border-emerald-200 bg-emerald-50 text-emerald-900",
  locked: "border border-slate-100 bg-slate-50 text-slate-400",
  ai: "border border-bridge-200 bg-bridge-50 text-bridge-800",
};

export function Badge({ variant = "default", children }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex rounded-md px-3 py-1 text-xs font-semibold",
        variantClasses[variant],
      ].join(" ")}
    >
      {children}
    </span>
  );
}
