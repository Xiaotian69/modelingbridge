/** Single source for the V2 information architecture (design doc §3). */
export type NavItem = { to: string; label: string; match: string[] };

/** The four learning actions in the header. Home is the logo. */
export const primaryNav: NavItem[] = [
  { to: "/learn", label: "精讲", match: ["/learn"] },
  { to: "/practice", label: "刷题", match: ["/practice"] },
  { to: "/quest", label: "实战", match: ["/quest", "/cases"] },
  { to: "/library", label: "资料", match: ["/library", "/resources", "/tools", "/calendar"] },
];

export const recordsNav: NavItem = { to: "/records", label: "学习记录", match: ["/records"] };

/** Everything in the mobile menu, in order. */
export const mobileNav: NavItem[] = [
  { to: "/", label: "首页", match: [] },
  ...primaryNav,
  recordsNav,
];

/** Lower-frequency pages stay one click away in the footer (nothing is dropped). */
export const footerNav = [
  { to: "/about", label: "关于与合规" },
  { to: "/feedback", label: "反馈与贡献" },
  { to: "/library/calendar", label: "赛事日历" },
  { to: "/cases", label: "案例库" },
  { to: "/workbench", label: "AI 工作台（实验）" },
];

const isUnder = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(prefix + "/");

/** Which nav item a path belongs to ("/" for home, null for pages outside the six). */
export function activeNav(pathname: string): string | null {
  if (pathname === "/") return "/";
  for (const item of [...primaryNav, recordsNav])
    if (item.match.some((prefix) => isUnder(pathname, prefix))) return item.to;
  return null;
}

/**
 * Pages that still use the pre-V2 light styling. They render inside `.legacy-surface`
 * until each one is migrated (later batches), so dark mode never half-applies to them.
 */
const legacyExact = ["/learn"];
const legacyPrefixes = [
  "/learn/reference",
  "/quest",
  "/cases",
  "/records",
  "/workbench",
  "/feedback",
  "/about",
  "/resources",
  "/tools",
  "/calendar",
];
export const isLegacyPage = (pathname: string) =>
  legacyExact.includes(pathname) || legacyPrefixes.some((prefix) => isUnder(pathname, prefix));
