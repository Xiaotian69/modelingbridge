import { Link, Navigate, useLocation } from "react-router-dom";
import { PageHead } from "../components/ui/PageHead";
import { modelMethods } from "../data/modelingContent";
import { courseById, courseByMethod, sectionIndex, type LessonId } from "../learning/courses";
import { useLearning } from "../state/learning";

/** 学习路线：三条线，每条线内按先后排列。第一门推荐线性规划（例题最完整，有交互实验室）。 */
const TRACKS: { id: string; name: string; question: string; courses: LessonId[]; note: string }[] = [
  { id: "optimize", name: "优化", question: "有限的资源、路线、安排，怎样选最好？", courses: ["lp", "graph"], note: "图论不依赖线性规划，也可以单独学" },
  { id: "predict", name: "预测", question: "根据已有数据，估计未来会怎样？", courses: ["regression"], note: "预测的结果常常交给优化模型做决策" },
  { id: "evaluate", name: "评价", question: "多个方案、多项指标，怎样排出先后？", courses: ["ahp", "topsis"], note: "TOPSIS 要用到 AHP 求出的权重，建议按顺序学" },
];

/** One line of local progress for a course; only what this browser has stored. */
function Progress({ id }: { id: LessonId }) {
  const { state } = useLearning();
  const course = courseById(id);
  const reading = state.reading[id];
  if (!reading) return <span className="learn-progress">未开始</span>;
  if (reading.visited.length >= course.sections.length) return <span className="learn-progress is-done">已读完全部 {course.sections.length} 节</span>;
  return (
    <Link className="learn-progress is-reading" to={`${course.lessonPath}#${reading.lastSectionId}`}>
      上次读到第 {sectionIndex(course, reading.lastSectionId) + 1} 节 · 继续
    </Link>
  );
}

function StartGuide() {
  return (
    <section className="learn-start" aria-labelledby="learn-start-title">
      <div className="learn-start-head">
        <h2 id="learn-start-title">从哪里开始</h2>
        <p>
          五门精讲都从零讲起，不需要先修课。第一次来，建议先学<Link to="/learn/linear-programming">线性规划</Link>
          ：例题最完整，还有交互实验室；之后按兴趣挑一条线学下去，最后到<Link to="/quest">七关实战</Link>完整走一道题。
        </p>
      </div>
      <ol className="learn-tracks">
        {TRACKS.map((t) => (
          <li key={t.id}>
            <p className="learn-track-name">
              <b>{t.name}</b>
              <span>{t.question}</span>
            </p>
            <ol className="learn-track-courses">
              {t.courses.map((id) => (
                <li key={id}>
                  <Link to={courseById(id).lessonPath}>{courseById(id).title}</Link>
                  <Progress id={id} />
                </li>
              ))}
            </ol>
            <p className="muted-note">{t.note}</p>
          </li>
        ))}
      </ol>
      <p className="muted-note">学习进度只保存在此浏览器。阅读位置不代表掌握程度，可以用专项练习检验。</p>
    </section>
  );
}

const Group = ({ name, text }: { name: string; text: string }) => (
  <p className="learn-group">
    <b>{name}</b>
    <span>{text}</span>
  </p>
);

/** 精讲目录 (design doc §3.3): open lessons grouped by track, method quick references, honest “筹备中”. */
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
        <StartGuide />

        <Group name="优化" text="线性规划 · 图论与网络优化" />
        <section className="learn-feature" aria-labelledby="learn-lp">
          <div>
            <p className="page-kicker">优化 · 建议第一门 · 约 45–60 分钟</p>
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

        <section className="learn-feature" aria-labelledby="learn-graph">
          <div>
            <p className="page-kicker">优化 · V3.0 新开放 · 约 45–55 分钟 · 先修：无</p>
            <h2 id="learn-graph">图论与网络优化：招新日，怎么走最近、怎么连最省？</h2>
            <p>
              把校园地图抽象成赋权图，写出邻接矩阵，一步一步运行 Dijkstra 算法求最短路、Kruskal 算法求最小生成树，再用道路施工情景检验结论是否稳定。
            </p>
            <div className="page-head-actions">
              <Link className="btn btn-primary" to="/learn/graph">
                开始图论精讲
              </Link>
              <Link className="btn btn-secondary" to="/practice/graph">
                图论专项练习
              </Link>
            </div>
          </div>
          <div className="learn-equation" aria-label="课程核心公式：松弛 d(v) 取 d(v) 与 d(u) 加 w(u,v) 中的较小者；生成树有 n 减 1 条边">
            <span>顶点 · 边 · 权</span>
            <b>d(v) ← min(d(v), d(u) + w)</b>
            <span>最小生成树：n − 1 条边，总长最小</span>
          </div>
        </section>

        <Group name="预测" text="回归分析" />
        <section className="learn-feature" aria-labelledby="learn-regression">
          <div>
            <p className="page-kicker">预测 · V3.0 新开放 · 约 50–60 分钟 · 先修：无</p>
            <h2 id="learn-regression">回归分析：明天卖多少杯，怎样估计才靠谱？</h2>
            <p>
              用一家奶茶店两周的数据，从散点图、相关系数走到最小二乘、R² 与残差图，再用虚拟变量建立多元回归，做出带区间的预测，并认清相关与因果、外推和异常值的边界。
            </p>
            <div className="page-head-actions">
              <Link className="btn btn-primary" to="/learn/regression">
                开始回归精讲
              </Link>
              <Link className="btn btn-secondary" to="/practice/regression">
                回归专项练习
              </Link>
            </div>
          </div>
          <div className="learn-equation" aria-label="课程核心公式：y 帽等于 b0 加 b1 x，最小二乘使残差平方和最小">
            <span>散点图 · 最小二乘 · 残差</span>
            <b>
              ŷ = b<sub>0</sub> + b<sub>1</sub>x
            </b>
            <span>min Σ(y − ŷ)² · R² = 1 − SSE/SST</span>
          </div>
        </section>

        <Group name="评价" text="层次分析法 → TOPSIS（按顺序学）" />
        <section className="learn-feature" aria-labelledby="learn-ahp">
          <div>
            <p className="page-kicker">评价 · 约 40–50 分钟 · 先修：无</p>
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
            <p className="page-kicker">评价 · V3.0 新开放 · 约 45–55 分钟 · 建议先学 AHP</p>
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
            <Link className="text-link" to="/practice/graph">
              15 道图论练习 →
            </Link>{" "}
            <Link className="text-link" to="/practice/regression">
              15 道回归练习 →
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
                    {method.family} ·{" "}
                    {courseByMethod(method.slug) ? `精讲已开放：${courseByMethod(method.slug)!.title}` : "仅速查 · 精讲筹备中"}
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
