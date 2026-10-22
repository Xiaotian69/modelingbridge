import { Link, useLocation } from "react-router-dom";
import { primaryNav } from "../app/navigation";

export function NotFoundPage() {
  const { pathname } = useLocation();
  return (
    <section className="site-container not-found" aria-labelledby="nf-title">
      <p className="page-kicker">404</p>
      <h1 id="nf-title">没有找到这个页面</h1>
      <p>
        <code>{pathname}</code> 可能已经移动或从未存在。你的本机学习记录不受影响。
      </p>
      <nav aria-label="可以去这里" className="not-found-links">
        <Link className="btn btn-primary" to="/">
          回到首页
        </Link>
        {primaryNav.map((item) => (
          <Link key={item.to} className="btn btn-secondary" to={item.to}>
            {item.label}
          </Link>
        ))}
      </nav>
    </section>
  );
}
