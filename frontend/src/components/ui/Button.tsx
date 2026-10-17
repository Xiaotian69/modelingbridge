import { type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-bridge-700 text-white hover:bg-bridge-600 disabled:opacity-40",
  secondary:
    "border border-slate-300 bg-white text-slate-800 hover:border-slate-500 disabled:opacity-50",
  ghost:
    "border border-bridge-600 bg-white text-bridge-800 hover:bg-bridge-50 disabled:opacity-50",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        "relative rounded-lg font-semibold transition disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <span className={loading ? "invisible" : undefined}>{children}</span>
      {loading && (
        <span
          className="absolute inset-0 flex items-center justify-center"
          aria-label="加载中"
        >
          <span className="loading-dot" />
        </span>
      )}
    </button>
  );
}
