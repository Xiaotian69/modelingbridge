import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { LpLab } from "../learning/lab/LpLab";
import { LP_SECTION_IDS, sectionNumber, sectionTitle } from "../learning/sectionIds";
import "../learning/reader.css";
import "../learning/lab/lab.css";

const LESSON = "/learn/linear-programming";

/**
 * 线性规划交互实验室. Opened from a lesson section it offers the way back: browser history
 * when the learner came straight from the lesson (lands on the exact reading position),
 * otherwise the section anchor named in ?from=.
 */
export function LpLabPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const from = params.get("from");
  const section = from && LP_SECTION_IDS.includes(from) ? from : null;
  const cameFromLesson = (location.state as { fromLesson?: boolean } | null)?.fromLesson === true;
  const backLabel = section ? `回到第 ${sectionNumber(section)} 节「${sectionTitle(section)}」` : "回到线性规划精讲";

  return (
    <div className="practice-shell lab-page">
      <div className="site-container">
        <header className="practice-head">
          <nav className="crumbs" aria-label="位置">
            <Link to="/learn">精讲</Link>
            <span>/</span>
            <Link to={LESSON}>线性规划</Link>
            <span>/</span>
            <span>交互实验室</span>
          </nav>
          <h1>线性规划交互实验室</h1>
          <p className="practice-summary">
            <span>调整利润和资源约束，可行域、最优点和最优值会实时重新计算。</span>
          </p>
          <p className="lab-back">
            {cameFromLesson && section ? (
              <button type="button" className="link-button" onClick={() => navigate(-1)}>
                ← {backLabel}
              </button>
            ) : (
              <Link to={section ? `${LESSON}#${section}` : LESSON}>← {backLabel}</Link>
            )}
          </p>
        </header>
        <LpLab />
        <p className="muted-note lab-footnote">
          实验室只用于探索二维问题：两种产品、两种资源，外加一个可选的订单要求。课程中的例题、练习和判分不受这里的操作影响。
        </p>
      </div>
    </div>
  );
}
