"""Independent graph reference values (networkx, not the TypeScript code).

Regenerate with:  python verify_graph.py   (Python 3 + networkx)
The TypeScript tests read graph-verified.json; they never compute their own expected answers.
Inputs below must equal frontend/src/learning/graph/data.ts (a test checks this).
Shortest paths: networkx single_source_dijkstra and bellman_ford; trees: networkx
minimum_spanning_tree with algorithm="kruskal" and "prim". The settle order of Dijkstra is recorded
with a heap (heapq), a different procedure from the TypeScript linear scan.
"""
import heapq
import json
import random
from pathlib import Path

import networkx as nx

N = 7
ROADS = [
    (0, 2, 300), (0, 1, 450), (0, 5, 850), (2, 3, 250), (2, 4, 490), (1, 4, 520),
    (3, 4, 200), (3, 6, 560), (4, 6, 330), (5, 6, 280), (1, 5, 640), (4, 5, 400),
]
CONSTRUCTION = (3, 4, 500)


def build(n, edges):
    g = nx.Graph()
    g.add_nodes_from(range(n))
    g.add_weighted_edges_from(edges)
    return g


def settle_order(g, source):
    """Order in which Dijkstra settles vertices (heap; ties by vertex index) and their distances."""
    dist = {source: 0}
    heap = [(0, source)]
    done, order = set(), []
    while heap:
        d, u = heapq.heappop(heap)
        if u in done:
            continue
        done.add(u)
        order.append(u)
        for v in sorted(g[u]):
            nd = d + g[u][v]["weight"]
            if v not in done and nd < dist.get(v, float("inf")):
                dist[v] = nd
                heapq.heappush(heap, (nd, v))
    return order


def tree(g, algorithm):
    t = nx.minimum_spanning_tree(g, algorithm=algorithm)
    return {"total": t.size(weight="weight"), "edges": sorted([sorted([u, v]) + [d["weight"]] for u, v, d in t.edges(data=True)])}


def summary(n, edges, source=0):
    g = build(n, edges)
    dist, paths = nx.single_source_dijkstra(g, source)
    bf = nx.single_source_bellman_ford_path_length(g, source)
    assert all(abs(dist[v] - bf[v]) < 1e-9 for v in dist), "dijkstra and bellman-ford disagree"
    return {
        "dist": [dist.get(v) for v in range(n)],
        "paths": [paths.get(v) for v in range(n)],
        "order": settle_order(g, source),
        "kruskal": tree(g, "kruskal") if nx.is_connected(g) else None,
        "prim": tree(g, "prim") if nx.is_connected(g) else None,
        "degrees": [g.degree(v) for v in range(n)],
    }


campus = summary(N, ROADS)
roads_construction = [(u, v, CONSTRUCTION[2]) if {u, v} == {CONSTRUCTION[0], CONSTRUCTION[1]} else (u, v, w) for u, v, w in ROADS]
g = build(N, ROADS)
out = {
    "inputs": {"n": N, "roads": [list(e) for e in ROADS], "construction": list(CONSTRUCTION)},
    "campus": campus,
    "construction": summary(N, roads_construction),
    "allPairs": [[nx.dijkstra_path_length(g, s, t) for t in range(N)] for s in range(N)],
    "simplePaths": [{"path": p, "length": nx.path_weight(g, p, "weight")} for p in list(nx.shortest_simple_paths(g, 0, 6, weight="weight"))[:5]],
}

# Small graphs used by the exercises (A, B, C, D = 0, 1, 2, 3).
small_path = [(0, 1, 4), (0, 2, 2), (2, 1, 1), (1, 3, 5), (2, 3, 8)]
small_tree = [(0, 1, 1), (1, 2, 2), (0, 2, 3), (2, 3, 4), (1, 3, 5)]
neg = nx.DiGraph()
neg.add_weighted_edges_from([(0, 1, 2), (0, 2, 3), (2, 1, -2)])
out["small"] = {
    "path": summary(4, small_path),
    "tree": summary(4, small_tree),
    "negativeTrueDistB": nx.single_source_bellman_ford_path_length(neg, 0)[1],
}
out["exercises"] = {
    "graph-practice-1": 2 * 9,                                  # handshake lemma: 9 edges
    "graph-practice-2": N - 1,                                  # spanning tree of 7 vertices
    "graph-practice-4": out["small"]["path"]["dist"][3],        # A → D
    "graph-practice-6": out["small"]["tree"]["kruskal"]["total"],
    "graph-practice-10": out["construction"]["dist"][6],        # dorm → plaza with construction
    "graph-practice-12": 300 + 490,                             # 教学楼 after settling 食堂
}

rng = random.Random(20261016)
samples = []
for _ in range(150):
    n = rng.randint(3, 12)
    weights = rng.sample(range(1, 1000), n * (n - 1) // 2)
    pairs = [(u, v) for u in range(n) for v in range(u + 1, n)]
    rng.shuffle(pairs)
    # A random spanning tree first (connected), then extra random edges.
    order = list(range(n))
    rng.shuffle(order)
    edges = {tuple(sorted((order[i], order[rng.randrange(i)]))) for i in range(1, n)}
    for u, v in pairs:
        if rng.random() < 0.3:
            edges.add((u, v))
    weighted = [(u, v, weights[k]) for k, (u, v) in enumerate(sorted(edges))]
    s = summary(n, weighted, source=rng.randrange(n))
    samples.append({"n": n, "edges": [list(e) for e in weighted], "source": s["order"][0],
                    "dist": s["dist"], "order": s["order"], "kruskal": s["kruskal"], "prim": s["prim"]})
out["random"] = samples

Path(__file__).with_name("graph-verified.json").write_text(
    json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8", newline="\n")
print("campus dist", campus["dist"], "path to plaza", campus["paths"][6], "order", campus["order"])
print("campus MST", campus["kruskal"], "prim total", campus["prim"]["total"])
print("construction", out["construction"]["dist"][6], out["construction"]["paths"][6])
print("degrees", campus["degrees"], "simple paths", out["simplePaths"])
print("small", out["small"]["path"]["dist"], out["small"]["tree"]["kruskal"], "neg B", out["small"]["negativeTrueDistB"])
print("exercises", out["exercises"])
print(f"wrote {len(samples)} random graphs")
