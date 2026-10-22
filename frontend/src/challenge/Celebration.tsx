import { useEffect, useState } from "react";

/**
 * 结果页的完成仪式：一阵从卡片上方落下的小彩片，约 1.6 秒后整块移出 DOM（截图时不会留下）。
 * - 系统“减少动态效果”时不放彩片（卡片仍会出现，见 challenge.css 的 --motion-scale）；
 * - 低性能设备（data-motion="lite"）彩片减半；
 * - 只用 CSS transform / opacity 动画，不用 canvas，不占主线程。
 */
const COUNT = 26;
const LIFETIME_MS = 1900;

/** 固定种子的伪随机：每次彩片位置一样，测试和截图都稳定。 */
function pieces(count: number) {
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  return Array.from({ length: count }, (_, i) => ({
    x: 4 + rnd() * 92, // 起点横向位置（%）
    dx: (rnd() - 0.5) * 70, // 横向漂移（px）
    fall: 150 + rnd() * 140, // 下落距离（px）
    spin: (rnd() - 0.5) * 900, // 旋转角度
    delay: Math.round(rnd() * 260),
    dur: Math.round(950 + rnd() * 500),
    tone: i % 4,
    shape: i % 3,
  }));
}

function reducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function Celebration() {
  const [alive, setAlive] = useState(() => !reducedMotion());
  useEffect(() => {
    if (!alive) return;
    const timer = window.setTimeout(() => setAlive(false), LIFETIME_MS);
    return () => window.clearTimeout(timer);
  }, [alive]);
  if (!alive) return null;
  const lite = document.documentElement.dataset.motion === "lite";
  return (
    <div className="cg-confetti" aria-hidden="true" data-testid="celebration">
      {pieces(lite ? COUNT / 2 : COUNT).map((p, i) => (
        <i
          key={i}
          className={`tone-${p.tone} shape-${p.shape}`}
          style={
            {
              left: `${p.x}%`,
              "--dx": `${p.dx}px`,
              "--fall": `${p.fall}px`,
              "--spin": `${p.spin}deg`,
              animationDelay: `${p.delay}ms`,
              animationDuration: `${p.dur}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
