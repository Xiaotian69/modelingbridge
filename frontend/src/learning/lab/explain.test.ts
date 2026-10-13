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
    expect(e.lines.join("")).toContain("A 的利润在 25–100 元之间时，A 40 m²、B 20 m² 都是最优计划");
    expect(e.lines.join("")).toContain("B 的利润在 20–80 元之间时也一样");
    // Endpoints are ties, not "still the unique optimum".
    expect(e.lines.join("")).toContain(
      "注意端点：A 的利润等于 25 元、A 的利润等于 100 元、B 的利润等于 20 元、B 的利润等于 80 元时，等值线正好与一条边界平行，这个计划仍然最优，但与相邻的计划并列最优，最优解不再唯一",
    );
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
    // Only 20 (A) and 40 (B) are ties; B = 0 is just the slider's lower limit.
    expect(e.lines.join("")).toContain("注意端点：A 的利润等于 20 元、B 的利润等于 40 元时");
    expect(e.lines.join("")).not.toContain("B 的利润等于 0 元");
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
      // Exactly at a tie endpoint v is still optimal, but no longer the only optimum;
      // at a lower end of 0 that is only the non-negativity limit, v stays the unique optimum.
      for (const [end, tie] of [
        [range!.lo, range!.loTie],
        [range!.hi, range!.hiTie],
      ] as const) {
        if (!Number.isFinite(end)) continue;
        const r2 = at(end);
        expect(r2.status === "optimal" && r2.optima.some((o) => same(o, v))).toBe(true);
        if (r2.status === "optimal") expect(r2.unique).toBe(!tie);
      }
    }
  });
});
