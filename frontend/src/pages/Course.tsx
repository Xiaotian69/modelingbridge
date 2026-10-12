import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import katex from "katex";
import hljs from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";
import "../learning/reader.css";
import { sections, type Block } from "../learning/content";
import { Graph } from "../learning/Graph";
import { Checkpoint } from "../learning/Checkpoint";
import { publishedQuestions } from "../learning/questions";
import { exerciseMeta } from "../learning/exerciseMeta";
import { Icon } from "../components/ui/Icon";
import { learning, useLearning } from "../state/learning";
import { clearReturnTicket, readReturnTicket, type ReturnTicket } from "../state/returnTicket";
hljs.registerLanguage("python", python);

const PRACTICE = "/practice/linear-programming";
const QUEST_CASE = "/quest?case=optimization-dispatch-demo";

function ContentBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "p":
      return <p>{block.text}</p>;
    case "note":
      return <aside className="lesson-note">{block.text}</aside>;
    case "formula":
      return (
        <div
          className="lesson-formula"
          dangerouslySetInnerHTML={{
            __html: katex.renderToString(block.text, {
              displayMode: true,
              throwOnError: true,
              trust: false,
              output: "htmlAndMathml",
            }),
          }}
        />
      );
    case "table":
      return (
        <div className="table-scroll">
          <table>
            <caption>{block.caption}</caption>
            <thead>
              <tr>
                {block.headers.map((h) => (
                  <th scope="col" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "code":
      return (
        <div className="lesson-code">
          <span>Python · SciPy · 可在本机运行</span>
          <pre tabIndex={0} aria-label="完整 Python 求解代码">
            <code
              dangerouslySetInnerHTML={{
                __html: hljs.highlight(block.text, { language: "python" }).value,
              }}
            />
          </pre>
        </div>
      );
    case "graph":
      return <Graph />;
    case "question": {
      const q = publishedQuestions.find((q) => q.id === block.id);
      return q ? <Checkpoint question={q} /> : null;
    }
    case "links":
      return (
        <ul className="lesson-sources">
          {block.items.map((item) => (
            <li key={item.url}>
              <a href={item.url} target="_blank" rel="noreferrer">
                {item.label} ↗
              </a>
            </li>
          ))}
        </ul>
      );
  }
}

/** 回程条: back to the exercise the learner came from, with its state intact. */
function ReturnBar({ ticket, onDismiss }: { ticket: ReturnTicket; onDismiss: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="return-bar" role="region" aria-label="回到原题">
      <div className="site-container">
        <a
          href={ticket.from.path}
          className="return-link"
          onClick={(event) => {
            event.preventDefault();
            clearReturnTicket();
            navigate(ticket.from.path);
          }}
        >
          ← 回到 {ticket.from.label}
        </a>
        <span className="note">你的作答、尝试次数和提示进度都已保存</span>
        <button
          type="button"
          className="icon-button"
          aria-label="不再显示回程条（作答仍然保存）"
          onClick={onDismiss}
        >
          <Icon name="close" size={16} />
        </button>
      </div>
    </div>
  );
}

export function CoursePage() {
  const { hash } = useLocation();
  const { state, persistent } = useLearning();
  const [active, setActive] = useState(sections[0].id);
  // Captured once: opening the chapter must not overwrite where the learner stopped.
  const [resume] = useState(() => state.reading.lp?.lastSectionId ?? null);
  const [ticket, setTicket] = useState<ReturnTicket | null>(() => readReturnTicket());
  const [target, setTarget] = useState<string | null>(null);
  const [tocOpen, setTocOpen] = useState(true);
  const index = sections.findIndex((s) => s.id === active);
  const relatedPractice = useMemo(
    () =>
      publishedQuestions.filter(
        (q) => q.placement !== "inline" && exerciseMeta[q.id]?.sectionId === active,
      ),
    [active],
  );

  useEffect(() => {
    const section = sections.find((s) => `#${s.id}` === hash);
    if (!section) return;
    document.getElementById(section.id)?.focus({ preventScroll: true });
    // Arriving from an exercise: briefly highlight the section that answers it.
    if (ticket?.to.sectionId === section.id) {
      setTarget(section.id);
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const timer = window.setTimeout(() => setTarget(null), reduced ? 6000 : 2600);
      return () => window.clearTimeout(timer);
    }
  }, [hash, ticket]);

  useEffect(() => {
    let frame = 0;
    let last = "";
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const current = sections
          .filter((s) => (document.getElementById(s.id)?.getBoundingClientRect().top ?? Infinity) < 200)
          .at(-1)?.id;
        if (current && current !== last) {
          last = current;
          setActive(current);
          learning.setReading(current);
        }
      });
    };
    // Save only once the reader scrolls; opening the chapter must not erase a saved position.
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      cancelAnimationFrame(frame);
    };
  }, []);

  const toc = (
    <nav aria-label="本章目录">
      {sections.map((s, i) => (
        <Link key={s.id} to={`#${s.id}`} aria-current={s.id === active ? "location" : undefined}>
          <span>{String(i + 1).padStart(2, "0")}</span>
          {s.title}
        </Link>
      ))}
    </nav>
  );
  const resumeIndex = resume ? sections.findIndex((s) => s.id === resume) : -1;

  return (
    <div className={`reader-shell${ticket ? " has-return" : ""}`}>
      <div className="reader-top">
        <div className="site-container reader-top-inner">
          <nav className="crumbs" aria-label="位置">
            <Link to="/learn">精讲</Link>
            <span>/</span>
            <span>线性规划</span>
            <span>/</span>
            <span>
              {String(index + 1).padStart(2, "0")} {sections[index].title}
            </span>
          </nav>
          <div className="reading-progress" aria-label={`阅读位置 第 ${index + 1} 节，共 ${sections.length} 节`}>
            <span className="bar" aria-hidden="true">
              <i style={{ width: `${((index + 1) / sections.length) * 100}%` }} />
            </span>
            {index + 1}/{sections.length}
          </div>
        </div>
      </div>
      {ticket && (
        <ReturnBar
          ticket={ticket}
          onDismiss={() => {
            clearReturnTicket();
            setTicket(null);
          }}
        />
      )}
      <div className={`site-container reader-layout${tocOpen ? "" : " toc-collapsed"}`}>
        <aside className="reader-toc">
          {tocOpen ? (
            <>
              <p className="kicker">本章目录</p>
              {toc}
              <button type="button" className="icon-button toc-toggle" onClick={() => setTocOpen(false)}>
                ◀ 收起目录
              </button>
            </>
          ) : (
            <button
              type="button"
              className="icon-button"
              aria-label="展开本章目录"
              onClick={() => setTocOpen(true)}
            >
              ▶
            </button>
          )}
        </aside>

        <article className="reader-article">
          <header className="topic-cover">
            <p className="kicker">精讲 · 优化模型入门 · 线性规划</p>
            <h1>
              有限资源，
              <br />
              怎样分配才更好？
            </h1>
            <p className="deck">用一份生产计划，学会线性规划。</p>
            <div className="topic-meta">
              <span>零基础可读</span>
              <span>约 45–60 分钟</span>
              <span>纸笔 + Python</span>
              <span>先修：一次方程（可跳过）</span>
            </div>
            <p className="topic-goal">
              读完后，你将能独立定义变量、建立资源约束，手算并验证一个最优方案，解释参数变化和整数要求带来的影响。
            </p>
            <div className="topic-actions">
              {resumeIndex >= 0 ? (
                <>
                  <Link className="btn btn-primary" to={`#${resume}`}>
                    继续第 {resumeIndex + 1} 节：{sections[resumeIndex].title}
                  </Link>
                  <Link className="btn btn-secondary" to={`#${sections[0].id}`}>
                    从头开始
                  </Link>
                </>
              ) : (
                <Link className="btn btn-primary" to={`#${sections[0].id}`}>
                  开始阅读
                </Link>
              )}
              <Link className="btn btn-secondary" to={PRACTICE}>
                专项练习（{publishedQuestions.filter((q) => q.placement !== "inline").length} 题）
              </Link>
              <Link className="btn btn-secondary" to={QUEST_CASE}>
                竞赛应用：七关实战
              </Link>
              <span className="later">进阶拓展（筹备中）</span>
            </div>
          </header>
          <details className="mobile-toc">
            <summary>
              本章目录 · {index + 1}/{sections.length}
            </summary>
            {toc}
          </details>
          {!persistent && (
            <p role="alert" className="inline-alert">
              此浏览器不允许本地保存：阅读位置和作答在关闭页面后会丢失。
            </p>
          )}
          {sections.map((section, i) => (
            <section
              id={section.id}
              tabIndex={-1}
              className={`lesson-section${target === section.id ? " is-target" : ""}`}
              key={section.id}
              aria-labelledby={`${section.id}-title`}
            >
              <p className="kicker">
                {String(i + 1).padStart(2, "0")} / {section.lead}
              </p>
              <h2 id={`${section.id}-title`}>{section.title}</h2>
              {section.blocks.map((block, j) => (
                <ContentBlock key={j} block={block} />
              ))}
              <nav className="section-turn" aria-label={`${section.title}的节导航`}>
                {i > 0 ? <Link to={`#${sections[i - 1].id}`}>← 上一节</Link> : <span>第一节</span>}
                {i < sections.length - 1 ? (
                  <Link to={`#${sections[i + 1].id}`}>下一节 →</Link>
                ) : (
                  <Link to={PRACTICE}>进入专项练习 →</Link>
                )}
              </nav>
            </section>
          ))}
          <footer className="course-end">
            <p className="kicker">现在，试着独立完成一次。</p>
            <h2>会看懂，也要会自己做。</h2>
            <p>专项练习提交后判分，答错会告诉你错在哪里、该回看哪一节，但不会直接给出答案。</p>
            <div className="topic-actions">
              <Link className="btn btn-primary" to={PRACTICE}>
                开始线性规划专项
              </Link>
              <Link className="btn btn-secondary" to={QUEST_CASE}>
                用七关实战做一道调度题
              </Link>
            </div>
            <p className="muted-note">这是首个样板章节。下一章尚未开放，先把这一章学扎实。</p>
          </footer>
        </article>

        <aside className="reader-margin" aria-label="页边注">
          <p className="kicker">符号表</p>
          <dl>
            <dt>x</dt>
            <dd>A 产量，m²</dd>
            <dt>y</dt>
            <dd>B 产量，m²</dd>
            <dt>z</dt>
            <dd>贡献利润，元</dd>
          </dl>
          <hr />
          <p className="kicker">本节相关练习</p>
          {relatedPractice.length ? (
            <ul>
              {relatedPractice.map((q) => (
                <li key={q.id}>
                  <Link to={`${PRACTICE}/${q.id}`}>
                    {q.knowledge}（{q.difficulty}）
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>本节没有单独的练习。</p>
          )}
          <hr />
          <p>阅读位置自动保存在此浏览器，不代表掌握程度。</p>
        </aside>
      </div>
    </div>
  );
}
