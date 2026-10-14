/**
 * Graph algorithms taught in the lesson, on small undirected weighted graphs.
 *
 * - Dijkstra (§4–§5): repeatedly settle the unsettled vertex with the smallest tentative distance
 *   (ties: smaller index), then relax its edges. Requires non-negative weights.
 * - Kruskal (§6): take edges from light to heavy (ties: by (u, v)); keep an edge unless its ends are
 *   already connected (it would close a cycle); stop after n − 1 edges. Union–find with path compression.
 * - Prim (§7): grow one tree from a start vertex by its lightest outgoing edge (used to show both
 *   greedy methods agree).
 * Every result is checked against networkx in graph-verified.json (verify_graph.py).
 */

export type Edge = [number, number, number];
export type Graph = { n: number; edges: Edge[] };

function check(g: Graph) {
  if (!Number.isInteger(g.n) || g.n < 1) throw new RangeError("a graph needs at least one vertex");
  for (const [u, v, w] of g.edges) {
    if (![u, v].every((x) => Number.isInteger(x) && x >= 0 && x < g.n)) throw new RangeError("edge end out of range");
    if (u === v) throw new RangeError("self loops are not used here");
    if (!Number.isFinite(w)) throw new RangeError("edge weights must be finite");
  }
}

/** Neighbours with weights; parallel edges keep the lightest. */
export function adjacency(g: Graph): Map<number, number>[] {
  check(g);
  const adj = Array.from({ length: g.n }, () => new Map<number, number>());
  for (const [u, v, w] of g.edges) {
    adj[u].set(v, Math.min(w, adj[u].get(v) ?? Infinity));
    adj[v].set(u, Math.min(w, adj[v].get(u) ?? Infinity));
  }
  return adj;
}

/** Weight matrix: a[i][j] = edge weight, 0 on the diagonal, null where there is no edge. */
export function adjacencyMatrix(g: Graph): (number | null)[][] {
  const adj = adjacency(g);
  return adj.map((row, i) => Array.from({ length: g.n }, (_, j) => (i === j ? 0 : (row.get(j) ?? null))));
}

export const degrees = (g: Graph) => adjacency(g).map((row) => row.size);

export type DijkstraStep = {
  /** Vertex settled in this step. */
  settled: number;
  /** Edges (settled, v) that lowered v's tentative distance: [v, old, new]. */
  relaxed: [number, number, number][];
  /** Tentative distances after the step (Infinity = not reached yet). */
  dist: number[];
  /** Vertices settled so far, in order. */
  done: number[];
};
export type DijkstraResult = { dist: number[]; prev: (number | null)[]; order: number[]; steps: DijkstraStep[] };

export function dijkstra(g: Graph, source: number): DijkstraResult {
  if (g.edges.some(([, , w]) => w < 0)) throw new RangeError("Dijkstra needs non-negative weights");
  const adj = adjacency(g);
  if (!(source >= 0 && source < g.n)) throw new RangeError("source out of range");
  const dist = Array(g.n).fill(Infinity);
  const prev: (number | null)[] = Array(g.n).fill(null);
  const settled = Array(g.n).fill(false);
  dist[source] = 0;
  const order: number[] = [];
  const steps: DijkstraStep[] = [];
  for (;;) {
    let u = -1;
    for (let v = 0; v < g.n; v++) if (!settled[v] && dist[v] < Infinity && (u < 0 || dist[v] < dist[u])) u = v;
    if (u < 0) break;
    settled[u] = true;
    order.push(u);
    const relaxed: [number, number, number][] = [];
    for (const [v, w] of [...adj[u]].sort((a, b) => a[0] - b[0])) {
      if (settled[v] || dist[u] + w >= dist[v]) continue;
      relaxed.push([v, dist[v], dist[u] + w]);
      dist[v] = dist[u] + w;
      prev[v] = u;
    }
    steps.push({ settled: u, relaxed, dist: [...dist], done: [...order] });
  }
  return { dist, prev, order, steps };
}

/** Vertices from the source to `target` following `prev`; empty when unreachable. */
export function pathTo(prev: (number | null)[], dist: number[], target: number): number[] {
  if (dist[target] === Infinity) return [];
  const path = [target];
  while (prev[path[0]] !== null) path.unshift(prev[path[0]]!);
  return path;
}

export type KruskalStep = { edge: Edge; accepted: boolean; total: number; count: number };
export type TreeResult = { edges: Edge[]; total: number; steps: KruskalStep[]; connected: boolean };

/** Edges sorted the way Kruskal looks at them. */
export const sortedEdges = (g: Graph) =>
  [...g.edges].sort((a, b) => a[2] - b[2] || Math.min(a[0], a[1]) - Math.min(b[0], b[1]) || Math.max(a[0], a[1]) - Math.max(b[0], b[1]));

export function kruskal(g: Graph): TreeResult {
  check(g);
  const parent = Array.from({ length: g.n }, (_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const edges: Edge[] = [];
  const steps: KruskalStep[] = [];
  let total = 0;
  for (const e of sortedEdges(g)) {
    if (edges.length === g.n - 1) break;
    const [ru, rv] = [find(e[0]), find(e[1])];
    const accepted = ru !== rv;
    if (accepted) {
      parent[ru] = rv;
      edges.push(e);
      total += e[2];
    }
    steps.push({ edge: e, accepted, total, count: edges.length });
  }
  return { edges, total, steps, connected: edges.length === g.n - 1 };
}

export function prim(g: Graph, start = 0): TreeResult {
  const adj = adjacency(g);
  const inTree = Array(g.n).fill(false);
  inTree[start] = true;
  const edges: Edge[] = [];
  let total = 0;
  while (edges.length < g.n - 1) {
    let best: Edge | null = null;
    for (let u = 0; u < g.n; u++)
      if (inTree[u])
        for (const [v, w] of adj[u]) if (!inTree[v] && (!best || w < best[2] || (w === best[2] && v < best[1]))) best = [u, v, w];
    if (!best) break;
    inTree[best[1]] = true;
    edges.push(best);
    total += best[2];
  }
  return { edges, total, steps: [], connected: edges.length === g.n - 1 };
}

/** Same graph with one edge's weight replaced (the lab's construction scenario). */
export function withWeight(g: Graph, u: number, v: number, w: number): Graph {
  let found = false;
  const edges = g.edges.map((e): Edge => {
    if ((e[0] === u && e[1] === v) || (e[0] === v && e[1] === u)) {
      found = true;
      return [e[0], e[1], w];
    }
    return e;
  });
  if (!found) throw new RangeError("no such edge");
  return { n: g.n, edges };
}
