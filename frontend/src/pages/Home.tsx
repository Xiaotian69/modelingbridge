import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MathNetwork } from "../components/motion/MathNetwork";
import { Icon } from "../components/ui/Icon";
import { HomeSearch } from "./home/HomeSearch";
import { readContinueItems, type ContinueItem } from "./home/continueLearning";

type RouteStop = { title: string; detail: string; href?: string };
const route: RouteStop[] = [
  { title: "认识建模", detail: "3–5 分钟导论 · 筹备中" },
  { title: "线性规划", detail: "精讲 · 刷题 · 实战", href: "/learn/linear-programming" },
  { title: "回归预测", detail: "筹备中" },
  { title: "评价决策", detail: "筹备中" },
  { title: "综合项目", detail: "筹备中" },
];

function ContinueLearning() {
  const [items] = useState<ContinueItem[]>(() => readContinueItems());
  const [sectionTitle, setSectionTitle] = useState<string | null>(null);
  const reading = items.find((i) => i.kind === "reading");
  useEffect(() => {
    if (!reading) return;
    import("../learning/content")
      .then(({ sections }) => {
        const index = sections.findIndex((s) => s.id === reading.sectionId);
        if (index >= 0) setSectionTitle(`第 ${index + 1} 节 · ${sections[index].title}`);
      })
      .catch(() => {});
  }, [reading]);
  if (!items.length) return null;
  return (
    <section className="continue-strip" aria-labelledby="continue-title">
      <div className="site-container continue-inner">
        <h2 id="continue-title">继续学习</h2>
        <ul>
          {items.map((item) => (
            <li key={item.kind}>
              {item.kind === "reading" && (
                <>
                  <span>线性规划 · {sectionTitle ?? "上次读到的位置"}</span>
                  <Link className="btn btn-secondary" to={item.href}>
                    继续阅读
                  </Link>
                </>
              )}
              {item.kind === "practice" && (
                <>
                  <span>
                    专项练习：已做 {item.attempted} 题
                    {item.wrong > 0 ? `，${item.wrong} 题待重练` : ""}
                  </span>
                  <Link className="btn btn-secondary" to={item.href}>
                    继续练习
                  </Link>
                </>
              )}
              {item.kind === "quest" && (
                <>
                  <span>
                    七关实战：已完成 {item.completed}/{item.total} 关
                  </span>
                  <Link className="btn btn-secondary" to={item.href}>
                    继续实战
                  </Link>
                </>
              )}
            </li>
          ))}
        </ul>
        <Link className="text-link" to="/records">
          全部学习记录
        </Link>
      </div>
    </section>
  );
}

export function HomePage() {
  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="site-container hero-layout">
          <div className="hero-copy">
            <h1 id="home-title">
              从一个真实问题开始，
              <br />
              学会数学建模。
            </h1>
            <p className="hero-sub">免费 · 无需注册 · 学习进度只保存在你的浏览器</p>
            <div className="doors">
              <section className="door door-primary" aria-labelledby="door-new">
                <p className="door-kicker">我是新手</p>
                <h2 id="door-new">从一个真实小问题开始</h2>
                <p className="door-path">
                  帮一家加工坊安排一周生产 → 学会线性规划 → 用练习检验自己
                </p>
                <Link className="door-go" to="/learn/linear-programming">
                  开始第一课
                  <Icon name="arrow" size={18} />
                </Link>
                <p className="door-note">建模导论（3–5 分钟）筹备中，可以直接开始。</p>
              </section>
              <section className="door" aria-labelledby="door-pro">
                <p className="door-kicker">我有基础</p>
                <h2 id="door-pro">按方法或赛题查找</h2>
                <HomeSearch />
              </section>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <MathNetwork />
          </div>
        </div>
      </section>

      <ContinueLearning />

      <section className="site-container home-route" aria-labelledby="route-title">
        <h2 id="route-title">一条路线，三种练法</h2>
        <ol className="route-track">
          {route.map((stop) => (
            <li key={stop.title} className={stop.href ? "is-open" : "is-planned"}>
              <span className="route-dot" aria-hidden="true" />
              {stop.href ? (
                <Link to={stop.href}>{stop.title}</Link>
              ) : (
                <b>{stop.title}</b>
              )}
              <span>{stop.detail}</span>
            </li>
          ))}
        </ol>
        <p className="route-legend">
          <span>
            <b>精讲</b> 读懂一个模型
          </span>
          <span>
            <b>刷题</b> 检验是否真的会
          </span>
          <span>
            <b>实战</b> 完整走一次七关
          </span>
        </p>
      </section>

      <nav className="site-container home-links" aria-label="更多入口">
        <span>也可以直接去：</span>
        <Link to="/quest">七关实战</Link>
        <Link to="/library">资料中心</Link>
        <Link to="/learn/reference">模型速查</Link>
        <Link to="/library/calendar">赛事日历</Link>
      </nav>
    </div>
  );
}
