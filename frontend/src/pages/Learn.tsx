import { Link, Navigate, useLocation } from "react-router-dom";
import "../learning/learning.css";
export function LearnPage() {
  const { hash } = useLocation();
  if (hash === "#model-linear-programming")
    return <Navigate replace to="/learn/linear-programming" />;
  if (hash) return <Navigate replace to={`/learn/reference${hash}`} />;
  return (
    <div className="learning-home">
      <header className="learning-intro">
        <p className="eyebrow">MODELINGBRIDGE / 学习中心</p>
        <h1>
          从看懂一个问题，
          <br />
          到独立完成一个模型。
        </h1>
        <p>先跟着完整例题学会方法，再用练习检验理解，最后走进开放的赛题。</p>
      </header>
      <section className="learning-feature">
        <div>
          <p className="eyebrow">01 / 首个精讲样板 · 约 45–60 分钟</p>
          <h2>
            线性规划
            <br />
            <span>有限资源，怎样分配才更好？</span>
          </h2>
          <p>
            陪一家加工坊安排一周生产。从变量与约束开始，亲手画出可行域，算出最优计划，再检验它是否可信。
          </p>
          <Link className="lesson-button" to="/learn/linear-programming">
            开始精讲
          </Link>
        </div>
        <div
          className="feature-equation"
          aria-label="课程例题：最大化 40x 加 50y，最优计划 A 40、B 20 平方米"
        >
          <span>两种产品 · 两种资源 · 一个决策</span>
          <b>max 40x + 50y</b>
          <div className="feature-lines">
            <i />
            <i />
            <i />
          </div>
          <p>理解每一个式子从哪里来。</p>
        </div>
      </section>
      <section className="learning-modes" aria-label="三种学习模式">
        <article>
          <span className="mode-number">A</span>
          <h2>精讲模式</h2>
          <p>连续阅读、手工推导、可操作图表。跟着一个问题，走完建模全过程。</p>
          <Link to="/learn/linear-programming">阅读线性规划 →</Link>
        </article>
        <article>
          <span className="mode-number">B</span>
          <h2>刷题模式</h2>
          <p>按难度专项训练。逐步提示、提交解析、错题重练，记录保存在本机。</p>
          <Link to="/practice/linear-programming">进入专项练习</Link>
        </article>
        <article>
          <span className="mode-number">C</span>
          <h2>赛题实战模式</h2>
          <p>保留七关训练。从问题分析走到论文表达，以开放任务练习独立建模。</p>
          <Link to="/quest">进入七关实战</Link>
        </article>
      </section>
      <footer className="learning-bottom">
        <div>
          <h2>已经学过，想快速查一查？</h2>
          <p>
            模型条件、输入输出与近年题目资料仍然保留。其他模型的精讲将在样板确认后逐步建设。
          </p>
        </div>
        <Link className="lesson-button secondary" to="/learn/reference">
          模型速查与资料 →
        </Link>
      </footer>
    </div>
  );
}
