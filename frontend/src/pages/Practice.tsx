import { useState } from "react";
import { Link } from "react-router-dom";
import { Question } from "../learning/Question";
import { publishedQuestions } from "../learning/questions";
import { readHistory } from "../learning/storage";
import "../learning/learning.css";
const bank = publishedQuestions.filter((q) => q.placement !== "inline");
export function PracticePage() {
  const [difficulty, setDifficulty] = useState("全部");
  const [wrongOnly, setWrongOnly] = useState(false);
  const [history, setHistory] = useState(readHistory);
  const [round, setRound] = useState(0);
  // Freeze a retry set until the next filter action so submitting does not abruptly hide its explanation.
  const [retryIds, setRetryIds] = useState<string[]>([]);
  const filtered = bank.filter(
    (q) =>
      (difficulty === "全部" || q.difficulty === difficulty) &&
      (!wrongOnly || retryIds.includes(q.id)),
  );
  const wrong = bank.filter((q) => history[q.id] && !history[q.id].correct);
  const correct = bank.filter((q) => history[q.id]?.correct).length;
  function retry() {
    setRetryIds(wrong.map((q) => q.id));
    setWrongOnly(true);
    setRound(round + 1);
  }
  return (
    <div className="practice-page">
      <header>
        <Link to="/learn">← 学习中心</Link>
        <p className="eyebrow">专项训练 / LINEAR PROGRAMMING</p>
        <h1>把理解，变成解题能力。</h1>
        <p>三道递进专项 + 三道章节自测。可以慢慢想，提示始终在这里。</p>
      </header>
      <div className="practice-layout">
        <aside className="practice-sidebar">
          <label>
            选择模型
            <select value="linear-programming" onChange={() => {}}>
              <option value="linear-programming">线性规划（已开放）</option>
            </select>
          </label>
          <label>
            难度
            <select
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                setRound(round + 1);
              }}
            >
              {["全部", "基础", "进阶", "挑战"].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <div className="practice-stats">
            <strong>
              {correct} / {bank.length}
            </strong>
            <p>最近一次作答正确</p>
            <p>待重练 {wrong.length} 题</p>
          </div>
          <button
            className="lesson-button secondary"
            onClick={() => {
              setWrongOnly(false);
              setRound(round + 1);
            }}
          >
            全部题目
          </button>
          <button className="lesson-button" onClick={retry}>
            错题重练
          </button>
          <small>
            学习记录仅在此浏览器保存。当前为已核验静态题库，无在线 AI 出题。
          </small>
          <Link to="/learn/linear-programming">回到精讲 →</Link>
        </aside>
        <div className="practice-questions">
          <div className="practice-heading">
            <h2>{wrongOnly ? "错题重练" : "线性规划题库"}</h2>
            <span>{filtered.length} 题</span>
          </div>
          {!filtered.length && (
            <p className="lesson-note">
              当前筛选下没有待练题目。可以切换难度或返回全部题目。
            </p>
          )}
          {filtered.map((q) => (
            <section key={`${q.id}-${round}`}>
              <p className="eyebrow">
                {q.placement === "practice" ? "专项练习" : "章节自测"} · {q.id}
              </p>
              <Question
                question={q}
                onAttempt={() => setHistory(readHistory())}
              />
            </section>
          ))}
          <p className="muted">
            开放性建模报告请到七关实战完成；本题库只对明确可核验的客观题判分。
          </p>
        </div>
      </div>
    </div>
  );
}
