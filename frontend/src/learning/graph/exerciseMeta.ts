/**
 * Teaching metadata for graph questions (same shape as the other courses' exerciseMeta):
 * the section that teaches each point, a second-level clue, and deterministic mistake patterns.
 * Numeric mistake values are re-derived in content.test.ts.
 */
import type { ExerciseMeta } from "../exerciseMeta";

export const graphExerciseMeta: Record<string, ExerciseMeta> = {
  "graph-think-1": {
    sectionId: "campus",
    errors: [
      { option: "yes", tag: "把边数当成路程", message: "各段路长度不同。经体育馆只走 2 段，却有 1130 米；4 段的路线只有 1080 米。" },
    ],
  },
  "graph-think-2": {
    sectionId: "graph",
    errors: [
      { option: "plaza", tag: "数错了度", message: "招新广场连着图书馆、教学楼、体育馆，共 3 条路。再数数教学楼。" },
      { option: "dorm", tag: "数错了度", message: "宿舍区连着食堂、东门、体育馆，共 3 条路。" },
      { option: "gym", tag: "数错了度", message: "体育馆连着 4 条路，比它多的还有一个地点。" },
    ],
  },
  "graph-think-3": {
    sectionId: "dijkstra-idea",
    errors: [
      { option: "direct", tag: "理由不充分", message: "直连的路不一定最短：食堂—教学楼直连 490 米，经图书馆只要 450 米。真正的理由是：别的路线要先走到更远的地点，而路长不为负。" },
      { option: "rule", tag: "把结论当成规定", message: "“确定后不再改变”是可以证明的结论，依据是边权非负；如果有负权边，它就不成立。" },
    ],
  },
  "graph-self-1": {
    sectionId: "dijkstra-idea",
    errors: [
      { option: "neighbour", tag: "混淆了贪心规则", message: "Dijkstra 比较的是从起点算起的暂定距离，不是离上一个地点的距离。" },
      { option: "most", tag: "混淆了度与距离", message: "连着几条路（度）与离起点多远无关。" },
      { option: "target", tag: "误解了算法顺序", message: "终点按距离排到它时才会被确定，往往是最后几步。" },
    ],
  },
  "graph-self-2": {
    sectionId: "mst",
    errors: [
      { option: "false", tag: "误解了树的性质", message: "树没有环且连通，n 个顶点的树恰有 n − 1 条边。" },
    ],
  },
  "graph-self-3": {
    sectionId: "limits",
    clue: "回到第 4 节“为什么可以放心地定下来”的论证：哪一句话用到了权的性质？",
    errors: [
      { option: "undirected", tag: "条件过严", message: "有向图同样可以用 Dijkstra，只要沿边的方向松弛。" },
      { option: "integer", tag: "条件过严", message: "权可以是小数（例如以小时计的时间），论证只要求不为负。" },
      { option: "distinct", tag: "条件过严", message: "权相同时最短路可能不止一条，但算出的最短距离仍然正确。" },
    ],
  },
  "graph-practice-1": {
    sectionId: "graph",
    errors: [
      { value: 9, tag: "每条边只数了一次", message: "每条边有两个端点，要给两个顶点各加 1 个度。" },
      { value: 4.5, tag: "除反了", message: "度之和是边数的 2 倍，不是一半。" },
    ],
  },
  "graph-practice-2": {
    sectionId: "mst",
    errors: [
      { value: 7, tag: "多算了一条", message: "7 条边连 7 个顶点一定会出现环。生成树的边数是 n − 1。" },
      { value: 12, tag: "把所有边都选上了", message: "12 条是全部可选的路，生成树只需要其中 n − 1 条。" },
    ],
  },
  "graph-practice-3": {
    sectionId: "matrix",
    errors: [
      { option: "full", tag: "混淆了稀疏与稠密", message: "没有直接相连的两点之间写“—”（或 ∞），路网里这样的位置很多。" },
      { option: "rowsum", tag: "没有依据的性质", message: "各地点连着的路长短不同，行和一般不相等。" },
      { option: "diagonal", tag: "混淆了度与对角线", message: "对角线写的是自己到自己的距离 0。度是每行“有路”的个数。" },
    ],
  },
  "graph-practice-4": {
    sectionId: "dijkstra",
    errors: [
      { value: 9, tag: "没有发现更短的中转", message: "A → B → D 是 4 + 5 = 9，但 A 到 B 经过 C 只要 3。" },
      { value: 10, tag: "没有发现更短的中转", message: "A → C → D 是 2 + 8 = 10。试试 A → C → B → D。" },
      { value: 5, tag: "只看了最后一段", message: "5 只是 B—D 这一段。还要加上 A 到 B 的最短距离。" },
    ],
  },
  "graph-practice-5": {
    sectionId: "dijkstra-idea",
    errors: [
      { option: "p", tag: "没有选最小值", message: "P 是 7，Q 只有 4。每一步确定暂定距离最小的地点。" },
      { option: "r", tag: "误解了 ∞", message: "∞ 表示目前还没找到到 R 的路，它的暂定距离最大，不会先被确定。" },
      { option: "t", tag: "没有选最小值", message: "T 是 9，是暂定距离最大的之一。" },
    ],
  },
  "graph-practice-6": {
    sectionId: "mst",
    errors: [
      { value: 6, tag: "把成环的边也选了", message: "1 + 2 + 3 = 6 只连了 A、B、C，而且 A—C 会成环；D 还没连上。" },
      { value: 10, tag: "把成环的边也选了", message: "看起来选了 A—C（3）。它与 A—B、B—C 成环，应跳过。" },
      { value: 15, tag: "选了全部的边", message: "15 是五条边的总和。生成树只需要 3 条边。" },
    ],
  },
  "graph-practice-7": {
    sectionId: "mst",
    errors: [
      { option: "cd", tag: "跳过的理由错了", message: "Kruskal 跳过一条边只有一个理由：两端已经连通，会成环。D 此时还没连上，C—D 要选。" },
      { option: "ab", tag: "误解了贪心", message: "最短的边最先被选中，A—B 不会被跳过。" },
      { option: "none", tag: "忘了 n − 1", message: "4 个顶点的生成树只有 3 条边，而且 A—C 会成环。" },
    ],
  },
  "graph-practice-8": {
    sectionId: "limits",
    errors: [
      { option: "right", tag: "忽略了负权", message: "Dijkstra 第二步就把 B 定为 2，之后不再更新，得不到 1。" },
      { option: "infinite", tag: "误解了算法过程", message: "Dijkstra 每个顶点只确定一次，不会无限循环；问题是结果错了。" },
      { option: "ignore", tag: "误解了负权", message: "负权不会被自动改成 0。经过 C 的真实路长是 3 − 2 = 1。" },
    ],
  },
  "graph-practice-9": {
    sectionId: "compare",
    errors: [
      { option: "same", tag: "混淆了两种树", message: "宿舍区到体育馆：最短路直接走 850 米，最小生成树里要绕 1360 米。" },
      { option: "subset", tag: "混淆了两种树", message: "最短路可能用到最小生成树没选的边，例如宿舍区—体育馆。" },
      { option: "unique", tag: "混淆了两种树", message: "最小生成树不依赖起点，最短路树依赖起点；两者目标不同，一般不是同一棵树。" },
    ],
  },
  "graph-practice-10": {
    sectionId: "dijkstra",
    errors: [
      { value: 1080, tag: "参数没有更新", message: "1080 是施工前的结果。图书馆—教学楼变成 500 米后，原路线要 1380 米。" },
      { value: 1380, tag: "只改了原路线", message: "原路线变成 1380 米后，要和其他候选路线重新比较。" },
      { value: 1130, tag: "漏掉了一条候选", message: "经体育馆是 1130 米，但宿舍区 → 食堂 → 图书馆 → 招新广场更短。" },
    ],
  },
  "graph-practice-11": {
    sectionId: "compare",
    errors: [
      { option: "cable", tag: "混淆了最短路与最小生成树", message: "“连通所有村庄、总长最短”没有固定的起点和终点，是最小生成树问题。" },
      { option: "flow", tag: "混淆了最短路与网络流", message: "有容量上限、求最大运量，是最大流问题，不是最短路。" },
    ],
  },
  "graph-practice-12": {
    sectionId: "dijkstra",
    errors: [
      { value: 750, tag: "跳到了最终结果", message: "750 是图书馆确定之后的值。前两步只确定了宿舍区和食堂。" },
      { value: 490, tag: "漏了食堂的距离", message: "490 只是食堂—教学楼这一段，还要加上宿舍区到食堂的 300。" },
      { value: 970, tag: "走错了中转", message: "看起来经过了东门（450 + 520）。前两步里东门还没有确定。" },
    ],
  },
};
