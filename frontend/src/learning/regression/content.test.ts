import katex from "katex";
import { describe, expect, it } from "vitest";
import fixture from "./regression-verified.json";
import python from "./examples/regression_milktea.py?raw";
import {
  both,
  coldWeekday,
  hand,
  regressionSections,
  simple,
  tempWeekendCorr,
  tomorrowBoth,
  tomorrowInterval,
  tomorrowSimple,
  withEvent,
} from "./content";
import { SALES, TEMPERATURE, WEEKEND } from "./data";
import { regressionExerciseMeta } from "./exerciseMeta";
import { mean, twoSidedP } from "./math";
import { regressionQuestions } from "./questions";
import { REGRESSION_CHECKPOINT_IDS, REGRESSION_SECTIONS, REGRESSION_SECTION_IDS } from "./sectionIds";
import { practiceBankOf } from "../courseBanks";
import { asGradable } from "../courseQuestion";
import { evaluate } from "../evaluate";
import { grade } from "../grading";
import { ahpQuestions } from "../ahp/questions";
import { publishedQuestions } from "../questions";
import { topsisQuestions } from "../topsis/questions";

type AnyBlock = (typeof regressionSections)[number]["blocks"][number];
const text = (blocks: AnyBlock[]) =>
  blocks
    .map((b) =>
      b.type === "p" || b.type === "note" ? b.text : b.type === "table" ? [b.caption, ...b.rows.flat()].join(" ") : "",
    )
    .join(" ");
const section = (id: string) => text(regressionSections.find((s) => s.id === id)!.blocks);
const all = regressionSections.map((s) => text(s.blocks)).join(" ");
const q = (id: string) => regressionQuestions.find((x) => x.id === id)!;
const [b0, b1, b2] = both.coefficients;

describe("regression lesson structure", () => {
  it("matches the light section list and has unique ids", () => {
    expect(regressionSections.map((s) => [s.id, s.title])).toEqual(REGRESSION_SECTIONS.map((s) => [s.id, s.title]));
    expect(new Set(REGRESSION_SECTION_IDS).size).toBe(REGRESSION_SECTION_IDS.length);
  });

  it("parses every formula with KaTeX (throwOnError)", () => {
    for (const s of regressionSections)
      for (const b of s.blocks)
        if (b.type === "formula") expect(() => katex.renderToString(b.text, { throwOnError: true })).not.toThrow();
  });

  it("embeds every checkpoint once, in order, plus three figures, one lab and the bridge to LP", () => {
    const blocks = regressionSections.flatMap((s) => s.blocks);
    const embedded = blocks.filter((b) => b.type === "question").map((b) => (b as { id: string }).id);
    expect(embedded).toEqual(REGRESSION_CHECKPOINT_IDS);
    for (const id of embedded) expect(regressionQuestions.some((x) => x.id === id)).toBe(true);
    expect(blocks.filter((b) => b.type === "regression-lab")).toHaveLength(1);
    expect(blocks.filter((b) => b.type === "regression-figure").map((b) => (b as { view: string }).view)).toEqual([
      "scatter",
      "residuals",
      "two-lines",
    ]);
    expect(blocks.filter((b) => b.type === "course-bridge").map((b) => (b as { to: string }).to)).toEqual([
      "/learn/linear-programming#variables",
    ]);
  });

  it("every table row has as many cells as the header", () => {
    for (const b of regressionSections.flatMap((s) => s.blocks))
      if (b.type === "table") for (const row of b.rows) expect(row).toHaveLength(b.headers.length);
  });

  it("never leaves a placeholder or an undefined value in the text", () => {
    expect(all).not.toMatch(/undefined|NaN|\$\{/);
  });
});

describe("numbers in the text are the verified ones", () => {
  it("fits and predictions equal scipy / statsmodels", () => {
    expect(simple.slope).toBeCloseTo(fixture.simple.slope, 9);
    expect(simple.r2).toBeCloseTo(fixture.simple.r2, 10);
    both.coefficients.forEach((b, j) => expect(b).toBeCloseTo(fixture.multiple.coefficients[j], 9));
    expect(withEvent.slope).toBeCloseTo(fixture.withEvent.slope, 9);
    expect(tomorrowBoth).toBeCloseTo(fixture.predictions.tomorrowMultiple, 8);
    expect(tomorrowSimple).toBeCloseTo(fixture.predictions.tomorrowSimple, 8);
    expect(coldWeekday).toBeCloseTo(fixture.predictions.coldWeekday, 8);
    expect(tomorrowInterval.lower).toBeCloseTo(fixture.tomorrowInterval[0], 6);
    expect(tomorrowInterval.upper).toBeCloseTo(fixture.tomorrowInterval[1], 6);
    expect(tempWeekendCorr).toBeCloseTo(fixture.corrTempWeekend, 10);
  });

  it("states them", () => {
    expect(section("scatter")).toContain("r = 0.730");
    expect(section("least-squares")).toContain("b₁ = 4.33，b₀ = 81.29");
    expect(section("least-squares")).toContain("b₁ = 6 / 10 = 0.6，b₀ = 4 − 0.6 × 3 = 2.2");
    expect(section("fit")).toContain("R² = 0.533");
    expect(section("multiple")).toContain("R² 从 0.533 提高到 0.937");
    expect(section("multiple")).toContain("调整 R² = 0.925");
    expect(section("predict")).toContain("≈ 250.1 杯");
    expect(section("predict")).toContain("约 235 到 265 杯");
    expect(section("limits")).toContain("斜率就从 4.33 变成 1.54，R² 从 0.533 跌到 0.030");
  });

  it("the hand example table sums to Sxy = 6 and Sxx = 10", () => {
    expect(hand.sxy).toBe(6);
    expect(hand.sxx).toBe(10);
    expect(hand.slope).toBeCloseTo(0.6, 12);
    expect(hand.intercept).toBeCloseTo(2.2, 12);
  });

  it("the Python example uses the lesson's data", () => {
    expect(python).toContain(`[${TEMPERATURE.join(", ")}]`);
    expect(python).toContain(`[${WEEKEND.join(", ")}]`);
    expect(python).toContain(`[${SALES.join(", ")}]`);
    expect(python).toContain("np.array([[1, 32, 1]])");
  });
});

/** Sentences that describe the data in words: each claim is re-checked against the numbers. */
describe("claims in the text hold for the data", () => {
  const weekendRes = simple.residuals.filter((_, i) => WEEKEND[i]);
  it("§2/§5: every weekend lies above the simple line (all four residuals positive)", () => {
    expect(weekendRes).toHaveLength(4);
    weekendRes.forEach((e) => expect(e).toBeGreaterThan(0));
    expect(section("fit")).toContain(weekendRes.map((e) => e.toFixed(1)).join("、"));
  });

  it("§6: weekends were cooler, so the simple slope is smaller than the multiple one", () => {
    expect(mean(TEMPERATURE.filter((_, i) => WEEKEND[i]))).toBe(26.5);
    expect(mean(TEMPERATURE.filter((_, i) => !WEEKEND[i]))).toBeCloseTo(30.6, 12);
    expect(tempWeekendCorr).toBeLessThan(0);
    expect(simple.slope).toBeLessThan(b1);
  });

  it("§6: temperature and weekend have |t| far above 2; the intercept cannot be told apart from 0", () => {
    expect(Math.abs(both.tStats[1])).toBeGreaterThan(5);
    expect(Math.abs(both.tStats[2])).toBeGreaterThan(5);
    expect(Math.abs(both.tStats[0])).toBeLessThan(1);
    expect(twoSidedP(both.tStats[0], 11)).toBeGreaterThan(0.05);
    fixture.multiple.pValues.slice(1).forEach((p) => expect(p).toBeLessThan(0.001));
  });

  it("§7: inside the data the model is sensible, outside it gives negative cups", () => {
    expect(Math.min(...TEMPERATURE)).toBe(24);
    expect(Math.max(...TEMPERATURE)).toBe(35);
    expect(b0).toBeLessThan(0);
    expect(Math.round(b0)).toBe(-6);
    expect(tomorrowBoth - tomorrowSimple).toBeGreaterThan(25);
  });

  it("§9: one event day flattens the slope and wipes out R²", () => {
    expect(withEvent.slope).toBeLessThan(simple.slope / 2);
    expect(withEvent.r2).toBeLessThan(0.05);
  });

  it("question texts quote the verified numbers", () => {
    expect(q("regression-practice-1").prompt).toContain(`${simple.intercept.toFixed(2)} + ${simple.slope.toFixed(2)}`);
    expect(q("regression-practice-6").prompt).toContain(`−${(-b0).toFixed(2)} + ${b1.toFixed(2)} × 气温 + ${b2.toFixed(2)}`);
    expect(q("regression-practice-10").prompt).toContain(`${simple.slope.toFixed(2)}，加入“是否周末”后变成 ${b1.toFixed(2)}`);
    expect(q("regression-practice-10").explanation).toContain("周末平均 26.5 ℃，工作日平均 30.6 ℃");
    expect(q("regression-practice-12").prompt).toContain(`从 ${simple.slope.toFixed(2)} 变成 ${withEvent.slope.toFixed(2)}`);
    expect(q("regression-self-3").prompt).toContain(`R² ≈ ${both.r2.toFixed(3)}`);
    expect(q("regression-practice-8").prompt).toContain("24–35 ℃");
  });
});

describe("regression questions", () => {
  it("have unique prefixed ids that never collide with other banks", () => {
    const ids = regressionQuestions.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id.startsWith("regression-")).toBe(true));
    const others = [...publishedQuestions, ...ahpQuestions, ...topsisQuestions].map((x) => x.id);
    ids.forEach((id) => expect(others).not.toContain(id));
  });

  it("the practice bank (15 questions, as the 精讲目录 says) excludes inline checkpoints", () => {
    expect(practiceBankOf("regression")).toHaveLength(15);
    expect(practiceBankOf("regression").some((x) => x.placement === "inline")).toBe(false);
  });

  it("numeric answers equal the reference values", () => {
    const answer = (id: string) => (q(id) as { answer: number }).answer;
    const ex = fixture.exercises as Record<string, number>;
    for (const id of ["regression-practice-2", "regression-practice-3", "regression-practice-4", "regression-practice-5", "regression-practice-7", "regression-practice-11"])
      expect(answer(id)).toBeCloseTo(ex[id], 10);
  });

  it.each(regressionQuestions.map((x) => [x.id, x] as const))("%s: reference answer grades as correct; metadata is complete", (id, x) => {
    expect(grade(asGradable(x), x.type === "numeric" ? String(x.answer) : x.answer)).toBe("correct");
    expect(evaluate(x, x.type === "numeric" ? x.answer.toFixed(3) : x.answer)).toEqual({ status: "correct" });
    const meta = regressionExerciseMeta[id];
    expect(meta).toBeDefined();
    expect(REGRESSION_SECTION_IDS).toContain(meta.sectionId);
    expect(x.hints.length).toBeGreaterThan(0);
    if (x.type !== "numeric") {
      const wrong = x.options.map((o) => o.id).filter((o) => !(Array.isArray(x.answer) ? x.answer : [x.answer]).includes(o));
      expect(meta.errors.map((e) => ("option" in e ? e.option : "")).sort()).toEqual(wrong.sort());
    }
    for (const e of meta.errors) {
      if ("option" in e) expect(evaluate(x, x.type === "multiple" ? [e.option] : e.option)).toMatchObject({ status: "incorrect", tag: e.tag });
      else {
        expect(x.type).toBe("numeric");
        expect(evaluate(x, String(e.value))).toMatchObject({ status: "incorrect", tag: e.tag });
      }
    }
  });

  it("diagnoses typed mistakes the way a student would type them", () => {
    expect(evaluate(q("regression-practice-2"), "1.667")).toMatchObject({ tag: "分子分母颠倒" });
    expect(evaluate(q("regression-practice-2"), "0.775")).toMatchObject({ tag: "算成了相关系数" });
    expect(evaluate(q("regression-practice-3"), "5.8")).toMatchObject({ tag: "符号用反了" });
    expect(evaluate(q("regression-practice-4"), "0.4")).toMatchObject({ tag: "只算了 SSE / SST" });
    expect(evaluate(q("regression-practice-5"), "70")).toMatchObject({ tag: "漏了截距" });
    expect(evaluate(q("regression-practice-7"), "0.894")).toMatchObject({ tag: "开方而不是平方" });
    expect(evaluate(q("regression-practice-11"), "0.873")).toMatchObject({ tag: "分子用了 n" });
    expect(evaluate(q("regression-practice-11"), "0.882")).toEqual({ status: "correct" });
    expect(evaluate(q("regression-self-3"), ["explained"])).toEqual({ status: "partial", message: "选对了 1 项，还有 1 项没有选上。" });
  });
});
