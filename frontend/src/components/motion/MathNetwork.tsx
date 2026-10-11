import { useEffect, useRef } from "react";

/** Decorative graph: bounded resolution, 30fps, and no work offscreen. */
export function MathNetwork() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let reduced = media?.matches ?? false;
    let visible = true;
    let frame = 0;
    let last = 0;
    let phase = 0;
    let width = 600;
    let height = 460;
    let nodes: { x: number; y: number; z: number }[] = [];
    const pointer = { x: -1000, y: -1000 };

    function draw(delta = 0) {
      if (!ctx || !canvas) return;
      phase += delta * 0.000035;
      ctx.clearRect(0, 0, width, height);
      const radius = Math.min(width * 0.36, height * 0.37);
      const points = nodes.map((n) => {
        const x = n.x * Math.cos(phase) + n.z * Math.sin(phase);
        const z = n.z * Math.cos(phase) - n.x * Math.sin(phase);
        return {
          x: width / 2 + x * radius,
          y: height / 2 + n.y * radius * 0.94 + z * radius * 0.17,
          z,
        };
      });
      // Projection guides give the network a mathematical, rather than random, structure.
      ctx.strokeStyle = "rgba(105,192,186,0.12)";
      ctx.lineWidth = 1;
      [0.5, 0.78, 1.08].forEach((scale) => {
        ctx.beginPath();
        ctx.ellipse(
          width / 2,
          height / 2,
          radius * 1.25,
          radius * scale * 0.4,
          -0.38,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      });
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        for (let j = i + 1; j < points.length; j++) {
          const q = points[j];
          const distance = Math.hypot(
            nodes[i].x - nodes[j].x,
            nodes[i].y - nodes[j].y,
            nodes[i].z - nodes[j].z,
          );
          if (distance > 0.65) continue;
          ctx.strokeStyle = `rgba(100,211,196,${(0.12 + (p.z + q.z + 2) * 0.045) * (1 - distance / 0.85)})`;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
        const near =
          !reduced && Math.hypot(p.x - pointer.x, p.y - pointer.y) < 95;
        ctx.fillStyle = `rgba(139,235,217,${0.28 + (p.z + 1) * 0.3})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, near ? 3.5 : 1.4 + (p.z + 1) * 0.65, 0, Math.PI * 2);
        ctx.fill();
        if (near) {
          ctx.strokeStyle = "rgba(139,235,217,0.13)";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      }
    }
    function tick(time: number) {
      frame = 0;
      if (document.hidden || !visible || reduced) return;
      if (time - last >= 1000 / 30) {
        draw(last ? Math.min(time - last, 64) : 0);
        last = time;
      }
      frame = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      if (!document.hidden && visible) {
        draw();
        if (!reduced) frame = requestAnimationFrame(tick);
      }
    }
    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = rect.width || 600;
      height = rect.height || 460;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = width < 500 ? 48 : 88;
      nodes = Array.from({ length: count }, (_, i) => {
        const y = 1 - (i / (count - 1)) * 2;
        const ring = Math.sqrt(1 - y * y);
        const angle = i * Math.PI * (3 - Math.sqrt(5));
        return { x: Math.cos(angle) * ring, y, z: Math.sin(angle) * ring };
      });
      sync();
    }
    function motionChange(event: MediaQueryListEvent) {
      reduced = event.matches;
      sync();
    }
    function move(event: PointerEvent) {
      if (reduced || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    }
    function leave() {
      pointer.x = pointer.y = -1000;
    }
    const parent = canvas.parentElement;
    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            sync();
          })
        : null;
    observer?.observe(canvas);
    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(canvas);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", sync);
    media?.addEventListener("change", motionChange);
    parent?.addEventListener("pointermove", move);
    parent?.addEventListener("pointerleave", leave);
    resize();
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", sync);
      media?.removeEventListener("change", motionChange);
      parent?.removeEventListener("pointermove", move);
      parent?.removeEventListener("pointerleave", leave);
    };
  }, []);
  return <canvas ref={ref} className="math-network" aria-hidden="true" />;
}
