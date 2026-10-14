import { CampusMap, edgeKey } from "./CampusMap";
import { route, tree } from "./content";
import { CAMPUS, PLACES } from "./data";

const routeKeys = new Set(route.slice(1).map((v, i) => edgeKey(route[i], v)));
const treeKeys = new Set(tree.edges.map(([u, v]) => edgeKey(u, v)));
const names = (keys: Set<string>) =>
  [...keys].map((k) => k.split("-").map((v) => PLACES[Number(v)].name).join("—")).join("、");

/** Static campus map of the lesson: plain (§1), or with the minimum spanning tree marked (§6). */
export function GraphFigure({ highlight }: { highlight: "none" | "path" | "tree" }) {
  const keys = highlight === "path" ? routeKeys : highlight === "tree" ? treeKeys : new Set<string>();
  const cls = highlight === "path" ? "is-path" : "is-tree";
  return (
    <figure className="lp-lab graph-figure">
      <figcaption>
        <span className="eyebrow">
          {highlight === "tree" ? `图 · 最小生成树（总长 ${tree.total} 米）` : "图 · 招新日的校园地图（单位：米）"}
        </span>
      </figcaption>
      <CampusMap
        edges={CAMPUS.edges}
        title={highlight === "tree" ? "校园地图上的最小生成树" : "校园地图"}
        desc={
          highlight === "tree"
            ? `七个地点由六条路连通：${names(treeKeys)}，总长 ${tree.total} 米。`
            : `七个地点：${PLACES.map((p) => p.name).join("、")}。十二条路：${CAMPUS.edges
                .map(([u, v, w]) => `${PLACES[u].name}—${PLACES[v].name} ${w} 米`)
                .join("，")}。宿舍区—体育馆是一条从东门南侧绕过的环校路。`
        }
        edgeClass={(key) => (keys.has(key) ? cls : undefined)}
      />
    </figure>
  );
}
