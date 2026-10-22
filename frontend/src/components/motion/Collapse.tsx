import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Smooth expand / collapse (CSS grid 0fr ↔ 1fr, see design/motion.css), no height math.
 * - While closing, the last open content stays rendered so it can fade out instead of popping.
 * - Closed content is `inert` and `aria-hidden`: no focus, no clicks, not read aloud.
 * - Under reduced motion the token durations are 0, so it simply shows / hides.
 */
export function Collapse({
  open,
  children,
  id,
  className = "",
  appear = false,
}: {
  open: boolean;
  /** Mounting already open still eases in (e.g. a panel created on first use). */
  appear?: boolean;
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef<ReactNode>(children);
  const [entered, setEntered] = useState(!appear);
  useEffect(() => {
    if (entered) return;
    // Two frames: the closed state must be painted once for the transition to run.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [entered]);
  const shown = open && entered;
  if (open) last.current = children;
  useEffect(() => {
    if (ref.current) (ref.current as HTMLElement & { inert: boolean }).inert = !open;
  }, [open]);
  return (
    <div
      ref={ref}
      id={id}
      className={`mb-collapse ${className}`.trim()}
      data-open={shown}
      aria-hidden={!open || undefined}
    >
      <div className="mb-collapse-inner">{open ? children : last.current}</div>
    </div>
  );
}
