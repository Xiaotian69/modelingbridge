import { useEffect, useRef } from "react";
import {
  HERO_SPIN,
  MAX_DPR,
  NETWORK_COLORS,
  linkAlpha,
  linkPairs,
  nodeAlpha,
  nodeCount,
  nodeRadius,
  projectNodes,
  sphereNodes,
  type NetworkNode,
} from "./networkGeometry";

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
    let nodes: NetworkNode[] = [];
    let pairs: [number, number, number][] = [];
    const pointer = { x: -1000, y: -1000 };

    function draw(delta = 0) {
      if (!ctx || !canvas) return;
      phase += delta * HERO_SPIN;
      ctx.clearRect(0, 0, width, height);
      const radius = Math.min(width * 0.36, height * 0.37);
      const points = projectNodes(nodes, phase, width / 2, height / 2, radius);
      // Projection guides give the network a mathematical, rather than random, structure.
      ctx.strokeStyle = NETWORK_COLORS.guide;
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
      for (const [i, j, distance] of pairs) {
        const p = points[i];
        const q = points[j];
        ctx.strokeStyle = NETWORK_COLORS.link(linkAlpha(p.z, q.z, distance));
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
      for (const p of points) {
        const near =
          !reduced && Math.hypot(p.x - pointer.x, p.y - pointer.y) < 95;
        ctx.fillStyle = NETWORK_COLORS.node(nodeAlpha(p.z));
        ctx.beginPath();
        ctx.arc(p.x, p.y, near ? 3.5 : nodeRadius(p.z), 0, Math.PI * 2);
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
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes = sphereNodes(nodeCount(width));
      pairs = linkPairs(nodes);
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
