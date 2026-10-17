import { useEffect, useRef, type ReactNode } from "react";

/**
 * Sliding sheet shared by the mobile menu and (step 5) the AI helper drawer.
 * Always mounted so it slides out as smoothly as it slides in; when closed the layer is
 * `inert`, `aria-hidden` and `visibility: hidden` after the transition (design/motion.css).
 * The child is the panel itself and must carry `className="mb-sheet-panel"`.
 * Escape and focus handling stay with the owner, which knows the trigger button.
 */
export function Sheet({
  open,
  side,
  onBackdrop,
  children,
}: {
  open: boolean;
  side: "right" | "bottom";
  onBackdrop: () => void;
  children: ReactNode;
}) {
  const layer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (layer.current) (layer.current as HTMLElement & { inert: boolean }).inert = !open;
  }, [open]);
  return (
    <div
      ref={layer}
      className="mb-sheet-layer"
      data-open={open}
      data-side={side}
      aria-hidden={!open || undefined}
    >
      <div className="mb-sheet-backdrop" onClick={onBackdrop} />
      {children}
    </div>
  );
}
