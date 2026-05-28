import { Link, NavLink, Outlet } from "react-router-dom";

const nav = [
  { to: "/", label: "总览" },
  { to: "/learn", label: "学习" },
  { to: "/quest", label: "闯关" },
  { to: "/cases", label: "案例" },
  { to: "/calendar", label: "日历" },
  { to: "/tools", label: "工具" },
  { to: "/records", label: "记录" },
  { to: "/about", label: "关于" },
];

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col text-slate-950">
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/78 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white shadow-lg shadow-slate-900/20">
              模
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[15px] font-semibold text-slate-900 transition group-hover:text-bridge-800">模桥</span>
              <span className="hidden text-[10px] tracking-[0.18em] text-slate-500 sm:block">MODELINGBRIDGE</span>
            </span>
          </Link>
          <nav className="flex justify-end gap-1 overflow-x-auto text-sm sm:flex-wrap sm:gap-1.5">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "rounded-md px-2 py-1.5 sm:px-3 transition-colors",
                    isActive
                      ? "bg-slate-950 text-white font-medium"
                      : "text-slate-600 hover:bg-white hover:text-slate-950",
                  ].join(" ")
                }
                end={item.to === "/"}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200/80 bg-white/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>免费试运行阶段：学习辅助、人工确认、透明记录，不提供代写或保奖承诺。</p>
          <div className="flex gap-4">
            <Link to="/calendar" className="text-bridge-700 hover:underline">
              赛事日历
            </Link>
            <Link to="/about" className="text-bridge-700 hover:underline">
              合规说明
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
