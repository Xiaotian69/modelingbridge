/** Shared geometry for the homepage math network and the splash screen. */
export type NetworkNode = { x: number; y: number; z: number };
export type ProjectedNode = { x: number; y: number; z: number };

/** Node count used by both the hero network and the splash (narrow canvases draw fewer). */
export const nodeCount = (width: number) => (width < 500 ? 48 : 88);
/** Two nodes are linked when their distance on the unit sphere is at most this. */
export const LINK_DISTANCE = 0.65;
/** Radians per millisecond of the hero rotation. */
export const HERO_SPIN = 0.000035;
export const MAX_DPR = 1.5;

export const NETWORK_COLORS = {
  guide: "rgba(105,192,186,0.12)",
  link: (alpha: number) => `rgba(100,211,196,${alpha})`,
  node: (alpha: number) => `rgba(139,235,217,${alpha})`,
} as const;

/** Evenly spread points on a unit sphere (Fibonacci lattice). */
export function sphereNodes(count: number): NetworkNode[] {
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - (i / (count - 1)) * 2;
    const ring = Math.sqrt(1 - y * y);
    const angle = i * Math.PI * (3 - Math.sqrt(5));
    return { x: Math.cos(angle) * ring, y, z: Math.sin(angle) * ring };
  });
}

/** Rotate around the vertical axis by `phase` and project with a slight tilt. */
export function projectNodes(
  nodes: NetworkNode[],
  phase: number,
  cx: number,
  cy: number,
  radius: number,
): ProjectedNode[] {
  const cos = Math.cos(phase);
  const sin = Math.sin(phase);
  return nodes.map((n) => {
    const x = n.x * cos + n.z * sin;
    const z = n.z * cos - n.x * sin;
    return { x: cx + x * radius, y: cy + n.y * radius * 0.94 + z * radius * 0.17, z };
  });
}

/** Pairs of linked nodes with their sphere distance, computed once per node set. */
export function linkPairs(nodes: NetworkNode[]): [number, number, number][] {
  const pairs: [number, number, number][] = [];
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++) {
      const d = Math.hypot(
        nodes[i].x - nodes[j].x,
        nodes[i].y - nodes[j].y,
        nodes[i].z - nodes[j].z,
      );
      if (d <= LINK_DISTANCE) pairs.push([i, j, d]);
    }
  return pairs;
}

export const linkAlpha = (pz: number, qz: number, distance: number) =>
  (0.12 + (pz + qz + 2) * 0.045) * (1 - distance / 0.85);
export const nodeAlpha = (z: number) => 0.28 + (z + 1) * 0.3;
export const nodeRadius = (z: number) => 1.4 + (z + 1) * 0.65;
