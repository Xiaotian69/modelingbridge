import { Link, Outlet, useLocation } from "react-router-dom";

/**
 * 资料中心 shell. Batch 1 re-homes the existing pages under one roof;
 * the prompt library tab and the licence-aware index arrive in step 4.
 */
const tabs = [
  { to: "/library", label: "资料索引" },
  { to: "/library/tools", label: "模板与工具" },
  { to: "/library/calendar", label: "赛事日历" },
];

export function LibraryLayout() {
  const { pathname } = useLocation();
  const current = tabs.find((t) => t.to !== "/library" && pathname.startsWith(t.to))?.to ?? "/library";
  return (
    <div className="library-shell">
      <div className="library-head">
        <div className="site-container">
          <p className="page-kicker">资料中心</p>
          <nav className="sub-tabs" aria-label="资料中心栏目">
            {tabs.map((tab) => (
              <Link key={tab.to} to={tab.to} aria-current={current === tab.to ? "page" : undefined}>
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="legacy-surface">
        <Outlet />
      </div>
    </div>
  );
}
