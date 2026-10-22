/**
 * Graph theory lesson sections (= DOM anchors at /learn/graph#id). Kept apart from content.ts so the
 * home page, records page and search can use them without loading the lesson text.
 * content.test.ts checks this list against content.ts.
 */
export const GRAPH_SECTIONS = [
  { id: "campus", title: "招新日：怎么走最近？" },
  { id: "graph", title: "把地图变成图：顶点、边和权" },
  { id: "matrix", title: "让计算机读懂图：邻接矩阵" },
  { id: "dijkstra-idea", title: "最短路的思路：由近及远" },
  { id: "dijkstra", title: "Dijkstra 算法：一步一步算" },
  { id: "mst", title: "用最少的线连通所有地点：最小生成树" },
  { id: "compare", title: "最短路与最小生成树：别混淆" },
  { id: "python", title: "用 Python 复现全部计算" },
  { id: "limits", title: "边界与拓展：负权、有向图与更多网络问题" },
  { id: "graph-self-test", title: "合上课本，检查自己" },
  { id: "graph-transfer", title: "把图论带进竞赛题" },
] as const;
export const GRAPH_SECTION_IDS: string[] = GRAPH_SECTIONS.map((s) => s.id);
/** Checkpoints inside the lesson (not graded, shown as “尝试过 x/6”). */
export const GRAPH_CHECKPOINT_IDS = [
  "graph-think-1",
  "graph-think-2",
  "graph-think-3",
  "graph-self-1",
  "graph-self-2",
  "graph-self-3",
];
