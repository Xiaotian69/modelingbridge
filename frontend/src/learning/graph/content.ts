/**
 * 图论与网络优化精讲。Original teaching text; every number shown is computed here from data.ts with
 * math.ts (itself verified against networkx), never typed in by hand.
 */
import python from "./examples/campus_graph.py?raw";
import type { Block } from "../content";
import type { BridgeBlock } from "../CourseBridge";
import { CAMPUS, CANTEEN, CONSTRUCTION, DORM, GYM, PLACES, PLAZA, ROADS, TEACHING } from "./data";
import { adjacencyMatrix, degrees, dijkstra, kruskal, pathTo, prim, withWeight } from "./math";
import { GRAPH_SECTIONS } from "./sectionIds";

export type GraphLabMode = "path" | "tree";
export type GraphBlock =
  | Block
  | BridgeBlock
  | { type: "graph-map"; highlight: "none" | "path" | "tree" }
  | { type: "graph-lab"; mode: GraphLabMode };
export type GraphSection = { id: string; title: string; lead: string; blocks: GraphBlock[] };

const p = (text: string): GraphBlock => ({ type: "p", text });
const note = (text: string): GraphBlock => ({ type: "note", text });
const formula = (text: string): GraphBlock => ({ type: "formula", text });

// ---- Computed results used in the text ----
const name = (v: number) => PLACES[v].name;
export const shortest = dijkstra(CAMPUS, DORM);
export const route = pathTo(shortest.prev, shortest.dist, PLAZA);
export const tree = kruskal(CAMPUS);
export const primTree = prim(CAMPUS, DORM);
const constructionGraph = withWeight(CAMPUS, CONSTRUCTION.u, CONSTRUCTION.v, CONSTRUCTION.weight);
export const detour = dijkstra(constructionGraph, DORM);
export const detourRoute = pathTo(detour.prev, detour.dist, PLAZA);
const deg = degrees(CAMPUS);
const matrix = adjacencyMatrix(CAMPUS);
const chain = (path: number[]) => path.map(name).join(" → ");
const edgeName = ([u, v]: [number, number, number]) => `${name(u)}—${name(v)}`;
const weightOf = (u: number, v: number) => matrix[u][v]!;
const gymRoute = [DORM, GYM, PLAZA];
const gymLength = weightOf(DORM, GYM) + weightOf(GYM, PLAZA);
const rejected = tree.steps.filter((s) => !s.accepted);
const maxDegree = Math.max(...deg);
const busiest = deg.indexOf(maxDegree);
const fmt = (d: number) => (d === Infinity ? "∞" : String(d));
const routeEdges = route.slice(1).map((v, i) => weightOf(route[i], v));
/** Tentative distance of a vertex just after `step` (1-based) Dijkstra steps. */
const after = (step: number, v: number) => shortest.steps[step - 1].dist[v];
const canteenStep = shortest.order.indexOf(CANTEEN) + 1;

export const graphSections: GraphSection[] = [
  {
    id: "campus",
    title: GRAPH_SECTIONS[0].title,
    lead: "从招新日的一张校园地图出发",
    blocks: [
      p(
        "数模协会招新这天，摊位摆在招新广场。协会准备在宿舍区门口立一块指路牌，告诉新生“沿这条路走最近”。校园里能走的路连接着七个地点，每条路旁标着步行距离（米）：",
      ),
      { type: "graph-map", highlight: "none" },
      p(
        `从宿舍区到招新广场，有好几条路可选。看起来最“直接”的是经过体育馆：${chain(gymRoute)}，只走两段路，共 ${gymLength} 米。可是 ${chain(route)} 要走 ${route.length - 1} 段路，加起来只有 ${routeEdges.join(" + ")} = ${shortest.dist[PLAZA]} 米，反而更近。`,
      ),
      p(
        "七个地点、十二条路，人眼还能一条条比较；换成几百个路口的城市路网，可能的路线多到无法枚举。这门课学两件事：一是怎样把这类问题写成“图”，二是两种经典的网络优化算法：求最短路的 Dijkstra 算法，以及用最少总长度把所有地点连起来的最小生成树。",
      ),
      note("这是为教学设计的原创地图，地点和距离都是虚构的。为了让每个问题只有一个最优答案，十二条路的长度各不相同。"),
      { type: "question", id: "graph-think-1" },
    ],
  },
  {
    id: "graph",
    title: GRAPH_SECTIONS[1].title,
    lead: "只保留与问题有关的东西",
    blocks: [
      p(
        "数学里的“图”不是图片，而是由顶点和边组成的结构：顶点代表对象（这里是地点），边代表对象之间的关系（这里是两地之间有路）。边上标的数字叫权，可以是距离、时间、费用或容量。带权的图叫赋权图，也叫网络。",
      ),
      formula(String.raw`G=(V,E),\qquad |V|=${CAMPUS.n},\quad |E|=${ROADS.length}`),
      p(
        "画图时，顶点的位置和边的弯直都不重要，重要的只有“谁和谁相连、权是多少”。这正是建模的关键一步：把与问题无关的细节（路的宽窄、两旁的树）去掉，只留下决定答案的结构。",
      ),
      p(
        "校园里的路两个方向都能走，所以是无向图。如果是单行道，或者上坡下坡用时不同，就要用有向图：边有方向，A 到 B 的权不一定等于 B 到 A 的权。",
      ),
      p(
        `一个顶点连着的边数叫它的度。${name(busiest)}连着 ${maxDegree} 条路，度最大。把所有顶点的度加起来，每条边被它的两个端点各数了一次，所以度之和一定是边数的 2 倍：`,
      ),
      formula(String.raw`\sum_{v\in V}\deg(v)=2|E|=${2 * ROADS.length}`),
      { type: "question", id: "graph-think-2" },
    ],
  },
  {
    id: "matrix",
    title: GRAPH_SECTIONS[2].title,
    lead: "图在计算机里长什么样",
    blocks: [
      p(
        "计算机看不懂画出来的地图，需要把图存成数。最直接的办法是邻接矩阵：n 个顶点就画 n × n 的表，第 i 行第 j 列写顶点 i 到 j 的边权，没有直接相连的写“—”，自己到自己写 0。",
      ),
      {
        type: "table",
        caption: "表 1 · 校园地图的邻接矩阵（单位：米）",
        headers: ["", ...PLACES.map((pl) => pl.name)],
        rows: matrix.map((row, i) => [name(i), ...row.map((x) => (x === null ? "—" : String(x)))]),
      },
      p(
        "无向图的邻接矩阵关于主对角线对称：第 i 行第 j 列和第 j 行第 i 列是同一条路。表中每一行非“—”、非 0 的个数，恰好就是这个地点的度。",
      ),
      p(
        "另一种存法是邻接表：每个顶点只记下它的邻居和对应的权，例如“食堂：宿舍区 300，图书馆 250，教学楼 490”。路网通常很稀疏（每个路口只连着几条路），邻接表比邻接矩阵省空间得多，第 8 节的 Python 程序用的就是这种思路。",
      ),
    ],
  },
  {
    id: "dijkstra-idea",
    title: GRAPH_SECTIONS[3].title,
    lead: "先确定最近的，再往外扩",
    blocks: [
      p(
        "想象从宿舍区出发的人群同时向各个方向走，速度相同。谁先到某个地点，走的就是到那里的最短路。最先到达的一定是离宿舍区最近的地点；而在去往较远地点的最短路线上，途经的每个地点都不会比它更远。",
      ),
      p(
        "Dijkstra（荷兰计算机科学家，1959 年提出）把这个想法变成了算法。它给每个地点记一个“暂定距离”：目前找到的最好路线有多长。开始时只有起点是 0，其余都是 ∞（还没找到路）。然后反复做两件事：",
      ),
      p("① 确定：在还没确定的地点里，挑出暂定距离最小的那个，把它的距离定下来，以后不再改变。"),
      p("② 更新：从刚确定的地点出发，看能不能给它的邻居找到更短的路线。如果“它的距离 + 这条路的长度”比邻居现在的暂定距离小，就把邻居的暂定距离改小。这一步叫松弛。"),
      formula(String.raw`d(v)\leftarrow\min\bigl(d(v),\ d(u)+w(u,v)\bigr)`),
      p(
        "为什么第 ① 步可以放心地“定下来”？设 u 是当前暂定距离最小的未确定地点。任何一条到 u 的其他路线，都要在某处第一次走出已确定的地点，到达某个未确定的地点 x。x 之前的地点都已确定，经由它们到 x 的最好走法已经算进了暂定距离 d(x)，所以这条路线走到 x 时至少已有 d(x) 米，而 d(x) ≥ d(u)。之后的路长都不是负数，所以绕到 u 只会更长或相等。关键条件是：所有边权都不能为负。",
      ),
      { type: "question", id: "graph-think-3" },
    ],
  },
  {
    id: "dijkstra",
    title: GRAPH_SECTIONS[4].title,
    lead: "把每一步写成表",
    blocks: [
      p(`以宿舍区为起点，按 Dijkstra 算法计算。下表每一行是一步：确定一个地点，再更新它的邻居。已确定的距离用方括号标出。`),
      {
        type: "table",
        caption: "表 2 · Dijkstra 算法的每一步（单位：米）",
        headers: ["步", "确定", ...PLACES.map((pl) => pl.name)],
        rows: shortest.steps.map((s, k) => [
          String(k + 1),
          name(s.settled),
          ...s.dist.map((d, v) => (s.done.includes(v) ? `[${fmt(d)}]` : fmt(d))),
        ]),
      },
      p(
        `注意第 ${canteenStep} 步之后，教学楼的暂定距离是 ${after(canteenStep, TEACHING)}（经食堂）；等图书馆确定之后，经图书馆只要 ${shortest.dist[3]} + ${weightOf(3, TEACHING)} = ${shortest.dist[TEACHING]}，暂定距离被改小了。招新广场也是如此：先经图书馆得到 ${shortest.dist[3] + weightOf(3, PLAZA)}，再经教学楼改成 ${shortest.dist[PLAZA]}。`,
      ),
      p(
        `全部确定后，沿着“是谁把它改小的”倒着找回去：${[...route].reverse().map(name).join(" ← ")}。指路牌上应该写：${chain(route)}，共 ${shortest.dist[PLAZA]} 米。顺带得到了宿舍区到每个地点的最短距离。`,
      ),
      p("下面的实验可以一步一步演示，也可以换起点和终点。勾选“图书馆—教学楼施工”，看看最短路怎样改变。"),
      { type: "graph-lab", mode: "path" },
      p(
        `施工后，图书馆—教学楼要绕行 ${CONSTRUCTION.weight} 米，新的最短路是 ${chain(detourRoute)}，共 ${detour.dist[PLAZA]} 米。一条路变长，最优路线可能整体换掉，这类“断边情景”分析在交通、物流题里很常见。`,
      ),
      note(
        "每一步都要在未确定的地点里找最小值，n 个地点大约要做 n² 次比较。用“堆”（优先队列）保存暂定距离，可以让大图上的计算快很多，Python 程序里的 heapq 就是这个作用。",
      ),
    ],
  },
  {
    id: "mst",
    title: GRAPH_SECTIONS[5].title,
    lead: "Kruskal：从短到长，不成环就要",
    blocks: [
      p(
        "招新日还有第二个任务：协会要给每个地点的引导点拉一根广播线，线只能沿路铺设，要求所有地点都连通（能互相传到），总长度越短越好。这个问题和最短路不同：不在乎从哪到哪，只要全部连起来。",
      ),
      p(
        `连通所有顶点、又没有多余环路的一组边叫生成树。${CAMPUS.n} 个顶点的生成树恰好有 ${CAMPUS.n - 1} 条边：少一条就断开，多一条就成环。总权最小的生成树叫最小生成树（MST）。`,
      ),
      p(
        "Kruskal 算法（1956 年）的做法非常直接：把所有边按长度从短到长排好，依次考虑每一条；如果它连接的两个地点还没有连通，就选它；如果已经连通了，选它只会形成一个环，跳过。选够 n − 1 条就停。",
      ),
      {
        type: "table",
        caption: "表 3 · Kruskal 算法的每一步",
        headers: ["顺序", "边", "长度（米）", "结果", "累计（米）"],
        rows: tree.steps.map((s, k) => [
          String(k + 1),
          edgeName(s.edge),
          String(s.edge[2]),
          s.accepted ? "选用" : "跳过：两端已连通，会成环",
          String(s.total),
        ]),
      },
      p(
        `第 ${tree.steps.indexOf(rejected[0]) + 1} 条 ${edgeName(rejected[0].edge)}（${rejected[0].edge[2]} 米）被跳过：此时教学楼和体育馆已经经由招新广场连在一起了，再拉这条线只会多出一个环。选满 ${CAMPUS.n - 1} 条后，最小生成树总长 ${tree.total} 米，剩下的边不用再看。`,
      ),
      { type: "graph-map", highlight: "tree" },
      p("在实验中切换到“最小生成树”，可以一条一条地看 Kruskal 怎样挑边。"),
      { type: "graph-lab", mode: "tree" },
    ],
  },
  {
    id: "compare",
    title: GRAPH_SECTIONS[6].title,
    lead: "两棵树，回答两个问题",
    blocks: [
      p(
        `把最短路的结果画出来，从宿舍区到每个地点的最短路线合在一起，也是一棵树，叫最短路树。它和最小生成树并不相同。宿舍区到体育馆，最短路是直接走 ${shortest.dist[GYM]} 米；在最小生成树里却要走 ${chain(treePath(DORM, GYM))}，共 ${treeDistance(DORM, GYM)} 米，因为最小生成树为了节省总长，没有保留宿舍区—体育馆这条 ${weightOf(DORM, GYM)} 米的长路。`,
      ),
      p(
        "原因在于目标不同：最短路关心“从起点到每个地点各自最近”，最小生成树关心“全部连通的总长度最省”。指路牌要用最短路，铺广播线要用最小生成树。题目里出现“从 A 到 B”“路径”“到达时间”，多半是最短路；出现“连通全部”“铺设”“总造价最低”，多半是最小生成树。",
      ),
      p(
        `为什么“每次选最短、不成环”就能得到最优？关键是一个性质：把顶点任意分成两组，连接两组的边里最短的那条，一定在某棵最小生成树中。Kruskal 每选一条边，都是在跨越某种“分组”时选了最短的。另一种常用方法 Prim 算法，从一个顶点出发，每次把离当前这棵树最近的顶点接进来，用的是同一个性质。本例用 Prim 从宿舍区出发，得到的总长同样是 ${primTree.total} 米。`,
      ),
      note("贪心算法（每一步只做眼前最好的选择）并不总能得到全局最优，用之前要能说明它为什么对。Dijkstra 的贪心依赖“边权非负”（第 4 节）；Kruskal 和 Prim 依赖上面的分组性质，对任意边权都成立。"),
    ],
  },
  {
    id: "python",
    title: GRAPH_SECTIONS[7].title,
    lead: "用代码核对每一个数",
    blocks: [
      p("下面的程序先用堆自己实现一遍 Dijkstra，打印每一步确定的地点，再用 networkx 核对最短路和最小生成树，最后模拟施工情景。"),
      { type: "code", text: python },
      p(
        `运行后应依次确定：${shortest.order.map((v) => `${name(v)} ${shortest.dist[v]}`).join("、")}（米）；最短路线 ${chain(route)}，共 ${shortest.dist[PLAZA]} 米；最小生成树总长 ${tree.total} 米；施工后最短路 ${chain(detourRoute)}，共 ${detour.dist[PLAZA]} 米。`,
      ),
      note("networkx 用地点名直接当顶点，不必编号。比赛中路网往往来自附件表格：先读成“起点、终点、权”三列，再用 add_weighted_edges_from 建图；有向图改用 nx.DiGraph。"),
    ],
  },
  {
    id: "limits",
    title: GRAPH_SECTIONS[8].title,
    lead: "知道这两个算法管不到哪里",
    blocks: [
      p(
        "负权边。Dijkstra 要求边权非负。例如有向图中 A→B 为 2、A→C 为 3、C→B 为 −2：Dijkstra 会先把 B 定为 2，可经过 C 只要 3 − 2 = 1。权可能为负时（如“收益”被写成负费用），要改用 Bellman–Ford 算法；如果存在总和为负的环，最短路甚至没有意义。",
      ),
      p(
        "有向图和多重标准。单行道、上下坡用时不同要用有向图。最短路也不一定按距离算：按时间、费用，或者把多种因素加权成一个“综合代价”，都是常见做法，但权的含义要在论文里写清楚。",
      ),
      p(
        "规模。几万个路口的城市路网，用堆优化的 Dijkstra 仍然很快；但如果要求“经过所有地点各一次再回来的最短回路”（旅行商问题），就没有已知的快速精确算法，地点一多只能用启发式方法求近似解。",
      ),
      p(
        "更多网络问题。本课只讲了最短路和最小生成树。网络流（运输网络最多能运多少、最便宜怎么运）、中心性（哪个节点最关键）、图着色（排课不冲突）等，也都是比赛常见的图模型，可以先在方法速查的“网络流 / 图模型”中了解。其中不少问题也能写成线性规划求解。",
      ),
      note("常见错误：无向图、有向图混用；边权单位不统一（米和分钟混在一起）；把最小生成树当成最短路；在有负权的图上用 Dijkstra；只给出一条路线，不分析断路、拥堵时结果是否稳定。"),
    ],
  },
  {
    id: "graph-self-test",
    title: GRAPH_SECTIONS[9].title,
    lead: "不计成绩，检查自己是否理解",
    blocks: [
      p("下面三道题对应本章最容易混淆的三个概念。点“核对”即时反馈，不计成绩；想系统练习，可以进入专项练习。"),
      { type: "question", id: "graph-self-1" },
      { type: "question", id: "graph-self-2" },
      { type: "question", id: "graph-self-3" },
    ],
  },
  {
    id: "graph-transfer",
    title: GRAPH_SECTIONS[10].title,
    lead: "从一张校园地图到一道网络题",
    blocks: [
      p(
        "竞赛中的网络类题目（物流配送、应急救援、交通疏导、管线铺设）常用这样的流程：确定顶点和边各代表什么、权是什么含义和单位 → 判断有向还是无向、权是否可能为负 → 选择模型（最短路、最小生成树、网络流……）→ 用程序求解并把结果画回地图 → 做断路、拥堵、需求变化等情景分析 → 讨论模型没有考虑的因素。",
      ),
      p(
        "最短路还可以作为更大模型的一部分：例如先用最短路算出任意两个地点之间的距离表，再把这张表交给线性规划或整数规划，决定车辆怎样调度、仓库建在哪里。",
      ),
      {
        type: "course-bridge",
        to: "/learn/linear-programming",
        kicker: "相关精讲 · 线性规划",
        title: "把距离表交给优化模型",
        text: "最短路给出“两点之间多远”，线性规划在资源约束下决定“怎样安排最好”。",
      },
      p("想练完整流程，可以用七关实战中的“校园共享单车：需求预测与调度建议”教学案例：调度方案需要用到站点之间的距离。"),
      note(
        "参考：Dijkstra, E. W. (1959). A note on two problems in connexion with graphs. Numerische Mathematik, 1, 269–271；Kruskal, J. B. (1956). On the shortest spanning subtree of a graph and the traveling salesman problem. Proceedings of the American Mathematical Society, 7(1), 48–50；Cormen, T. H. et al. (2022). Introduction to Algorithms (4th ed.), Chapters 21–22. MIT Press。",
      ),
    ],
  },
];

/** Path between two vertices inside the minimum spanning tree (unique in a tree). */
export function treePath(from: number, to: number): number[] {
  const t = dijkstra({ n: CAMPUS.n, edges: tree.edges }, from);
  return pathTo(t.prev, t.dist, to);
}
export function treeDistance(from: number, to: number): number {
  return dijkstra({ n: CAMPUS.n, edges: tree.edges }, from).dist[to];
}
