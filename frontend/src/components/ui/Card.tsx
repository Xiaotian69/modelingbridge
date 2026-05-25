import { type ReactNode } from "react";

type CardVariant = "quiet" | "interactive" | "glass";

interface CardProps {
  variant?: CardVariant;
  className?: string;
  children: ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  quiet: "quiet-card",
  interactive: "interactive-card",
  glass: "glass-panel",
};

export function Card({ variant = "quiet", className, children }: CardProps) {
  return (
    <div className={[variantClasses[variant], className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
