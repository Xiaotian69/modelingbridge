import { Suspense, useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigationType } from "react-router-dom";
import { EASING, duration } from "../design/motion";
import { PageErrorBoundary } from "../components/ui/PageErrorBoundary";
import { Brand } from "../components/ui/Brand";
import { Icon } from "../components/ui/Icon";
import { ThemeToggle } from "../app/ThemeToggle";
import { Sheet } from "../components/motion/Sheet";
import { isViewTransitionNavigation } from "../app/transitionPush";
import {
  activeNav,
  footerNav,
  mobileNav,
  primaryNav,
  recordsNav,
} from "../app/navigation";

export function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigationType = useNavigationType();
  const toggle = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLElement>(null);
  const main = useRef<HTMLElement>(null);
  const current = activeNav(location.pathname);
  const home = location.pathname === "/";

  useEffect(() => {
    setOpen(false);
  }, [location]);
  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLElement>("a")?.focus();
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
  // Page enter (motion system §page): a short fade + rise on forward navigation only.
  // Back / forward (POP) restore a scroll position instantly, so they get no animation;
  // hash-only changes keep the same page and scroll smoothly instead (RouteScroll).
  // A View Transition already animates the switch (app/TransitionNavigation): no second fade.
  useEffect(() => {
    if (navigationType === "POP" || isViewTransitionNavigation()) return;
    const ms = duration("page");
    if (!ms) return;
    const lite = document.documentElement.dataset.motion === "lite";
    const animation = main.current?.animate?.(
      lite
        ? [{ opacity: 0.6 }, { opacity: 1 }]
        : [
            { opacity: 0.6, transform: "translateY(6px)" },
            { opacity: 1, transform: "none" },
          ],
      { duration: ms, easing: EASING.enter },
    );
    return () => animation?.cancel(); // rapid switching: the next page starts clean
  }, [location.pathname, navigationType]);

  const ariaCurrent = (to: string) => (current === to ? "page" : undefined);

  return (
    <div className="site-layout">
      <a href="#main-content" className="skip-link">
        跳到主要内容
      </a>
      <header className={`site-header${home ? " is-brand" : ""}`}>
        <div className="site-container header-inner">
          <Link to="/" className="brand" aria-label="模桥 ModelingBridge 首页">
            <Brand />
          </Link>
          <nav className="primary-nav" aria-label="主导航">
            {primaryNav.map((item) => (
              <Link key={item.to} to={item.to} aria-current={ariaCurrent(item.to)}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="header-tools">
            <Link
              to={recordsNav.to}
              className="records-link"
              aria-current={ariaCurrent(recordsNav.to)}
            >
              <Icon name="record" size={17} />
              <span>{recordsNav.label}</span>
            </Link>
            <ThemeToggle />
          </div>
          <button
            ref={toggle}
            type="button"
            className="icon-button menu-toggle"
            aria-label={open ? "关闭导航菜单" : "打开导航菜单"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </header>
      <Sheet open={open} side="right" onBackdrop={() => setOpen(false)}>
        <nav
          ref={menu}
          id="mobile-navigation"
          className="mb-sheet-panel mobile-menu"
          aria-label="移动导航"
        >
          {mobileNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              aria-current={ariaCurrent(item.to)}
              onClick={() => setOpen(false)}
            >
              {item.label}
              <Icon name="arrow" size={16} />
            </Link>
          ))}
          <div className="mobile-menu-theme">
            <ThemeToggle showLabel />
          </div>
          <div className="mobile-menu-footer">
            {footerNav.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </Sheet>
      <main
        id="main-content"
        ref={main}
        className="site-main"
        tabIndex={-1}
      >
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
        <div className="site-container footer-inner">
          <div className="footer-brand">
            <Link to="/" className="brand" aria-label="模桥 ModelingBridge 首页">
              <Brand />
            </Link>
            <p>从一个真实问题开始，走完一次数学建模。面向高校学生的公益学习平台。</p>
          </div>
          <nav aria-label="更多内容" className="footer-nav">
            {footerNav.map((item) => (
              <Link key={item.to} to={item.to}>
                {item.label}
              </Link>
            ))}
            <a
              href="https://github.com/Xiaotian69/modelingbridge"
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="github" size={16} /> GitHub 开源项目 ↗
            </a>
          </nav>
        </div>
        <div className="site-container footer-bottom">
          <span>© {new Date().getFullYear()} 模桥 ModelingBridge</span>
          <span>学习辅助 · 独立思考 · 尊重原创</span>
        </div>
      </footer>
    </div>
  );
}
