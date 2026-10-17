import { useId, type ReactNode } from "react";

/** Shared SVG frame for the regression figures and lab: temperature on x, cups (or residuals) on y. */
export const W = 560;
export const H = 360;
const PAD = { left: 80, right: 20, top: 16, bottom: 56 };

export type Scale = { sx: (x: number) => number; sy: (y: number) => number; x0: number; x1: number; y0: number; y1: number };
export function makeScale(x0: number, x1: number, y0: number, y1: number): Scale {
  return {
    x0,
    x1,
    y0,
    y1,
    sx: (x) => PAD.left + ((x - x0) / (x1 - x0)) * (W - PAD.left - PAD.right),
    sy: (y) => H - PAD.bottom - ((y - y0) / (y1 - y0)) * (H - PAD.top - PAD.bottom),
  };
}
const ticks = (lo: number, hi: number, step: number) => {
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6);
  return out;
};

export type Point = { x: number; y: number; weekend: boolean; extra?: boolean; label: string };

/** A day as a dot (weekday) or a filled square (weekend); the event day is a diamond. */
export function Marker({ p, s }: { p: Point; s: Scale }) {
  const cx = s.sx(p.x);
  const cy = s.sy(p.y);
  if (p.extra)
    return (
      <path className="reg-point is-extra" d={`M ${cx} ${cy - 8} L ${cx + 8} ${cy} L ${cx} ${cy + 8} L ${cx - 8} ${cy} Z`}>
        <title>{p.label}</title>
      </path>
    );
  return p.weekend ? (
    <rect className="reg-point is-weekend" x={cx - 6} y={cy - 6} width="12" height="12">
      <title>{p.label}</title>
    </rect>
  ) : (
    <circle className="reg-point" cx={cx} cy={cy} r="6">
      <title>{p.label}</title>
    </circle>
  );
}

/** Line y = b0 + b1·x clipped to the x range of the frame. */
export function FitLine({ b0, b1, s, className }: { b0: number; b1: number; s: Scale; className: string }) {
  return <line className={className} x1={s.sx(s.x0)} y1={s.sy(b0 + b1 * s.x0)} x2={s.sx(s.x1)} y2={s.sy(b0 + b1 * s.x1)} />;
}

export function Frame({
  s,
  title,
  desc,
  xLabel,
  yLabel,
  yStep,
  children,
}: {
  s: Scale;
  title: string;
  desc: string;
  xLabel: string;
  yLabel: string;
  yStep: number;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-t ${id}-d`}>
      <title id={`${id}-t`}>{title}</title>
      <desc id={`${id}-d`}>{desc}</desc>
      <defs>
        <clipPath id={`${id}-clip`}>
          <rect x={PAD.left} y={PAD.top} width={W - PAD.left - PAD.right} height={H - PAD.top - PAD.bottom} />
        </clipPath>
      </defs>
      {ticks(s.x0, s.x1, 2).map((t) => (
        <g key={`x${t}`}>
          <line className="lab-grid" x1={s.sx(t)} x2={s.sx(t)} y1={PAD.top} y2={H - PAD.bottom} />
          <text x={s.sx(t)} y={H - PAD.bottom + 18} textAnchor="middle">
            {t}
          </text>
        </g>
      ))}
      {ticks(s.y0, s.y1, yStep).map((t) => (
        <g key={`y${t}`}>
          <line className={t === 0 ? "reg-zero" : "lab-grid"} x1={PAD.left} x2={W - PAD.right} y1={s.sy(t)} y2={s.sy(t)} />
          <text x={PAD.left - 8} y={s.sy(t) + 4} textAnchor="end">
            {t}
          </text>
        </g>
      ))}
      <text className="lab-axis-label" x={(PAD.left + W - PAD.right) / 2} y={H - 10} textAnchor="middle">
        {xLabel}
      </text>
      <text className="lab-axis-label" transform={`translate(20 ${(PAD.top + H - PAD.bottom) / 2}) rotate(-90)`} textAnchor="middle">
        {yLabel}
      </text>
      <g clipPath={`url(#${id}-clip)`}>{children}</g>
    </svg>
  );
}
