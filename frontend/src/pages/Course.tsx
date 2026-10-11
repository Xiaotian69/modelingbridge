import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import katex from "katex";
import hljs from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";
import "../learning/learning.css";
import { sections, type Block } from "../learning/content";
import { Graph } from "../learning/Graph";
import { Question } from "../learning/Question";
import { publishedQuestions } from "../learning/questions";
import { readPosition, READING_KEY, save } from "../learning/storage";
hljs.registerLanguage("python", python);

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
                __html: hljs.highlight(block.text, { language: "python" })
                  .value,
              }}
            />
          </pre>
        </div>
      );
    case "graph":
      return <Graph />;
    case "question": {
      const q = publishedQuestions.find((q) => q.id === block.id);
      return q ? <Question question={q} /> : null;
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

export function CoursePage() {
  const { hash } = useLocation();
  const [active, setActive] = useState(sections[0].id);
  const [resume] = useState(() => readPosition(sections.map((s) => s.id)));
  const [saveError, setSaveError] = useState(false);
  const index = sections.findIndex((s) => s.id === active);
  useEffect(() => {
    const section = sections.find(s => `#${s.id}` === hash);
    if (section) document.getElementById(section.id)?.focus({ preventScroll: true });
  }, [hash]);
  useEffect(() => {
    let frame = 0;
    let last = "";
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const current = sections
          .filter(
            (s) =>
              (document.getElementById(s.id)?.getBoundingClientRect().top ??
                Infinity) < 180,
          )
          .at(-1)?.id;
        if (current && current !== last) {
          last = current;
          setActive(current);
          setSaveError(!save(READING_KEY, current));
        }
      });
    };
    // Save only once the reader scrolls; opening the chapter must not erase a saved breakpoint.
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      cancelAnimationFrame(frame);
    };
  }, []);
  const toc = (
    <nav aria-label="本章目录">
      {sections.map((s, i) => (
        <Link
          key={s.id}
          to={`#${s.id}`}
          aria-current={s.id === active ? "location" : undefined}
        >
          <span>{String(i + 1).padStart(2, "0")}</span>
          {s.title}
        </Link>
      ))}
    </nav>
  );
  return (
    <div className="course-shell">
      <div className="course-breadcrumb">
        <Link to="/learn">学习中心</Link>
        <span>/</span>
        <span>精讲 · 线性规划</span>
        <Link to="/practice/linear-programming">专项练习 →</Link>
      </div>
      <div className="course-layout">
        <aside className="course-toc">
          <p className="eyebrow">CHAPTER 01</p>
          <h2>线性规划</h2>
          <p>从问题到可验证的答案</p>
          {toc}
          <Link
            className="toc-reference"
            to="/learn/reference#model-linear-programming"
          >
            模型速查 ↗
          </Link>
        </aside>
        <article className="course-article">
          <header className="course-title">
            <p className="eyebrow">交互式教材 / 优化模型入门</p>
            <h1>
              有限资源，
              <br />
              怎样分配才更好？
            </h1>
            <p className="course-deck">用一份生产计划，学会线性规划。</p>
            <div className="course-meta">
              <span>零基础可读</span>
              <span>约 45–60 分钟</span>
              <span>纸笔 + Python</span>
            </div>
            <p>
              读完后，你将能独立定义变量、建立资源约束，手算并验证一个最优方案，解释参数变化和整数要求带来的影响。
            </p>
            {resume && (
              <Link className="resume-link" to={`#${resume}`}>
                继续上次阅读：{sections.find((s) => s.id === resume)?.title} →
              </Link>
            )}
          </header>
          <details className="mobile-toc">
            <summary>
              本章目录 · {index + 1}/{sections.length}
            </summary>
            {toc}
          </details>
          {saveError && <p role="alert" className="lesson-note">阅读位置保存失败，请使用章节链接保存书签。</p>}
          {sections.map((section, i) => (
            <section
              id={section.id}
              tabIndex={-1}
              className="lesson-section"
              key={section.id}
            >
              <p className="section-kicker">
                {String(i + 1).padStart(2, "0")} / {section.lead}
              </p>
              <h2>{section.title}</h2>
              {section.blocks.map((block, j) => (
                <ContentBlock key={j} block={block} />
              ))}
              <nav
                className="section-turn"
                aria-label={`${section.title}的节导航`}
              >
                {i > 0 ? (
                  <Link to={`#${sections[i - 1].id}`}>← 上一节</Link>
                ) : (
                  <span>第一节</span>
                )}
                {i < sections.length - 1 ? (
                  <Link to={`#${sections[i + 1].id}`}>下一节 →</Link>
                ) : (
                  <Link to="/practice/linear-programming">进入专项练习 →</Link>
                )}
              </nav>
            </section>
          ))}
          <footer className="course-end">
            <p className="eyebrow">现在，试着独立完成一次。</p>
            <h2>会看懂，也要会自己做。</h2>
            <p>三道递进练习，把“我理解了”变成可检验的结果。</p>
            <Link className="lesson-button" to="/practice/linear-programming">
              开始线性规划专项
            </Link>
            <Link className="lesson-button secondary" to="/quest">
              进入七关实战
            </Link>
            <p className="muted">
              这是首个样板章节。下一章尚未开放，先把这一章学扎实。
            </p>
          </footer>
        </article>
        <aside className="course-rail">
          <p className="eyebrow">本章阅读位置</p>
          <strong>
            {index + 1} <small>/ {sections.length}</small>
          </strong>
          <progress
            aria-label="阅读位置"
            max={sections.length}
            value={index + 1}
          />
          <p>{sections[index].title}</p>
          <hr />
          <p>随时记住</p>
          <dl>
            <dt>x / y</dt>
            <dd>A / B 产量，m²</dd>
            <dt>目标</dt>
            <dd>让贡献利润最大</dd>
            <dt>边界</dt>
            <dd>资源有限，产量非负</dd>
          </dl>
          <small>阅读位置自动保存在此浏览器，不代表知识掌握程度。</small>
        </aside>
      </div>
    </div>
  );
}
