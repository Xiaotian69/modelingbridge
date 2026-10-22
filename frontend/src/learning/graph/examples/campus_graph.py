"""图论精讲配套程序：招新日的校园地图（最短路 + 最小生成树）。

运行：python campus_graph.py   （需要 Python 3 和 networkx：pip install networkx）
"""
import heapq

import networkx as nx

places = ["宿舍区", "东门", "食堂", "图书馆", "教学楼", "体育馆", "招新广场"]
roads = [  # (地点, 地点, 步行距离/米)
    ("宿舍区", "食堂", 300), ("宿舍区", "东门", 450), ("宿舍区", "体育馆", 850),
    ("食堂", "图书馆", 250), ("食堂", "教学楼", 490), ("东门", "教学楼", 520),
    ("图书馆", "教学楼", 200), ("图书馆", "招新广场", 560), ("教学楼", "招新广场", 330),
    ("体育馆", "招新广场", 280), ("东门", "体育馆", 640), ("教学楼", "体育馆", 400),
]

G = nx.Graph()
G.add_weighted_edges_from(roads)


# ---- 自己写一遍 Dijkstra：每次确定“暂定距离最小”的地点 ----
def dijkstra(graph, source):
    dist = {source: 0}
    prev = {}
    done = set()
    heap = [(0, source)]
    while heap:
        d, u = heapq.heappop(heap)
        if u in done:
            continue
        done.add(u)
        print(f"确定 {u}：{d} 米")
        for v, attr in graph[u].items():
            nd = d + attr["weight"]
            if v not in done and nd < dist.get(v, float("inf")):
                dist[v] = nd
                prev[v] = u
                heapq.heappush(heap, (nd, v))
    return dist, prev


dist, prev = dijkstra(G, "宿舍区")
path = ["招新广场"]
while path[0] != "宿舍区":
    path.insert(0, prev[path[0]])
print("最短路线：", " → ".join(path), f"，共 {dist['招新广场']} 米")

# ---- 用 networkx 核对 ----
print("networkx：", nx.dijkstra_path(G, "宿舍区", "招新广场"), nx.dijkstra_path_length(G, "宿舍区", "招新广场"))

# ---- 最小生成树（Kruskal） ----
T = nx.minimum_spanning_tree(G, algorithm="kruskal")
for u, v, w in sorted(T.edges(data="weight"), key=lambda e: e[2]):
    print(f"  {u} — {v}：{w} 米")
print("最小生成树总长：", int(T.size(weight="weight")), "米")

# ---- 情景：图书馆—教学楼施工，绕行 500 米 ----
G["图书馆"]["教学楼"]["weight"] = 500
print("施工后：", nx.dijkstra_path(G, "宿舍区", "招新广场"), nx.dijkstra_path_length(G, "宿舍区", "招新广场"))
