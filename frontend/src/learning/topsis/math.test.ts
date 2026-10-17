import { describe, expect, it } from "vitest";
import fixture from "./topsis-verified.json";
import { AHP_UPPER, DATA, DIRECTIONS, EXTRA_ROW, HAND_COLUMN } from "./data";
import {
  columnNorms,
  entropyWeights,
  normaliseWeights,
  ranksFromOrder,
  topsis,
  vectorNormalise,
  type Direction,
  type TopsisResult,
} from "./math";
import { analyse, fromUpperTriangle } from "../ahp/math";

type Ref = Pick<TopsisResult, "best" | "worst" | "dPlus" | "dMinus" | "order"> & { closeness: number[] };
const dirs = (benefit: boolean[]): Direction[] => benefit.map((b) => (b ? "benefit" : "cost"));
const close = (a: number[], b: number[], digits = 10) => {
  expect(a).toHaveLength(b.length);
  a.forEach((x, i) => expect(x).toBeCloseTo(b[i], digits));
};
function matches(result: TopsisResult, ref: Ref) {
  close(result.best, ref.best);
  close(result.worst, ref.worst);
  close(result.dPlus, ref.dPlus);
  close(result.dMinus, ref.dMinus);
  close(result.closeness as number[], ref.closeness as number[]);
  expect(result.order).toEqual(ref.order);
}

describe("lesson inputs equal the numpy script's inputs", () => {
  it("data, directions, extra room, AHP judgments and the hand column", () => {
    expect(DATA).toEqual(fixture.inputs.data);
    expect(DIRECTIONS).toEqual(dirs(fixture.inputs.benefit));
    expect(EXTRA_ROW).toEqual(fixture.inputs.extraRow);
    expect(AHP_UPPER).toEqual(fixture.inputs.ahpUpper);
    expect(HAND_COLUMN).toEqual(fixture.inputs.handColumn);
  });
});

describe("TOPSIS on the lesson data matches numpy / scipy", () => {
  const ahpWeights = analyse(fromUpperTriangle(4, AHP_UPPER)).weights;

  it("AHP weights from the shared AHP code equal numpy.linalg.eig", () => {
    close(ahpWeights, fixture.ahp.weights);
    expect(analyse(fromUpperTriangle(4, AHP_UPPER)).cr!).toBeCloseTo(fixture.ahp.cr, 10);
  });

  it("vector normalisation and the weighted matrix", () => {
    close(columnNorms(DATA), fixture.columnNorms);
    const r = topsis(DATA, ahpWeights, DIRECTIONS);
    r.normalised.forEach((row, i) => close(row, fixture.lesson.ahp.normalised[i]));
    r.weighted.forEach((row, i) => close(row, fixture.lesson.ahp.weighted[i]));
  });

  it.each([
    ["ahp", () => topsis(DATA, ahpWeights, DIRECTIONS)],
    ["equal", () => topsis(DATA, [1, 1, 1, 1], DIRECTIONS)],
    ["entropy", () => topsis(DATA, entropyWeights(DATA, DIRECTIONS).weights, DIRECTIONS)],
    ["sixRooms", () => topsis([...DATA, EXTRA_ROW], ahpWeights, DIRECTIONS)],
    ["rentAsBenefit", () => topsis(DATA, ahpWeights, ["benefit", "cost", "benefit", "benefit"])],
  ] as const)("%s", (name, run) => matches(run(), fixture.lesson[name]));

  it("entropy weights", () => {
    const e = entropyWeights(DATA, DIRECTIONS);
    close(e.entropy, fixture.entropy.entropy);
    close(e.weights, fixture.entropy.weights);
    e.scaled.forEach((row, i) => close(row, fixture.entropy.scaled[i]));
    e.proportions[0].forEach((_, j) => expect(e.proportions.reduce((s, row) => s + row[j], 0)).toBeCloseTo(1, 12));
  });
});

describe("200 random problems match the independent implementation", () => {
  it.each(fixture.random.map((s, k) => [k, s] as const))("problem %i", (_, s) => {
    const d = dirs(s.benefit);
    matches(topsis(s.data, s.weights, d), s.topsis);
    const e = entropyWeights(s.data, d);
    close(e.entropy, s.entropy.entropy);
    close(e.weights, s.entropy.weights);
  });
});

describe("properties the lesson states", () => {
  const w = [0.4, 0.3, 0.2, 0.1];
  it("closeness lies in [0, 1] and the best room on every criterion would score 1", () => {
    const r = topsis(DATA, w, DIRECTIONS);
    for (const c of r.closeness) expect(c! >= 0 && c! <= 1).toBe(true);
    const dream = [1500, 15, 35, 10];
    const withDream = topsis([...DATA, dream], w, DIRECTIONS);
    expect(withDream.closeness[5]).toBeCloseTo(1, 12);
    expect(withDream.order[0]).toBe(5);
  });

  it("changing units (元 → 千元) changes nothing after vector normalisation", () => {
    const thousands = DATA.map(([rent, ...rest]) => [rent / 1000, ...rest]);
    const a = topsis(DATA, w, DIRECTIONS);
    const b = topsis(thousands, w, DIRECTIONS);
    close(b.closeness as number[], a.closeness as number[], 12);
    vectorNormalise(thousands).forEach((row, i) => close(row, vectorNormalise(DATA)[i], 12));
  });

  it("weights are rescaled to sum 1, so 2:1:1:0 equals 0.5:0.25:0.25:0", () => {
    close(topsis(DATA, [2, 1, 1, 0], DIRECTIONS).closeness as number[], topsis(DATA, [0.5, 0.25, 0.25, 0], DIRECTIONS).closeness as number[], 12);
    close(normaliseWeights([2, 1, 1, 0]), [0.5, 0.25, 0.25, 0], 12);
  });

  it("a constant criterion gets entropy 1 and weight 0", () => {
    const x = [
      [1, 5],
      [2, 5],
      [4, 5],
    ];
    const e = entropyWeights(x, ["benefit", "benefit"]);
    expect(e.entropy[1]).toBe(1);
    expect(e.weights).toEqual([1, 0]);
  });

  it("identical alternatives have no closeness instead of a division by zero", () => {
    const r = topsis(
      [
        [3, 4],
        [3, 4],
      ],
      [1, 1],
      ["benefit", "cost"],
    );
    expect(r.closeness).toEqual([null, null]);
  });

  it("rejects input the method is not defined for", () => {
    expect(() => vectorNormalise([[0, 1], [0, 2]])).toThrow(RangeError);
    expect(() => topsis(DATA, [0, 0, 0, 0], DIRECTIONS)).toThrow(RangeError);
    expect(() => topsis(DATA, [1, 1, 1], DIRECTIONS)).toThrow(RangeError);
    expect(() => topsis([[1, -2], [3, 4]], [1, 1], ["benefit", "benefit"])).toThrow(RangeError);
    expect(() => entropyWeights([[1, 1], [1, 1]], ["benefit", "cost"])).toThrow(RangeError);
  });

  it("ranks follow the order", () => {
    expect(ranksFromOrder([3, 1, 4, 0, 2])).toEqual([4, 2, 5, 1, 3]);
  });
});
