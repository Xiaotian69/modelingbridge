import katex from "katex";
import { describe, expect, it } from "vitest";
import fixture from "./graph-verified.json";
import python from "./examples/campus_graph.py?raw";
import { detour, detourRoute, graphSections, primTree, route, shortest, tree, treeDistance, treePath } from "./content";
import { CAMPUS, CANTEEN, CONSTRUCTION, DORM, GYM, LIBRARY, PLACES, PLAZA, ROADS, TEACHING } from "./data";
import { graphExerciseMeta } from "./exerciseMeta";
import { adjacencyMatrix, degrees, dijkstra, withWeight } from "./math";
import { graphQuestions } from "./questions";
import { GRAPH_CHECKPOINT_IDS, GRAPH_SECTIONS, GRAPH_SECTION_IDS } from "./sectionIds";
import { practiceBankOf } from "../courseBanks";
import { asGradable } from "../courseQuestion";
import { evaluate } from "../evaluate";
import { grade } from "../grading";
import { ahpQuestions } from "../ahp/questions";
import { publishedQuestions } from "../questions";
import { regressionQuestions } from "../regression/questions";
import { topsisQuestions } from "../topsis/questions";

type AnyBlock = (typeof graphSections)[number]["blocks"][number];
const text = (blocks: AnyBlock[]) =>
  blocks
    .map((b) =>
      b.type === "p" || b.type === "note" ? b.text : b.type === "table" ? [b.caption, ...b.rows.flat()].join(" ") : "",
    )
    .join(" ");
const section = (id: string) => text(graphSections.find((s) => s.id === id)!.blocks);
const all = graphSections.map((s) => text(s.blocks)).join(" ");
const q = (id: string) => graphQuestions.find((x) => x.id === id)!;
const w = adjacencyMatrix(CAMPUS);
const length = (path: number[]) => path.slice(1).reduce((s, v, i) => s + w[path[i]][v]!, 0);
const name = (v: number) => PLACES[v].name;

describe("graph lesson structure", () => {
  it("matches the light section list and has unique ids", () => {
    expect(graphSections.map((s) => [s.id, s.title])).toEqual(GRAPH_SECTIONS.map((s) => [s.id, s.title]));
    expect(new Set(GRAPH_SECTION_IDS).size).toBe(GRAPH_SECTION_IDS.length);
  });

  it("parses every formula with KaTeX (throwOnError)", () => {
    for (const s of graphSections)
      for (const b of s.blocks)
        if (b.type === "formula") expect(() => katex.renderToString(b.text, { throwOnError: true })).not.toThrow();
  });

  it("embeds every checkpoint once, in order, plus two maps, two labs and the bridge to LP", () => {
    const blocks = graphSections.flatMap((s) => s.blocks);
    expect(blocks.filter((b) => b.type === "question").map((b) => (b as { id: string }).id)).toEqual(GRAPH_CHECKPOINT_IDS);
    expect(blocks.filter((b) => b.type === "graph-map").map((b) => (b as { highlight: string }).highlight)).toEqual(["none", "tree"]);
    expect(blocks.filter((b) => b.type === "graph-lab").map((b) => (b as { mode: string }).mode)).toEqual(["path", "tree"]);
    expect(blocks.filter((b) => b.type === "course-bridge").map((b) => (b as { to: string }).to)).toEqual(["/learn/linear-programming"]);
  });

  it("every table row has as many cells as the header; no placeholders", () => {
    for (const b of graphSections.flatMap((s) => s.blocks))
      if (b.type === "table") for (const row of b.rows) expect(row).toHaveLength(b.headers.length);
    expect(all).not.toMatch(/undefined|NaN|\$\{/);
  });

  it("the Python example uses the lesson's roads", () => {
    for (const [u, v, d] of ROADS) expect(python).toContain(`("${name(u)}", "${name(v)}", ${d})`);
    expect(python).toContain(`G["图书馆"]["教学楼"]["weight"] = ${CONSTRUCTION.weight}`);
  });
});

describe("numbers in the text are the verified ones", () => {
  it("equal networkx", () => {
    expect(shortest.dist).toEqual(fixture.campus.dist);
    expect(route).toEqual(fixture.campus.paths[PLAZA]);
    expect(tree.total).toBe(fixture.campus.kruskal!.total);
    expect(primTree.total).toBe(fixture.campus.prim!.total);
    expect(detour.dist[PLAZA]).toBe(fixture.construction.dist[PLAZA]);
    expect(detourRoute).toEqual(fixture.construction.paths[PLAZA]);
  });

  it("states them", () => {
    expect(section("campus")).toContain("300 + 250 + 200 + 330 = 1080 米");
    expect(section("campus")).toContain("宿舍区 → 体育馆 → 招新广场，只走两段路，共 1130 米");
    expect(section("dijkstra")).toContain("宿舍区 → 食堂 → 图书馆 → 教学楼 → 招新广场，共 1080 米");
    expect(section("dijkstra")).toContain("新的最短路是 宿舍区 → 食堂 → 图书馆 → 招新广场，共 1110 米");
    expect(section("mst")).toContain("最小生成树总长 1810 米");
    expect(section("compare")).toContain("共 1360 米");
  });
});

/** Sentences that describe the map in words: each claim is re-checked against the numbers. */
describe("claims in the text hold for the map", () => {
  it("§1: the 4-leg route beats the 2-leg route via 体育馆", () => {
    expect(route).toHaveLength(5);
    expect(length([DORM, GYM, PLAZA])).toBe(fixture.simplePaths[3].length);
    expect(length([DORM, GYM, PLAZA])).toBeGreaterThan(shortest.dist[PLAZA]);
  });

  it("§2: 教学楼 has the largest degree; the degree sum is 2|E|", () => {
    const deg = degrees(CAMPUS);
    expect(deg[TEACHING]).toBe(Math.max(...deg));
    expect(deg.filter((d) => d === Math.max(...deg))).toHaveLength(1);
    expect(deg.reduce((a, b) => a + b, 0)).toBe(2 * ROADS.length);
    expect(q("graph-think-2").explanation).toContain(`${deg.join(" + ")} = ${2 * ROADS.length}`);
  });

  it("§5: 教学楼 is 790 after two steps and lowered to 750; 招新广场 goes 1110 → 1080", () => {
    const steps = shortest.steps;
    expect(steps[1].settled).toBe(CANTEEN);
    expect(steps[1].dist[TEACHING]).toBe(790);
    const libraryStep = steps.find((s) => s.settled === LIBRARY)!;
    expect(libraryStep.relaxed).toContainEqual([TEACHING, 790, 750]);
    expect(libraryStep.relaxed).toContainEqual([PLAZA, Infinity, 1110]);
    expect(steps.find((s) => s.settled === TEACHING)!.relaxed).toContainEqual([PLAZA, 1110, 1080]);
    expect(section("dijkstra")).toContain("招新广场 ← 教学楼 ← 图书馆 ← 食堂 ← 宿舍区");
  });

  it("§6: the only skipped edge is 教学楼—体育馆, already joined through 招新广场", () => {
    const k = tree.steps.findIndex((s) => !s.accepted);
    expect(tree.steps.filter((s) => !s.accepted)).toHaveLength(1);
    expect(tree.steps[k].edge).toEqual([TEACHING, GYM, 400]);
    const before = tree.steps.slice(0, k).filter((s) => s.accepted).map((s) => s.edge);
    expect(before).toContainEqual([TEACHING, PLAZA, 330]);
    expect(before).toContainEqual([GYM, PLAZA, 280]);
  });

  it("§7: the MST route to 体育馆 (1360) is longer than the direct road (850), which the tree drops", () => {
    expect(shortest.dist[GYM]).toBe(w[DORM][GYM]);
    expect(treeDistance(DORM, GYM)).toBe(1360);
    expect(treePath(DORM, GYM)).toEqual([DORM, CANTEEN, LIBRARY, TEACHING, PLAZA, GYM]);
    expect(tree.edges.some(([u, v]) => (u === DORM && v === GYM) || (u === GYM && v === DORM))).toBe(false);
    // The MST route from 宿舍区 to 招新广场 happens to equal the shortest path: the text does not claim otherwise.
    expect(treeDistance(DORM, PLAZA)).toBe(shortest.dist[PLAZA]);
  });

  it("questions: a direct road longer than a detour, and the construction candidates", () => {
    expect(w[CANTEEN][TEACHING]).toBe(490);
    expect(w[CANTEEN][LIBRARY]! + w[LIBRARY][TEACHING]!).toBe(450);
    const g = withWeight(CAMPUS, CONSTRUCTION.u, CONSTRUCTION.v, CONSTRUCTION.weight);
    const wc = adjacencyMatrix(g);
    const len = (path: number[]) => path.slice(1).reduce((s, v, i) => s + wc[path[i]][v]!, 0);
    expect(len([DORM, CANTEEN, LIBRARY, TEACHING, PLAZA])).toBe(1380);
    expect(len([DORM, CANTEEN, LIBRARY, PLAZA])).toBe(1110);
    expect(len([DORM, CANTEEN, TEACHING, PLAZA])).toBe(1120);
    expect(len([DORM, GYM, PLAZA])).toBe(1130);
    expect(dijkstra(g, DORM).dist[PLAZA]).toBe(1110);
    expect(fixture.small.negativeTrueDistB).toBe(1);
  });
});

describe("graph questions", () => {
  it("have unique prefixed ids that never collide with other banks", () => {
    const ids = graphQuestions.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id.startsWith("graph-")).toBe(true));
    const others = [...publishedQuestions, ...ahpQuestions, ...topsisQuestions, ...regressionQuestions].map((x) => x.id);
    ids.forEach((id) => expect(others).not.toContain(id));
  });

  it("the practice bank (15 questions, as the 精讲目录 says) excludes inline checkpoints", () => {
    expect(practiceBankOf("graph")).toHaveLength(15);
  });

  it("numeric answers equal the networkx reference values", () => {
    const ex = fixture.exercises as Record<string, number>;
    for (const id of Object.keys(ex)) expect((q(id) as { answer: number }).answer).toBe(ex[id]);
  });

  it.each(graphQuestions.map((x) => [x.id, x] as const))("%s: reference answer grades as correct; metadata is complete", (id, x) => {
    expect(grade(asGradable(x), x.type === "numeric" ? String(x.answer) : x.answer)).toBe("correct");
    const meta = graphExerciseMeta[id];
    expect(meta).toBeDefined();
    expect(GRAPH_SECTION_IDS).toContain(meta.sectionId);
    expect(x.hints.length).toBeGreaterThan(0);
    if (x.type !== "numeric") {
      const wrong = x.options.map((o) => o.id).filter((o) => !(Array.isArray(x.answer) ? x.answer : [x.answer]).includes(o));
      expect(meta.errors.map((e) => ("option" in e ? e.option : "")).sort()).toEqual(wrong.sort());
    }
    for (const e of meta.errors) {
      if ("option" in e) expect(evaluate(x, x.type === "multiple" ? [e.option] : e.option)).toMatchObject({ status: "incorrect", tag: e.tag });
      else expect(evaluate(x, String(e.value))).toMatchObject({ status: "incorrect", tag: e.tag });
    }
  });

  it("diagnoses typed mistakes and accepts the reference answers", () => {
    expect(evaluate(q("graph-practice-1"), "9")).toMatchObject({ tag: "每条边只数了一次" });
    expect(evaluate(q("graph-practice-4"), "9")).toMatchObject({ tag: "没有发现更短的中转" });
    expect(evaluate(q("graph-practice-6"), "10")).toMatchObject({ tag: "把成环的边也选了" });
    expect(evaluate(q("graph-practice-10"), "1080")).toMatchObject({ tag: "参数没有更新" });
    expect(evaluate(q("graph-practice-12"), "750")).toMatchObject({ tag: "跳到了最终结果" });
    expect(evaluate(q("graph-practice-10"), "1110")).toEqual({ status: "correct" });
    expect(evaluate(q("graph-practice-11"), ["courier"])).toEqual({ status: "partial", message: "选对了 1 项，还有 1 项没有选上。" });
  });
});
