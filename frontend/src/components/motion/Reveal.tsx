import { type ReactNode, useEffect, useRef } from "react";

export function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (
      !el ||
      !window.IntersectionObserver ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
      return;
    // Only hide below-fold content; content stays visible if JS/observer is unavailable.
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    el.classList.add("reveal-pending");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.remove("reveal-pending");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px 40px 0px", threshold: 0.03 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      el.classList.remove("reveal-pending");
    };
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
