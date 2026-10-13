import { describe, expect, it } from "vitest";
import fixture from "./lp2d-verified.json";
import { explain, stabilityRange } from "./explain";
import { solveLab, type Model } from "./lp2d";
import { DEFAULT_STATE, PRESETS, toModel } from "./LpLab";

const same = (p: number[], q: number[]) => Math.abs(p[0] - q[0]) < 1e-7 && Math.abs(p[1] - q[1]) < 1e-7;

describe("explanations come from the solver", () => {
  it("textbook case: corner, used-up resources and the classic ranges 25–100 / 20–80", () => {
    const m = toModel(DEFAULT_STATE);
    const r = solveLab(m);
    const e = explain(m, r);
    expect(e.headline).toBe("最优计划：A 40 m²、B 20 m²，利润 2600 元");
    expect(e.lines.join("")).toContain("「切割」、「装配」");
    expect(e.lines.join("")).toContain("A 的利润在 25–100 元之间时最优点不变");
    expect(e.lines.join("")).toContain("B 的利润在 20–80 元之间时最优点不变");
  });

  it("each preset produces its situation", () => {
    const by = Object.fromEntries(PRESETS.map((p) => [p.id, explain(toModel(p.state), solveLab(toModel(p.state)))]));
    expect(by.default.tone).toBe("ok");
    expect(by.multiple.headline).toBe("多重最优解：最大利润 2000 元");
    expect(by.multiple.lines[0]).toContain("「装配」");
    expect(by.infeasible.headline).toBe("无可行解");
    // The maximum total output is computed (60 m² at (40, 20)), not assumed.
    expect(by.infeasible.lines[0]).toContain("最多只能生产 60 m²");
    expect(by.unbounded.headline).toBe("无界：利润可以无限增大");
    expect(by.unbounded.lines[0]).toContain("只增加 B");
  });

  it("reports leftover resources at a corner where only one resource is used up", () => {
    const m = toModel({ ...DEFAULT_STATE, c1: 80, c2: 10 });
    const e = explain(m, solveLab(m));
    expect(e.headline).toBe("最优计划：A 50 m²、B 0 m²，利润 4000 元");
    expect(e.lines.join("")).toContain("「装配」还剩 30");
    expect(e.lines.join("")).toContain("A 的利润不低于 20 元时");
    expect(e.lines.join("")).toContain("B 的利润不超过 40 元时");
  });
});

describe("stability ranges are correct (checked by re-solving)", () => {
  const unique = fixture.filter((s) => s.status === "optimal" && (s as { unique?: boolean }).unique);
  it.each(unique.slice(0, 120).map((s, i) => [i, s] as const))("model #%i", (_, s) => {
    const m = s.model as unknown as Model;
    const r = solveLab(m);
    if (r.status !== "optimal") throw new Error("expected optimal");
    const v = r.optima[0];
    for (const k of [0, 1] as const) {
      const range = stabilityRange(m, r, v, k);
      expect(range).not.toBeNull();
      const at = (ck: number) => {
        const c: [number, number] = [...m.c] as [number, number];
        c[k] = ck;
        return solveLab({ ...m, c });
      };
      // Inside the range the same corner is optimal …
      const mid = range!.hi === Infinity ? range!.lo + 10 : (range!.lo + range!.hi) / 2;
      const inside = at(mid);
      expect(inside.status === "optimal" && inside.optima.some((o) => same(o, v))).toBe(true);
      // … just outside it is not (or the model stops being optimal at all).
      if (range!.hi !== Infinity) {
        const out = at(range!.hi + 1);
        expect(out.status !== "optimal" || !out.optima.some((o) => same(o, v))).toBe(true);
      }
      if (range!.lo > 1) {
        const out = at(range!.lo - 1);
        expect(out.status !== "optimal" || !out.optima.some((o) => same(o, v))).toBe(true);
      }
    }
  });
});
