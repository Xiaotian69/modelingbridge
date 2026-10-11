import { Suspense, useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { PageErrorBoundary } from "../components/ui/PageErrorBoundary";
import { Brand } from "../components/ui/Brand";
import { Icon } from "../components/ui/Icon";

const nav = [
  { to: "/", label: "首页" },
  { to: "/learn", label: "知识库" },
  { to: "/resources", label: "竞赛资料" },
  { to: "/quest", label: "闯关训练" },
  { to: "/tools", label: "工具箱" },
];
const secondary = [
  { to: "/cases", label: "案例库" },
  { to: "/calendar", label: "赛事日历" },
  { to: "/records", label: "学习记录" },
  { to: "/about", label: "项目与合规说明" },
  { to: "/feedback", label: "反馈与贡献" },
];

export function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const toggle = useRef<HTMLButtonElement>(null);
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    setOpen(false);
  }, [location]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const media = window.matchMedia?.("(min-width: 900px)");
    const desktop = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    document.addEventListener("keydown", close);
    media?.addEventListener("change", desktop);
    return () => {
      document.removeEventListener("keydown", close);
      media?.removeEventListener("change", desktop);
    };
  }, [open]);
  // Replay only the visual transition, preserving the outlet's state and browser history.
  useEffect(() => {
    if (!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      const animation = main.current?.animate?.(
        [
          { opacity: 0.65, transform: "translateY(5px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 220, easing: "ease-out" },
      );
      return () => animation?.cancel();
    }
  }, [location.pathname]);
  return (
    <div className="site-layout">
      <a href="#main-content" className="skip-link">
        跳到主要内容
      </a>
      <header className="site-header">
        <div className="site-container header-inner">
          <Link to="/" className="brand" aria-label="模桥 ModelingBridge 首页">
            <Brand />
          </Link>
          <nav className="desktop-nav" aria-label="主导航">
            {nav.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === "/"}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <Link to="/workbench" className="assistant-link">
            <Icon name="spark" size={16} />
            <span>AI 数模助手</span>
            <span className="status-dot" />
          </Link>
          <button
            ref={toggle}
            type="button"
            className="menu-toggle"
            aria-label={open ? "关闭导航菜单" : "打开导航菜单"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
        {open && (
          <nav
            id="mobile-navigation"
            className="mobile-nav"
            aria-label="移动导航"
          >
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setOpen(false)}
              >
                {item.label}
                <Icon name="arrow" size={16} />
              </NavLink>
            ))}
            <Link to="/workbench" onClick={() => setOpen(false)}>
              AI 数模助手 <span>查看服务状态</span>
            </Link>
          </nav>
        )}
      </header>
      <main id="main-content" ref={main} className="site-main" tabIndex={-1}>
        <PageErrorBoundary key={location.pathname}>
          <Suspense
            fallback={
              <div className="page-loading" role="status">
                <span className="loading-dot" />
                正在打开学习内容…
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </PageErrorBoundary>
      </main>
      <footer className="site-footer">
        <div className="site-container footer-top">
          <div>
            <Link to="/" className="brand">
              <Brand />
            </Link>
            <p>从一道题开始，走完一次数学建模。</p>
            <small>面向高校学生的公益学习平台</small>
          </div>
          <nav aria-label="更多内容">
            {secondary.map((item) => (
              <Link key={item.to} to={item.to}>
                {item.label}
              </Link>
            ))}
          </nav>
          <a
            className="footer-github"
            href="https://github.com/Xiaotian69/modelingbridge"
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="github" /> GitHub 开源项目 <span>↗</span>
          </a>
        </div>
        <div className="site-container footer-bottom">
          <span>© {new Date().getFullYear()} 模桥 ModelingBridge</span>
          <span>为理解而建模，为探索而学习。</span>
          <span>学习辅助 · 独立思考 · 尊重原创</span>
        </div>
      </footer>
    </div>
  );
}
