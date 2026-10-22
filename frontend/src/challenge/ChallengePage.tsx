import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Brand } from "../components/ui/Brand";
import { DISCLAIMER, event, q1, q2, q3, q4, q5, results, society, type Dimension, type ResultId } from "./config";
import { computeResult, type Answers } from "./scoring";
import { freshState, loadState, saveState, type ChallengeState, type Step } from "./storage";
import { loadAnalytics, sourceFrom, track } from "./analytics";
import { MEAL_OPTIMUM } from "./meal";
import { Celebration } from "./Celebration";
import { Q1Canteen, Q2Meal, Q3Courses, Q4Library, Q5Fermi } from "./questions";
import "./challenge.css";

const TITLE = "3 分钟测出你是建模队里的哪种人 · 模桥";
const TITLES = [q1.title, q2.title, q3.title, q4.title, q5.title];
const TOTAL = 5;

export function ChallengePage() {
  const { search } = useLocation();
  const src = useRef(sourceFrom(search)).current;
  const [state, setState] = useState<ChallengeState>(loadState);
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  /** 刚答完最后一题时才放庆祝动画；刷新、查看上次结果都不放。每次完成换一个值，动画状态随之重置。 */
  const [celebration, setCelebration] = useState(0);

  useEffect(() => {
    const previous = document.title;
    document.title = TITLE;
    loadAnalytics();
    track("challenge_enter", { src });
    return () => {
      document.title = previous;
    };
  }, [src]);

  useEffect(() => saveState(state), [state]);

  // 每换一屏：回到顶部，把焦点交给标题（读屏用户知道换题了）
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo(0, 0);
    heading.current?.focus();
  }, [state.step]);

  const go = (step: Step) => setState((s) => ({ ...s, step }));
  const answer = <K extends keyof Answers>(key: K, value: Answers[K]) =>
    setState((s) => ({ ...s, answers: { ...s.answers, [key]: value } }));

  const start = () => {
    track("challenge_start", { src });
    setCelebration(0);
    setState({ ...freshState(), step: 1 });
  };
  const finish = () => {
    let result: ResultId;
    try {
      result = computeResult(state.answers as Answers).id;
    } catch {
      setState({ ...freshState(), step: 1 }); // 本机存的答案不完整：从头再来
      return;
    }
    track("challenge_complete", { src, result });
    setCelebration((c) => c + 1);
    setState((s) => ({ ...s, step: "result", result }));
  };
  const next = (n: number) => (n === TOTAL ? finish() : go((n + 1) as Step));

  if (state.step === "intro") return <Intro onStart={start} heading={heading} src={src} previous={state.result} onShowPrevious={() => go("result")} />;
  if (state.step === "result" && state.result)
    return <ResultView key={celebration} celebrate={celebration > 0} id={state.result} answers={state.answers as Answers} heading={heading} src={src} onRestart={start} />;

  const n = state.step as number;
  const a = state.answers;
  const common = { onNext: () => next(n), last: n === TOTAL };
  return (
    <div className="cg">
      <header className="cg-top">
        <Link to="/" className="cg-brand" aria-label="模桥首页">
          <Brand />
        </Link>
        <span className="cg-count-label">
          第 {n} / {TOTAL} 题
        </span>
      </header>
      <div className="cg-progress" role="progressbar" aria-label="答题进度" aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={n - 1}>
        <i style={{ width: `${((n - 1) / TOTAL) * 100}%` }} />
      </div>
      <main className="cg-main" key={n}>
        <h1 className="cg-q-title" ref={heading} tabIndex={-1}>
          {TITLES[n - 1]}
        </h1>
        {n === 1 && <Q1Canteen value={a.q1} onAnswer={(v) => answer("q1", v)} {...common} />}
        {n === 2 && <Q2Meal value={a.q2} onAnswer={(v) => answer("q2", v)} {...common} />}
        {n === 3 && <Q3Courses value={a.q3} onAnswer={(v) => answer("q3", v)} {...common} />}
        {n === 4 && <Q4Library value={a.q4} onAnswer={(v) => answer("q4", v)} {...common} />}
        {n === 5 && <Q5Fermi value={a.q5} onAnswer={(v) => answer("q5", v)} {...common} />}
        {n > 1 && (
          <button type="button" className="cg-back" onClick={() => go((n - 1) as Step)}>
            ← 上一题
          </button>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------

function RoleIcon({ kind }: { kind: "M" | "C" | "W" }) {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" className="cg-role-icon">
      {kind === "M" && <path d="M8 38 C16 38 18 10 26 10 S34 30 40 22" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />}
      {kind === "C" && <path d="M17 14 7 24l10 10M31 14l10 10-10 10M27 10l-6 28" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
      {kind === "W" && <path d="M12 8h18l8 8v24H12zM30 8v8h8M18 24h14M18 31h10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />}
    </svg>
  );
}

function Intro({ onStart, heading, src, previous, onShowPrevious }: { onStart: () => void; heading: React.RefObject<HTMLHeadingElement>; src: string; previous?: ResultId; onShowPrevious: () => void }) {
  return (
    <div className="cg cg-intro">
      <header className="cg-top">
        <Link to="/" className="cg-brand" aria-label="模桥首页">
          <Brand />
        </Link>
      </header>
      <main className="cg-main">
        {event.active && <p className="cg-pill">{event.lottery ? event.lotteryNote : event.activeNote}</p>}
        <h1 className="cg-hero-title" ref={heading} tabIndex={-1}>
          3 分钟，测出你是
          <br />
          建模队里的哪种人
        </h1>
        <p className="cg-hero-sub">数学建模比赛三人一队。建模手？编程手？论文手？</p>
        <ul className="cg-roles" aria-label="三种角色">
          <li>
            <RoleIcon kind="M" />
            建模手
          </li>
          <li>
            <RoleIcon kind="C" />
            编程手
          </li>
          <li>
            <RoleIcon kind="W" />
            论文手
          </li>
        </ul>
        <button type="button" className="cg-btn cg-btn-mint cg-start" onClick={onStart}>
          开始挑战
        </button>
        <p className="cg-meta">5 道题 · 约 3 分钟 · 无需注册 · 没有标准答案</p>
        <Link to={`/?src=${encodeURIComponent(src)}`} className="cg-btn cg-home-entry">
          直接进入网站主页
        </Link>
        {previous && (
          <p className="cg-meta">
            你上次的结果：{results[previous].role} · {results[previous].tag}{" "}
            <button type="button" className="cg-link" onClick={onShowPrevious}>
              查看
            </button>
          </p>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 部分微信内置浏览器没有 Clipboard API：退回到选中复制
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

const DIM_LABEL: Record<Dimension, string> = { M: "建模", C: "编程", W: "写作" };

function SocietyPanel({ id, onCopy }: { id: ResultId; onCopy: () => void }) {
  return (
    <div className="cg-society" id="cg-society">
      <p className="cg-society-lead">{society.lead}</p>
      {society.groups.map((g) => (
        <section key={g.status} className={`cg-society-group is-${g.status}`} aria-label={g.label}>
          <h3>
            {g.label}
            <span>{g.note}</span>
          </h3>
          <ul>
            {g.items.map((item) => {
              const mine = item.roles?.includes(id);
              return (
                <li key={item.title} className={mine ? "is-mine" : undefined}>
                  <span className="cg-society-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <div>
                    <strong>
                      {item.title}
                      {mine && <em>适合你</em>}
                    </strong>
                    <p>{item.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <button type="button" className="cg-btn cg-btn-primary cg-society-cta" onClick={onCopy}>
        复制招新群号，进群了解
      </button>
      <p className="cg-society-foot">{society.footnote}</p>
    </div>
  );
}

function ResultView({ id, answers, heading, src, onRestart, celebrate }: { id: ResultId; answers: Answers; heading: React.RefObject<HTMLHeadingElement>; src: string; onRestart: () => void; celebrate: boolean }) {
  const r = results[id];
  const { totals } = computeResult(answers);
  const sum = totals.M + totals.C + totals.W || 1;
  const [copied, setCopied] = useState<"" | "ok" | "fail">("");
  const [open, setOpen] = useState(false);
  const wechat = typeof navigator !== "undefined" && /MicroMessenger/i.test(navigator.userAgent);
  const meal = answers.q2;
  const [ox, oy] = MEAL_OPTIMUM.point;

  const copy = async () => {
    track("challenge_copy_group", { src, result: id });
    setCopied((await copyText(event.qqGroup)) ? "ok" : "fail");
  };
  const toggleSociety = () => {
    if (!open) track("challenge_society_open", { src, result: id });
    setOpen((o) => !o);
  };
  const courseClick = () => track("challenge_course_click", { src, result: id });
  const introClick = () => track("challenge_course_click", { src, result: id, target: "intro" });

  return (
    <div className="cg cg-result">
      <header className="cg-top">
        <Link to="/" className="cg-brand" aria-label="模桥首页">
          <Brand />
        </Link>
        <button type="button" className="cg-link cg-restart" onClick={onRestart}>
          再测一次
        </button>
      </header>
      <main className="cg-main">
        <div className={`cg-card-wrap${celebrate ? " is-celebrating" : ""}`}>
          {celebrate && <Celebration />}
          {celebrate && (
            <p className="cg-done" aria-hidden="true">
              挑战完成
            </p>
          )}
          <section className="cg-card" aria-labelledby="cg-role">
            <p className="cg-card-kicker">我在建模队里是</p>
            <h1 id="cg-role" className="cg-card-role" ref={heading} tabIndex={-1}>
              {r.role}
              <span> · {r.tag}</span>
            </h1>
            <p className="cg-card-line">{r.line}</p>
            <p className="cg-card-detail">{r.detail}</p>
            <p className="cg-bars-label">这次答题的思考倾向</p>
            <div className="cg-bars">
              {(["M", "C", "W"] as Dimension[]).map((d) => {
                const pct = Math.round((totals[d] / sum) * 100);
                return (
                  <div key={d} className="cg-bar">
                    <span>{DIM_LABEL[d]}</span>
                    <div className="cg-meter-track" aria-hidden="true">
                      <i style={{ width: `${pct}%` }} />
                    </div>
                    <b>{pct}%</b>
                  </div>
                );
              })}
            </div>
            <p className="cg-card-partner">
              最佳搭档：<strong>{r.partner}</strong>
              {r.partner !== "任何人" ? "，拉个室友测测？" : "——哪个位置缺人你都能顶上"}
            </p>
            <p className="cg-card-foot">
              {event.societyName} · 模桥 ModelingBridge
              <br />
              www.modelingbridge.cc/challenge
            </p>
          </section>
        </div>

        <p className="cg-save">📸 截图保存这张卡片{event.active && event.lottery ? event.lotteryHint : "，发给室友比一比"}</p>

        <div className="cg-actions">
          <section className="cg-action cg-join">
            <h2>{event.active ? `加入${event.societyName}` : `关注${event.societyName}`}</h2>
            <p>{event.active ? r.societyHook : event.afterNote}</p>
            {event.active && <p className="cg-join-note">{event.joinNote}</p>}
            <div className="cg-qq-row">
              <div>
                <small>{event.groupName}</small>
                <p className="cg-qq" aria-label={`${event.groupName}群号 ${event.qqGroup.split("").join(" ")}`}>
                  {event.qqGroup}
                </p>
              </div>
              <button type="button" className="cg-btn cg-btn-primary" onClick={copy}>
                复制群号
              </button>
            </div>
            {copied === "ok" && (
              <p className="cg-ok" role="status">
                已复制招新群号，打开 QQ 搜索即可
              </p>
            )}
            {copied === "fail" && (
              <p className="cg-warn" role="status">
                没复制成功，请长按上面的群号手动复制
              </p>
            )}
            <button type="button" className={`cg-disclose${open ? " is-open" : ""}`} aria-expanded={open} aria-controls="cg-society" onClick={toggleSociety}>
              <span className="cg-disclose-text">
                <strong>{society.title}</strong>
                <small>学建模 · 找队友 · 一起比赛</small>
              </span>
              <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
                <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {open && <SocietyPanel id={id} onCopy={copy} />}
          </section>
          <section className="cg-action">
            <h2>继续探索</h2>
            <p>{r.course.hint}</p>
            <Link to={r.course.to} className="cg-btn cg-btn-primary" onClick={courseClick}>
              {r.course.label} →
            </Link>
            <p className="cg-zero">
              第一次接触数学建模？
              <Link to="/learn/introduction?from=challenge" onClick={introClick}>
                从第零课开始 →
              </Link>
            </p>
          </section>
        </div>

        {meal && (
          <p className="cg-callback">
            {meal.optimal
              ? `第 2 题你找到的“荤 ${ox} 串 + 素 ${oy} 串”就是线性规划的最优解。为什么它总在可行区域的角上？`
              : `第 2 题你拿到了 ${MEAL_OPTIMUM.value} 分里的 ${meal.meat * q2.meat.full + meal.veg * q2.veg.full} 分，离最优解只差一步。`}{" "}
            <Link to="/learn/linear-programming?from=challenge#geometry" onClick={courseClick}>
              30 秒看看为什么 →
            </Link>
          </p>
        )}

        <p className="cg-tip">{wechat ? "点右上角 ··· 选“在浏览器打开”，下次直接继续学。" : "收藏这个网站，下次直接继续学。"}</p>
        <p className="cg-fine">{DISCLAIMER}</p>
      </main>
    </div>
  );
}
