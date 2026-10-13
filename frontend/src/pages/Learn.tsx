import { Link, Navigate, useLocation } from "react-router-dom";
import { PageHead } from "../components/ui/PageHead";
import { modelMethods } from "../data/modelingContent";

/** 精讲目录 (design doc §3.3): one open lesson, method quick references, honest “筹备中”. */
export function LearnPage() {
  const { hash } = useLocation();
  if (hash === "#model-linear-programming")
    return <Navigate replace to="/learn/linear-programming" />;
  if (hash) return <Navigate replace to={`/learn/reference${hash}`} />;
  return (
    <div className="learn-page">
      <PageHead
        title="精讲目录"
        lead="先跟着完整例题学会方法，再用练习检验理解，最后走进开放的赛题。"
      />
      <div className="site-container">
        <section className="learn-feature" aria-labelledby="learn-lp">
          <div>
            <p className="page-kicker">已开放 · 约 45–60 分钟</p>
            <h2 id="learn-lp">线性规划：有限资源，怎样分配才更好？</h2>
            <p>
              陪一家加工坊安排一周生产。从变量与约束开始，亲手画出可行域，算出最优计划，再检验它是否可信。
            </p>
            <div className="page-head-actions">
              <Link className="btn btn-primary" to="/learn/linear-programming">
                开始精讲
              </Link>
              <Link className="btn btn-secondary" to="/practice/linear-programming">
                进入专项练习
              </Link>
              <Link className="btn btn-secondary" to="/learn/linear-programming/lab">
                交互实验室
              </Link>
            </div>
          </div>
          <div className="learn-equation" aria-label="课程例题：最大化 40x 加 50y，最优计划 A 40、B 20 平方米">
            <span>两种产品 · 两种资源 · 一个决策</span>
            <b>max 40x + 50y</b>
            <span>2x + y ≤ 100 · x + 2y ≤ 80</span>
          </div>
        </section>

        <section className="learn-modes" aria-label="三种学习方式">
          <article>
            <h2>精讲</h2>
            <p>连续阅读、手工推导、可操作图表。跟着一个问题，走完建模全过程。</p>
            <Link className="text-link" to="/learn/linear-programming">
              阅读线性规划 →
            </Link>
          </article>
          <article>
            <h2>刷题</h2>
            <p>按难度专项训练。错题诊断、分层提示、错题重练，记录保存在本机。</p>
            <Link className="text-link" to="/practice/linear-programming">
              6 道线性规划练习 →
            </Link>
          </article>
          <article>
            <h2>实战</h2>
            <p>七关训练：从读题走到论文框架，以开放任务练习独立建模。</p>
            <Link className="text-link" to="/quest">
              进入七关实战
            </Link>
          </article>
        </section>

        <section className="learn-methods" aria-labelledby="learn-methods">
          <div className="records-head">
            <h2 id="learn-methods">方法索引</h2>
            <Link className="text-link" to="/learn/reference#methods">
              全部方法速查 →
            </Link>
          </div>
          <ul>
            {modelMethods.map((method) => (
              <li key={method.slug}>
                <Link to={method.slug === "linear-programming" ? "/learn/linear-programming" : `/learn/reference#model-${method.slug}`}>
                  <strong>{method.name}</strong>
                  <span className="muted-note">
                    {method.family} · {method.slug === "linear-programming" ? "精讲已开放" : "仅速查 · 精讲筹备中"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
