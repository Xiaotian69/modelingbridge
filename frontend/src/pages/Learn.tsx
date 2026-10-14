import { Link, Navigate, useLocation } from "react-router-dom";
import { PageHead } from "../components/ui/PageHead";
import { modelMethods } from "../data/modelingContent";
import { courseByMethod } from "../learning/courses";

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

        <section className="learn-feature" aria-labelledby="learn-ahp">
          <div>
            <p className="page-kicker">已开放 · 第二门精讲 · 约 40–50 分钟</p>
            <h2 id="learn-ahp">层次分析法（AHP）：三份实习，怎样选得有理有据？</h2>
            <p>
              从一次真实的选择出发，画出层次结构，用两两比较构造判断矩阵，求权重、做一致性检验，再合成最终排序。课程里有可以动手改判断的矩阵实验。
            </p>
            <div className="page-head-actions">
              <Link className="btn btn-primary" to="/learn/ahp">
                开始 AHP 精讲
              </Link>
              <Link className="btn btn-secondary" to="/practice/ahp">
                AHP 专项练习
              </Link>
            </div>
          </div>
          <div className="learn-equation" aria-label="课程核心公式：A 乘 w 等于 λmax 乘 w，一致性比率 CR 等于 CI 除以 RI">
            <span>判断矩阵 · 权重 · 一致性</span>
            <b>Aw = λ<sub>max</sub>w</b>
            <span>CR = CI / RI &lt; 0.1</span>
          </div>
        </section>

        <section className="learn-feature" aria-labelledby="learn-topsis">
          <div>
            <p className="page-kicker">新开放 · 第三门精讲 · 约 45–55 分钟 · 建议先学 AHP</p>
            <h2 id="learn-topsis">TOPSIS 综合评价：五套房子，怎样排出先后？</h2>
            <p>
              接着 AHP 的故事：用 AHP 求出的权重给有数据的方案排序。学会指标方向、向量标准化、正负理想解和贴近度，再用熵权法和排名实验检验结论是否稳健。
            </p>
            <div className="page-head-actions">
              <Link className="btn btn-primary" to="/learn/topsis">
                开始 TOPSIS 精讲
              </Link>
              <Link className="btn btn-secondary" to="/practice/topsis">
                TOPSIS 专项练习
              </Link>
            </div>
          </div>
          <div className="learn-equation" aria-label="课程核心公式：贴近度 C 等于 D 减除以 D 加与 D 减之和">
            <span>标准化 · 理想解 · 贴近度</span>
            <b>
              C = D<sup>−</sup> / (D<sup>+</sup> + D<sup>−</sup>)
            </b>
            <span>AHP 定权重 · 数据定排名</span>
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
            </Link>{" "}
            <Link className="text-link" to="/practice/ahp">
              8 道 AHP 练习 →
            </Link>{" "}
            <Link className="text-link" to="/practice/topsis">
              12 道 TOPSIS 练习 →
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
                <Link to={courseByMethod(method.slug)?.lessonPath ?? `/learn/reference#model-${method.slug}`}>
                  <strong>{method.name}</strong>
                  <span className="muted-note">
                    {method.family} · {courseByMethod(method.slug) ? "精讲已开放" : "仅速查 · 精讲筹备中"}
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
