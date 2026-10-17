import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import katex from "katex";
import hljs from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";
import "./reader.css";
import type { Block } from "./content";
import { Checkpoint } from "./Checkpoint";
import { findQuestion, metaForQuestion, practiceBankOf } from "./courseBanks";
import type { LessonId } from "./courses";
import { Icon } from "../components/ui/Icon";
import { duration } from "../design/motion";
import { learning, useLearning } from "../state/learning";
import { clearReturnTicket, readReturnTicket, type ReturnTicket } from "../state/returnTicket";
hljs.registerLanguage("python", python);

export type ReaderSection<B> = { id: string; title: string; lead: string; blocks: B[] };

/** Everything that differs between courses; the reader itself is shared (精讲阅读器). */
export type LessonDefinition<B> = {
  lesson: LessonId;
  /** Breadcrumb / short name, e.g. “线性规划”. */
  name: string;
  sections: ReaderSection<B>[];
  /** Renders course-specific blocks (interactive labs, diagrams); return undefined for shared ones. */
  renderExtra?: (block: B) => ReactNode | undefined;
  codeLabel: string;
  cover: { kicker: string; title: ReactNode; deck: string; meta: string[]; goal: string };
  /**
   * Method courses have a practice bank, a contest application and the default ending.
   * 第零课 has none of them: it passes `endSlot` (and `coverActions`) instead.
   */
  practicePath?: string;
  application?: { to: string; label: string; endLabel: string };
  end?: { title: string; text: string; practiceLabel: string; note: string };
  /** Replaces the default ending (practice call to action). */
  endSlot?: ReactNode;
  /** Extra buttons on the cover, after 开始阅读 / 继续. */
  coverActions?: ReactNode;
  /** Heading of the margin list, “符号表” by default. */
  marginTitle?: string;
  symbols: [string, string][];
  /** Optional extra content at the end of a section (e.g. the LP lab entry). */
  afterSection?: (sectionId: string) => ReactNode;
};

function SharedBlock({ block, codeLabel }: { block: Block; codeLabel: string }) {
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
          <span>{codeLabel}</span>
          <pre tabIndex={0} aria-label="完整 Python 求解代码">
            <code
              dangerouslySetInnerHTML={{
                __html: hljs.highlight(block.text, { language: "python" }).value,
              }}
            />
          </pre>
        </div>
      );
    case "question": {
      const q = findQuestion(block.id);
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
    default:
      return null;
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
            // Land where the learner left the exercise (RouteScroll), not at the top.
            navigate(ticket.from.path, { state: { restore: ticket.from.restore } });
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

export function LessonReader<B extends { type: string }>({ def }: { def: LessonDefinition<B> }) {
  const { sections, lesson } = def;
  const { hash } = useLocation();
  const { state, persistent } = useLearning();
  const [active, setActive] = useState(sections[0].id);
  // Captured once: opening the chapter must not overwrite where the learner stopped.
  const [resume] = useState(() => state.reading[lesson]?.lastSectionId ?? null);
  // A ticket from another course's exercise belongs to that course's reader.
  const [ticket, setTicket] = useState<ReturnTicket | null>(() => {
    const t = readReturnTicket();
    return t && (t.to.lessonId ?? "lp") === lesson ? t : null;
  });
  const [target, setTarget] = useState<string | null>(null);
  const [tocOpen, setTocOpen] = useState(true);
  const index = sections.findIndex((s) => s.id === active);
  const bank = useMemo(() => (def.practicePath ? practiceBankOf(lesson) : []), [lesson, def.practicePath]);
  const relatedPractice = useMemo(
    () => bank.filter((q) => metaForQuestion(q.id).sectionId === active),
    [active, bank],
  );

  useEffect(() => {
    const section = sections.find((s) => `#${s.id}` === hash);
    if (!section) return;
    document.getElementById(section.id)?.focus({ preventScroll: true });
    // Arriving from an exercise: briefly highlight the section that answers it.
    if (ticket?.to.sectionId === section.id) {
      setTarget(section.id);
      // Animated glow lasts page-enter + highlight; reduced motion keeps a static outline longer.
      const ms = duration("page") + duration("highlight");
      const timer = window.setTimeout(() => setTarget(null), ms ? ms + 100 : 6000);
      return () => window.clearTimeout(timer);
    }
  }, [hash, ticket, sections]);

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
          learning.setReading(current, lesson);
        }
      });
    };
    // Save only once the reader scrolls; opening the chapter must not erase a saved position.
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      cancelAnimationFrame(frame);
    };
  }, [sections, lesson]);

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
  const render = (block: B) => {
    const extra = def.renderExtra?.(block);
    return extra !== undefined ? extra : <SharedBlock block={block as unknown as Block} codeLabel={def.codeLabel} />;
  };

  return (
    <div className={`reader-shell${ticket ? " has-return" : ""}`}>
      <div className="reader-top">
        <div className="site-container reader-top-inner">
          <nav className="crumbs" aria-label="位置">
            <Link to="/learn">精讲</Link>
            <span>/</span>
            <span>{def.name}</span>
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
            <p className="kicker">{def.cover.kicker}</p>
            <h1>{def.cover.title}</h1>
            <p className="deck">{def.cover.deck}</p>
            <div className="topic-meta">
              {def.cover.meta.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
            <p className="topic-goal">{def.cover.goal}</p>
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
              {def.coverActions}
              {def.practicePath && (
                <Link className="btn btn-secondary" to={def.practicePath}>
                  专项练习（{bank.length} 题）
                </Link>
              )}
              {def.application && (
                <Link className="btn btn-secondary" to={def.application.to}>
                  {def.application.label}
                </Link>
              )}
              {def.practicePath && <span className="later">进阶拓展（筹备中）</span>}
            </div>
            {lesson !== "intro" && (
              <p className="topic-intro-link">
                第一次接触数学建模？可以先读第零课<Link to="/learn/introduction">「认识数学建模」</Link>，约 15–20 分钟。
              </p>
            )}
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
                <Fragment key={j}>{render(block)}</Fragment>
              ))}
              {def.afterSection?.(section.id)}
              <nav className="section-turn" aria-label={`${section.title}的节导航`}>
                {i > 0 ? <Link to={`#${sections[i - 1].id}`}>← 上一节</Link> : <span>第一节</span>}
                {i < sections.length - 1 ? (
                  <Link to={`#${sections[i + 1].id}`}>下一节 →</Link>
                ) : def.practicePath ? (
                  <Link to={def.practicePath}>进入专项练习 →</Link>
                ) : (
                  <Link to="/learn">回到精讲目录 →</Link>
                )}
              </nav>
            </section>
          ))}
          {def.endSlot ? (
            <footer className="course-end">{def.endSlot}</footer>
          ) : (
            def.end &&
            def.practicePath &&
            def.application && (
              <footer className="course-end">
                <p className="kicker">现在，试着独立完成一次。</p>
                <h2>{def.end.title}</h2>
                <p>{def.end.text}</p>
                <div className="topic-actions">
                  <Link className="btn btn-primary" to={def.practicePath}>
                    {def.end.practiceLabel}
                  </Link>
                  <Link className="btn btn-secondary" to={def.application.to}>
                    {def.application.endLabel}
                  </Link>
                </div>
                <p className="muted-note">{def.end.note}</p>
              </footer>
            )
          )}
        </article>

        <aside className="reader-margin" aria-label="页边注">
          <p className="kicker">{def.marginTitle ?? "符号表"}</p>
          <dl>
            {def.symbols.map(([term, meaning]) => (
              <SymbolRow key={term} term={term} meaning={meaning} />
            ))}
          </dl>
          {def.practicePath && (
            <>
              <hr />
              <p className="kicker">本节相关练习</p>
              {relatedPractice.length ? (
                <ul>
                  {relatedPractice.map((q) => (
                    <li key={q.id}>
                      <Link to={`${def.practicePath}/${q.id}`}>
                        {q.knowledge}（{q.difficulty}）
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>本节没有单独的练习。</p>
              )}
            </>
          )}
          <hr />
          <p>阅读位置自动保存在此浏览器，不代表掌握程度。</p>
        </aside>
      </div>
    </div>
  );
}

function SymbolRow({ term, meaning }: { term: string; meaning: string }) {
  return (
    <>
      <dt>{term}</dt>
      <dd>{meaning}</dd>
    </>
  );
}
