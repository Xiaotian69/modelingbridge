import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { MathNetwork } from "../components/motion/MathNetwork";
import { Icon } from "../components/ui/Icon";
import { HomeSearch } from "./home/HomeSearch";
import { RecruitNotice } from "./home/RecruitNotice";
import { readContinueItems, type ContinueItem } from "./home/continueLearning";
import { courseById, sectionIndex, sectionTitleIn } from "../learning/courses";

type RouteStop = { title: string; detail: string; href?: string };
const route: RouteStop[] = [
  { title: "认识建模", detail: "第零课 · 15–20 分钟 · 互动", href: "/learn/introduction" },
  { title: "线性规划", detail: "精讲 · 刷题 · 实战", href: "/learn/linear-programming" },
  { title: "网络优化", detail: "图论 · 最短路 · 生成树", href: "/learn/graph" },
  { title: "回归预测", detail: "回归分析 · 精讲 · 刷题", href: "/learn/regression" },
  { title: "评价决策", detail: "AHP · TOPSIS · 精讲 · 刷题", href: "/learn/ahp" },
  { title: "综合项目", detail: "筹备中" },
];

function ContinueLearning() {
  const [items] = useState<ContinueItem[]>(() => readContinueItems());
  const reading = items.find((i) => i.kind === "reading");
  const readingCourse = reading?.kind === "reading" ? courseById(reading.lesson) : null;
  const readingNumber = reading && readingCourse ? sectionIndex(readingCourse, reading.sectionId) + 1 : 0;
  const readingLabel =
    readingCourse && readingNumber > 0
      ? `第 ${readingNumber} 节 · ${sectionTitleIn(readingCourse, reading!.sectionId)}`
      : "上次读到的位置";
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
                  <span>
                    {readingCourse?.title ?? "精讲"} · {readingLabel}
                  </span>
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
        <RecruitNotice />
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
                  下雨了，两个雨伞点的伞够不够用？→ 认识数学建模 → 选一条路线学下去
                </p>
                <Link className="door-go" to="/learn/introduction">
                  从第零课开始
                  <Icon name="arrow" size={18} />
                </Link>
                <p className="door-note">
                  已经了解建模？可以直接学<Link to="/learn/linear-programming">线性规划</Link>。
                </p>
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
        <ol className="route-track" style={{ "--stops": route.length } as CSSProperties}>
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

      <section className="site-container home-roles" aria-labelledby="home-roles-title">
        <div>
          <p className="page-kicker">建模队伍分工探索 · 约 6–8 分钟</p>
          <h2 id="home-roles-title">不确定先学建模、编程还是论文？</h2>
          <p>
            在一个校园共享单车案例里做 9 个小任务，体验建模手、编程手、论文手分别做什么。结果分开列出你的兴趣、经验和任务表现，给出可以先尝试的方向和下一步练习，不贴人格标签。
          </p>
        </div>
        <Link className="btn btn-secondary home-roles-go" to="/learn/team-roles">
          找到你的建模起点
          <Icon name="arrow" size={16} />
        </Link>
      </section>

      <nav className="site-container home-links" aria-label="更多入口">
        <span>也可以直接去：</span>
        <Link to="/quest">七关实战</Link>
        <Link to="/library">资料中心</Link>
        <Link to="/library/skills">AI 技能包</Link>
        <Link to="/learn/reference">方法速查</Link>
        <Link to="/library/calendar">赛事日历</Link>
      </nav>
    </div>
  );
}
