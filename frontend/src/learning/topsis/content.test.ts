import katex from "katex";
import { describe, expect, it } from "vitest";
import fixture from "./topsis-verified.json";
import python from "./examples/topsis_rooms.py?raw";
import {
  ahpCriteria,
  ahpWeights,
  entropy,
  entropyResult,
  equalResult,
  rentAsBenefit,
  result,
  shiftedResult,
  sixResult,
  topsisSections,
} from "./content";
import { CRITERIA, DATA, DIRECTIONS, EXTRA_ROW, ROOMS } from "./data";
import { topsisExerciseMeta } from "./exerciseMeta";
import { topsisQuestions } from "./questions";
import { TOPSIS_CHECKPOINT_IDS, TOPSIS_SECTIONS, TOPSIS_SECTION_IDS } from "./sectionIds";
import { practiceBankOf } from "../courseBanks";
import { asGradable } from "../courseQuestion";
import { evaluate } from "../evaluate";
import { grade } from "../grading";
import { ahpQuestions } from "../ahp/questions";
import { publishedQuestions } from "../questions";

type AnyBlock = (typeof topsisSections)[number]["blocks"][number];
const text = (blocks: AnyBlock[]) =>
  blocks
    .map((b) =>
      b.type === "p" || b.type === "note" ? b.text : b.type === "table" ? [b.caption, ...b.rows.flat()].join(" ") : "",
    )
    .join(" ");
const section = (id: string) => text(topsisSections.find((s) => s.id === id)!.blocks);
const all = topsisSections.map((s) => text(s.blocks)).join(" ");
const names = ROOMS.map((r) => r.name);
const col = (j: number) => DATA.map((row) => row[j]);
/** Best raw value of a criterion in its direction. */
const bestRaw = (j: number) => (DIRECTIONS[j] === "benefit" ? Math.max(...col(j)) : Math.min(...col(j)));
const worstRaw = (j: number) => (DIRECTIONS[j] === "benefit" ? Math.min(...col(j)) : Math.max(...col(j)));
const range = (j: number) => Math.max(...result.weighted.map((r) => r[j])) - Math.min(...result.weighted.map((r) => r[j]));

describe("TOPSIS lesson structure", () => {
  it("matches the light section list and has unique ids", () => {
    expect(topsisSections.map((s) => [s.id, s.title])).toEqual(TOPSIS_SECTIONS.map((s) => [s.id, s.title]));
    expect(new Set(TOPSIS_SECTION_IDS).size).toBe(TOPSIS_SECTION_IDS.length);
  });

  it("parses every formula with KaTeX (throwOnError)", () => {
    for (const s of topsisSections)
      for (const b of s.blocks)
        if (b.type === "formula") expect(() => katex.renderToString(b.text, { throwOnError: true })).not.toThrow();
  });

  it("embeds every checkpoint exactly once, in order, plus one plane, one lab and two course bridges", () => {
    const blocks = topsisSections.flatMap((s) => s.blocks);
    const embedded = blocks.filter((b) => b.type === "question").map((b) => (b as { id: string }).id);
    expect(embedded).toEqual(TOPSIS_CHECKPOINT_IDS);
    for (const id of embedded) expect(topsisQuestions.some((q) => q.id === id)).toBe(true);
    expect(blocks.filter((b) => b.type === "topsis-lab")).toHaveLength(1);
    expect(blocks.filter((b) => b.type === "topsis-plane")).toHaveLength(1);
    const bridges = blocks.filter((b) => b.type === "course-bridge") as { to: string }[];
    expect(bridges.map((b) => b.to)).toEqual(["/learn/ahp#weights", "/learn/ahp"]);
  });

  it("every table row has as many cells as the header", () => {
    for (const b of topsisSections.flatMap((s) => s.blocks))
      if (b.type === "table") for (const row of b.rows) expect(row).toHaveLength(b.headers.length);
  });
});

describe("numbers in the text are the verified ones", () => {
  it("results equal the numpy / scipy fixture", () => {
    ahpWeights.forEach((w, i) => expect(w).toBeCloseTo(fixture.ahp.weights[i], 10));
    (result.closeness as number[]).forEach((c, i) => expect(c).toBeCloseTo(fixture.lesson.ahp.closeness[i], 10));
    expect(result.order).toEqual(fixture.lesson.ahp.order);
    expect(equalResult.order).toEqual(fixture.lesson.equal.order);
    expect(entropyResult.order).toEqual(fixture.lesson.entropy.order);
    expect(sixResult.order).toEqual(fixture.lesson.sixRooms.order);
    expect(shiftedResult.order).toEqual(fixture.lesson.shiftedVariant.order);
    entropy.weights.forEach((w, i) => expect(w).toBeCloseTo(fixture.entropy.weights[i], 10));
  });

  it("states the computed values", () => {
    expect(section("weights")).toContain(`CR = ${ahpCriteria.cr!.toFixed(4)}`);
    expect(section("weights")).toContain(ahpWeights.map((w) => w.toFixed(3)).join("、"));
    expect(section("closeness")).toContain("丁 > 乙 > 戊 > 甲 > 丙");
    expect(section("closeness")).toContain("0.603");
    expect(section("normalise")).toContain(`(3/13, 4/13, 12/13) ≈ (0.231, 0.308, 0.923)`);
    expect(section("entropy")).toContain(entropy.weights.map((w) => w.toFixed(3)).join(" "));
  });

  it("the Python example uses the lesson's data and judgments", () => {
    for (const row of DATA) expect(python).toContain(`[${row.join(", ")}]`);
    expect(python).toContain("[1,   2,   3,   4]");
    expect(python).toContain("[1/4, 1/2, 1,   1]");
    expect(python).toContain("benefit = np.array([False, False, True, True])");
    expect(DIRECTIONS).toEqual(["cost", "cost", "benefit", "benefit"]);
  });
});

/** Sentences that describe the data in words: each claim is re-checked against the numbers. */
describe("claims in the text hold for the data", () => {
  const first = result.order[0];
  const cheapest = col(0).indexOf(Math.min(...col(0)));

  it("§1: 丙 is cheapest; 戊 is nearest, largest, best served and most expensive", () => {
    expect(names[cheapest]).toBe("丙");
    const wu = names.indexOf("戊");
    expect(col(1).indexOf(Math.min(...col(1)))).toBe(wu);
    expect(col(2).indexOf(Math.max(...col(2)))).toBe(wu);
    expect(col(3).indexOf(Math.max(...col(3)))).toBe(wu);
    expect(col(0).indexOf(Math.max(...col(0)))).toBe(wu);
    expect(1800 + 45 + 22 + 6).toBe(1873);
  });

  it("§4: rent and commute spread more than area and amenities after weighting; rent matters most to 小林", () => {
    expect(Math.min(range(0), range(1))).toBeGreaterThan(Math.max(range(2), range(3)));
    expect(ahpWeights.indexOf(Math.max(...ahpWeights))).toBe(0);
    expect(ahpCriteria.cr!).toBeLessThan(0.1);
  });

  it("§5: the ideal takes rent from 丙 and the rest from 戊; neither ideal is a real room", () => {
    expect(section("ideal")).toContain("理想房的月租取自丙，通勤、面积、配套取自戊");
    CRITERIA.forEach((_, j) => {
      const who = names[col(j).indexOf(bestRaw(j))];
      expect(who).toBe(j === 0 ? "丙" : "戊");
    });
    for (const row of DATA) {
      expect(row.every((v, j) => v === bestRaw(j))).toBe(false);
      expect(row.every((v, j) => v === worstRaw(j))).toBe(false);
    }
  });

  it("§6: the winner is best on no criterion; the cheapest has the longest commute and fewest amenities", () => {
    expect(names[first]).toBe("丁");
    CRITERIA.forEach((_, j) => expect(DATA[first][j]).not.toBe(bestRaw(j)));
    expect(DATA[cheapest][1]).toBe(Math.max(...col(1)));
    expect(DATA[cheapest][3]).toBe(Math.min(...col(3)));
    expect(result.order.at(-1)).toBe(cheapest);
  });

  it("§7: entropy weights are nearly equal with area highest, and rent is not favoured", () => {
    expect(Math.max(...entropy.weights) - Math.min(...entropy.weights)).toBeLessThan(0.05);
    expect(entropy.weights.indexOf(Math.max(...entropy.weights))).toBe(2);
    expect(entropy.weights[0]).toBeLessThan(0.25);
    expect(entropyResult.order[0]).not.toBe(first);
  });

  it("§9: weights, directions and the new room each change the conclusion as described", () => {
    expect(equalResult.order[0]).not.toBe(first);
    expect(rentAsBenefit.closeness[names.indexOf("戊")]).toBeCloseTo(1, 12);
    // 己 is never the winner, ranks 4th, yet 乙 overtakes 丁.
    expect(sixResult.order[0]).not.toBe(5);
    expect(sixResult.order.indexOf(5) + 1).toBe(4);
    expect(names[sixResult.order[0]]).toBe("乙");
    expect(result.order.indexOf(names.indexOf("乙"))).toBe(1);
    // It brings a shorter commute and fewer amenities than any original room.
    expect(EXTRA_ROW[1]).toBeLessThan(Math.min(...col(1)));
    expect(EXTRA_ROW[3]).toBeLessThan(Math.min(...col(3)));
    expect(shiftedResult.order[0]).toBe(cheapest);
    expect(section("limits")).toContain(`排名变成 丙 > 甲 > 丁 > 乙 > 戊`);
  });

  it("never leaves a template placeholder or an undefined value in the text", () => {
    expect(all).not.toMatch(/undefined|NaN|\$\{/);
  });
});

describe("TOPSIS questions", () => {
  it("have unique prefixed ids that never collide with other banks", () => {
    const ids = topsisQuestions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id.startsWith("topsis-")).toBe(true));
    const others = [...publishedQuestions, ...ahpQuestions].map((q) => q.id);
    ids.forEach((id) => expect(others).not.toContain(id));
  });

  it("the practice bank (12 questions, as the 精讲目录 says) excludes inline checkpoints", () => {
    expect(practiceBankOf("topsis")).toHaveLength(12);
    expect(practiceBankOf("topsis").some((q) => q.placement === "inline")).toBe(false);
  });

  it("numeric answers equal the numpy reference values", () => {
    const answer = (id: string) => (topsisQuestions.find((q) => q.id === id) as { answer: number }).answer;
    const ex = fixture.exercises as unknown as Record<string, number>;
    for (const id of ["topsis-practice-2", "topsis-practice-3", "topsis-practice-5", "topsis-practice-6", "topsis-practice-7"])
      expect(answer(id)).toBeCloseTo(ex[id], 10);
    expect(answer("topsis-practice-5")).toBeCloseTo(result.normalised[4][0], 12);
  });

  it("explanations that quote the lesson data are true", () => {
    const think3 = topsisQuestions.find((q) => q.id === "topsis-think-3")!;
    expect(think3.explanation).toContain("月租来自丙，其余三项来自戊");
    const p5 = topsisQuestions.find((q) => q.id === "topsis-practice-5")!;
    expect(p5.prompt).toContain(DATA.map((r) => r[0]).join("、"));
    expect(p5.explanation).toContain(`${DATA.reduce((s, r) => s + r[0] ** 2, 0).toLocaleString("en").replace(/,/g, " ")}`);
    const [dp, dm] = fixture.exercises.practice7Distances;
    expect(dp.toFixed(3)).toBe("0.206");
    expect(dm.toFixed(3)).toBe("0.100");
  });

  it.each(topsisQuestions.map((q) => [q.id, q] as const))("%s: reference answer grades as correct; metadata is complete", (id, q) => {
    expect(grade(asGradable(q), q.type === "numeric" ? String(q.answer) : q.answer)).toBe("correct");
    expect(evaluate(q, q.type === "numeric" ? q.answer.toFixed(3) : q.answer)).toEqual({ status: "correct" });
    const meta = topsisExerciseMeta[id];
    expect(meta).toBeDefined();
    expect(TOPSIS_SECTION_IDS).toContain(meta.sectionId);
    expect(q.hints.length).toBeGreaterThan(0);
    if (q.type !== "numeric") {
      // Every wrong option has its own diagnosis.
      const wrong = q.options.map((o) => o.id).filter((o) => !(Array.isArray(q.answer) ? q.answer : [q.answer]).includes(o));
      const diagnosed = meta.errors.map((e) => ("option" in e ? e.option : ""));
      expect(diagnosed.sort()).toEqual(wrong.sort());
    }
    for (const e of meta.errors) {
      if ("option" in e) {
        expect(q.type === "numeric" ? [] : q.options.map((o) => o.id)).toContain(e.option);
        expect(evaluate(q, q.type === "multiple" ? [e.option] : e.option)).toMatchObject({ status: "incorrect", tag: e.tag });
      } else {
        expect(q.type).toBe("numeric");
        expect(evaluate(q, String(e.value))).toMatchObject({ status: "incorrect", tag: e.tag });
      }
    }
  });

  it("diagnoses typed mistakes the way a student would type them", () => {
    const q = (id: string) => topsisQuestions.find((x) => x.id === id)!;
    expect(evaluate(q("topsis-practice-2"), "0.211")).toMatchObject({ tag: "用了求和归一化" });
    expect(evaluate(q("topsis-practice-2"), "0.333")).toMatchObject({ tag: "除以了最大值" });
    expect(evaluate(q("topsis-practice-3"), "0.6")).toMatchObject({ tag: "分子用了 D⁺" });
    expect(evaluate(q("topsis-practice-3"), "0.667")).toMatchObject({ tag: "分母少了一项" });
    expect(evaluate(q("topsis-practice-6"), "0.3")).toMatchObject({ tag: "忘了归一化" });
    expect(evaluate(q("topsis-practice-6"), "0.292")).toMatchObject({ tag: "用熵代替了差异系数" });
    expect(evaluate(q("topsis-practice-7"), "0.673")).toMatchObject({ tag: "分子用了 D⁺" });
    expect(evaluate(q("topsis-practice-7"), "0.286")).toMatchObject({ tag: "距离没有开平方合成" });
    expect(evaluate(q("topsis-practice-5"), "0.264")).toMatchObject({ tag: "用了求和归一化" });
    expect(evaluate(q("topsis-practice-5"), "0.578")).toEqual({ status: "correct" });
    expect(evaluate(q("topsis-practice-7"), "0.327")).toEqual({ status: "correct" });
    expect(evaluate(q("topsis-practice-3"), "abc")).toEqual({ status: "invalid" });
    // Partly right multi-select: says how many are missing, not which.
    expect(evaluate(q("topsis-practice-1"), ["price"])).toEqual({ status: "partial", message: "选对了 1 项，还有 1 项没有选上。" });
  });
});
