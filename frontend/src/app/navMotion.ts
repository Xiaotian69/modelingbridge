/**
 * Which page transition a navigation gets (spec §5.3). Direction follows page depth, like iOS:
 * deeper slides in, shallower slides back, same level or unknown cross-fades.
 */
export type NavKind = "forward" | "back" | "fade" | "none";

const normalize = (pathname: string) => (pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname) || "/";
const parts = (pathname: string) => normalize(pathname).split("/").filter(Boolean);

const SECTIONS = new Set(["learn", "practice", "quest", "cases", "library", "records", "workbench", "feedback", "about"]);

export function routeDepth(pathname: string): number | null {
  const p = parts(pathname);
  if (p.length === 0) return 0;
  const [section] = p;
  if (!SECTIONS.has(section)) return null;
  if (p.length === 1 || section === "library") return 1; // library sub-tabs are siblings
  if (section === "practice") return p.length <= 3 ? 3 : null;
  if (section === "learn") {
    if (p.length === 2) return 2;
    return p.length === 3 && p[1] === "linear-programming" && p[2] === "lab" ? 3 : null;
  }
  if (section === "cases") return p.length === 2 ? 2 : null;
  return null;
}

/** Same page: only the parameter switches listed in the spec (exercise, skill), not e.g. cases. */
export function isSamePage(from: string, to: string): boolean {
  const a = normalize(from);
  const b = normalize(to);
  if (a === b) return true;
  const practice = /^\/practice\/([^/]+)(?:\/[^/]+)?$/;
  const pa = a.match(practice);
  const pb = b.match(practice);
  if (pa && pb) return pa[1] === pb[1];
  const skills = /^\/library\/skills(?:\/[^/]+)?$/;
  return skills.test(a) && skills.test(b);
}

const isChallenge = (pathname: string) => parts(pathname)[0] === "challenge";

export function navKind(from: string, to: string): NavKind {
  if (isChallenge(from) || isChallenge(to) || isSamePage(from, to)) return "none";
  const a = routeDepth(from);
  const b = routeDepth(to);
  if (a === null || b === null || a === b) return "fade";
  return b > a ? "forward" : "back";
}
