import { describe, expect, it } from "vitest";
import fixture from "./graph-verified.json";
import { CAMPUS, CONSTRUCTION, PLAZA, PLACES, ROADS } from "./data";
import { adjacencyMatrix, degrees, dijkstra, kruskal, pathTo, prim, withWeight, type Edge, type Graph } from "./math";

const norm = (edges: Edge[]) => edges.map(([u, v, w]) => [Math.min(u, v), Math.max(u, v), w]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);

describe("lesson inputs equal the Python script's inputs", () => {
  it("roads and the construction scenario", () => {
    expect(CAMPUS.n).toBe(fixture.inputs.n);
    expect(PLACES).toHaveLength(fixture.inputs.n);
    expect(ROADS).toEqual(fixture.inputs.roads);
    expect([CONSTRUCTION.u, CONSTRUCTION.v, CONSTRUCTION.weight]).toEqual(fixture.inputs.construction);
  });
});

describe("campus map matches networkx", () => {
  const d = dijkstra(CAMPUS, 0);
  it("distances, settle order and the shortest path from 宿舍区", () => {
    expect(d.dist).toEqual(fixture.campus.dist);
    expect(d.order).toEqual(fixture.campus.order);
    for (let v = 0; v < CAMPUS.n; v++) expect(pathTo(d.prev, d.dist, v)).toEqual(fixture.campus.paths[v]);
  });

  it("all-pairs distances", () => {
    for (let s = 0; s < CAMPUS.n; s++) expect(dijkstra(CAMPUS, s).dist).toEqual(fixture.allPairs[s]);
  });

  it("minimum spanning tree by Kruskal and by Prim", () => {
    const k = kruskal(CAMPUS);
    expect(k.total).toBe(fixture.campus.kruskal!.total);
    expect(norm(k.edges)).toEqual(fixture.campus.kruskal!.edges);
    const p = prim(CAMPUS, 3);
    expect(p.total).toBe(fixture.campus.prim!.total);
    expect(norm(p.edges)).toEqual(fixture.campus.prim!.edges);
  });

  it("the construction scenario", () => {
    const g = withWeight(CAMPUS, CONSTRUCTION.u, CONSTRUCTION.v, CONSTRUCTION.weight);
    const c = dijkstra(g, 0);
    expect(c.dist).toEqual(fixture.construction.dist);
    expect(pathTo(c.prev, c.dist, PLAZA)).toEqual(fixture.construction.paths[PLAZA]);
  });

  it("degrees and the weight matrix", () => {
    expect(degrees(CAMPUS)).toEqual(fixture.campus.degrees);
    const a = adjacencyMatrix(CAMPUS);
    a.forEach((row, i) => row.forEach((x, j) => expect(x).toBe(a[j][i])));
    expect(a.flat().filter((x) => x !== null && x > 0)).toHaveLength(2 * ROADS.length);
  });
});

describe("small exercise graphs match networkx", () => {
  const g = (edges: number[][]): Graph => ({ n: 4, edges: edges as Edge[] });
  it("shortest paths and the tree", () => {
    const path = fixture.small.path;
    expect(dijkstra(g([[0, 1, 4], [0, 2, 2], [2, 1, 1], [1, 3, 5], [2, 3, 8]]), 0).dist).toEqual(path.dist);
    const t = kruskal(g([[0, 1, 1], [1, 2, 2], [0, 2, 3], [2, 3, 4], [1, 3, 5]]));
    expect(t.total).toBe(fixture.small.tree.kruskal!.total);
    expect(t.steps.find((s) => !s.accepted)!.edge).toEqual([0, 2, 3]);
  });
});

describe("150 random connected graphs match networkx", () => {
  it.each(fixture.random.map((s, k) => [k, s] as const))("graph %i", (_, s) => {
    const graph: Graph = { n: s.n, edges: s.edges as Edge[] };
    const d = dijkstra(graph, s.source);
    expect(d.dist).toEqual(s.dist);
    expect(d.order).toEqual(s.order);
    const k = kruskal(graph);
    expect(k.connected).toBe(true);
    expect(k.total).toBe(s.kruskal!.total);
    expect(norm(k.edges)).toEqual(s.kruskal!.edges);
    expect(prim(graph, s.source).total).toBe(s.prim!.total);
  });
});

describe("properties the lesson states", () => {
  it("handshake: the degree sum is twice the number of edges", () => {
    expect(degrees(CAMPUS).reduce((a, b) => a + b, 0)).toBe(2 * ROADS.length);
  });

  it("each step settles the smallest tentative distance, and settled distances never change", () => {
    const { steps } = dijkstra(CAMPUS, 0);
    steps.forEach((step, k) => {
      const before = k === 0 ? [0, ...Array(CAMPUS.n - 1).fill(Infinity)] : steps[k - 1].dist;
      const open = before.map((d, v) => (steps[k - 1]?.done.includes(v) ? Infinity : d));
      expect(before[step.settled]).toBe(Math.min(...open));
      for (const v of step.done) expect(step.dist[v]).toBe(steps.at(-1)!.dist[v]);
    });
  });

  it("Kruskal stops at n − 1 edges and rejects only edges that would close a cycle", () => {
    const k = kruskal(CAMPUS);
    expect(k.edges).toHaveLength(CAMPUS.n - 1);
    expect(k.steps.filter((s) => !s.accepted).map((s) => s.edge)).toEqual([[4, 5, 400]]);
  });

  it("refuses negative weights, bad edges and unknown edges", () => {
    expect(() => dijkstra({ n: 2, edges: [[0, 1, -1]] }, 0)).toThrow(RangeError);
    expect(() => dijkstra({ n: 2, edges: [[0, 2, 1]] }, 0)).toThrow(RangeError);
    expect(() => withWeight(CAMPUS, 0, 6, 1)).toThrow(RangeError);
  });

  it("an unreachable vertex has no path and a disconnected graph no spanning tree", () => {
    const g: Graph = { n: 3, edges: [[0, 1, 5]] };
    const d = dijkstra(g, 0);
    expect(d.dist[2]).toBe(Infinity);
    expect(pathTo(d.prev, d.dist, 2)).toEqual([]);
    expect(kruskal(g).connected).toBe(false);
  });
});
