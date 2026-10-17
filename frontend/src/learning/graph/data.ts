/**
 * The lesson's campus map on recruitment day (original teaching example; distances are walking
 * metres on an imagined campus, not a real one). verify_graph.py holds the same numbers.
 */
import type { Edge, Graph } from "./math";

export const PLACES = [
  { id: "dorm", name: "宿舍区", x: 70, y: 190 },
  { id: "gate", name: "东门", x: 215, y: 320 },
  { id: "canteen", name: "食堂", x: 205, y: 70 },
  { id: "library", name: "图书馆", x: 405, y: 70 },
  { id: "teaching", name: "教学楼", x: 325, y: 195 },
  { id: "gym", name: "体育馆", x: 430, y: 330 },
  { id: "plaza", name: "招新广场", x: 565, y: 200 },
] as const;
export const DORM = 0;
export const GATE = 1;
export const CANTEEN = 2;
export const LIBRARY = 3;
export const TEACHING = 4;
export const GYM = 5;
export const PLAZA = 6;

/** Roads: [u, v, metres]. Every weight differs, so shortest paths and the MST are unique. */
export const ROADS: Edge[] = [
  [DORM, CANTEEN, 300],
  [DORM, GATE, 450],
  [DORM, GYM, 850],
  [CANTEEN, LIBRARY, 250],
  [CANTEEN, TEACHING, 490],
  [GATE, TEACHING, 520],
  [LIBRARY, TEACHING, 200],
  [LIBRARY, PLAZA, 560],
  [TEACHING, PLAZA, 330],
  [GYM, PLAZA, 280],
  [GATE, GYM, 640],
  [TEACHING, GYM, 400],
];
export const CAMPUS: Graph = { n: PLACES.length, edges: ROADS };

/** The ring road 宿舍区—体育馆 is drawn as a curve below 东门 so no two roads cross on the map. */
export const CURVED: [number, number, { x: number; y: number }] = [DORM, GYM, { x: 200, y: 520 }];

/** §5 / lab: the road between 图书馆 and 教学楼 is under construction and becomes a 500 m detour. */
export const CONSTRUCTION = { u: LIBRARY, v: TEACHING, weight: 500 };
