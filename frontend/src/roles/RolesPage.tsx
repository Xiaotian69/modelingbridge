import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  CASE,
  EXPERIENCE_AREAS,
  EXPERIENCE_LEVELS,
  INTEREST_MAX,
  INTERESTS,
  LIMITS,
  PREFERENCE_MAX,
  PREFERENCE_UNSURE,
  PREFERENCES,
  QUEST_LINK,
  ROLE_ORDER,
  ROLES,
  TASKS,
  type Experience,
  type Task,
  type TaskChart,
  type TaskTable,
} from "./content";
import { SUGGESTED, SUGGESTION_LABEL, SUGGESTION_REASON, summarize, taskOutcome, type Answers, type Outcome, type RoleEvidence, type TaskAnswer } from "./scoring";
import { clearState, freshState, loadState, saveState, STEP_COUNT, type RolesState, type Step } from "./storage";
import "./roles.css";

const TITLE = "找到你的建模起点 · 建模队伍分工探索 · 模桥";

export function RolesPage() {
  const [saved] = useState(loadState);
  const [state, setState] = useState<RolesState>(() => saved ?? freshState());
  /** 有未完成的进度时先停在介绍页，让用户选“继续”还是“重新开始”；做完了直接看结果。 */
  const [started, setStarted] = useState(() => saved?.step === "result");
  const [saveFailed, setSaveFailed] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  useEffect(() => {
    const previous = document.title;
    document.title = TITLE;
    return () => {
      document.title = previous;
    };
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo(0, 0);
    heading.current?.focus();
  }, [state.step, started]);

  const update = (next: RolesState) => {
    setState(next);
    setSaveFailed(!saveState(next));
  };
  const go = (step: Step) => update({ ...state, step });
  const setAnswers = (patch: Partial<Answers>) => update({ ...state, answers: { ...state.answers, ...patch } });
  const restart = () => {
    clearState();
    setState(freshState());
    setStarted(false);
    setSaveFailed(false);
  };
  const begin = () => {
    const fresh = freshState();
    update(fresh);
    setStarted(true);
  };

  if (!started) {
    const inProgress = state.step !== "result" && hasProgress(state.answers);
    return (
      <Intro
        heading={heading}
        progress={inProgress ? (state.step as number) + 1 : 0}
        onStart={begin}
        onResume={() => setStarted(true)}
      />
    );
  }

  if (state.step === "result") return <Result heading={heading} answers={state.answers} onRestart={restart} saveFailed={saveFailed} />;

  const step = state.step;
  const back = step > 0 ? () => go(step - 1) : undefined;
  const next = () => go(step + 1 < STEP_COUNT ? step + 1 : "result");

  return (
    <div className="roles-page">
      <div className="site-container roles-flow">
        <Progress step={step} onRestart={restart} saveFailed={saveFailed} />
        {step === 0 && (
          <ExperienceStep heading={heading} value={state.answers.experience} onChange={(experience) => setAnswers({ experience })} onNext={next} />
        )}
        {step === 1 && (
          <InterestStep heading={heading} value={state.answers.interests} onChange={(interests) => setAnswers({ interests })} onNext={next} onBack={back} />
        )}
        {step >= 2 && step < 2 + TASKS.length && (
          <TaskStep
            key={TASKS[step - 2].id}
            heading={heading}
            index={step - 2}
            task={TASKS[step - 2]}
            answer={state.answers.tasks[TASKS[step - 2].id]}
            onAnswer={(a) => setAnswers({ tasks: { ...state.answers.tasks, [TASKS[step - 2].id]: a } })}
            onNext={next}
            onBack={back}
          />
        )}
        {step === STEP_COUNT - 1 && (
          <PreferenceStep heading={heading} value={state.answers.preference} onChange={(preference) => setAnswers({ preference })} onNext={next} onBack={back} />
        )}
      </div>
    </div>
  );
}

const hasProgress = (a: Answers) =>
  Object.keys(a.experience).length > 0 || a.interests.length > 0 || Object.keys(a.tasks).length > 0 || a.preference.length > 0;

// ---------------------------------------------------------------------------

function Intro({ heading, progress, onStart, onResume }: { heading: React.RefObject<HTMLHeadingElement>; progress: number; onStart: () => void; onResume: () => void }) {
  return (
    <div className="roles-page">
      <div className="site-container roles-intro">
        <p className="page-kicker">建模队伍分工探索</p>
        <h1 ref={heading} tabIndex={-1}>
          找到你的建模起点
        </h1>
        <p className="roles-lead">
          数学建模比赛三人一队，常见分工是建模手、编程手和论文手。在一个校园案例里做 9 个小任务，分别体验三种分工在做什么，再决定先从哪里开始尝试。
        </p>

        <ul className="roles-cards" aria-label="三种分工">
          {ROLE_ORDER.map((role) => (
            <li key={role}>
              <h2>{ROLES[role].name}</h2>
              <p>{ROLES[role].does}</p>
            </li>
          ))}
        </ul>

        <ul className="roles-facts">
          <li>约 6–8 分钟，共 {STEP_COUNT} 步，无需注册。</li>
          <li>9 个小任务有参考答案，每题确认后就能看讲解；经验和兴趣的题没有对错。</li>
          <li>每个任务都可以选“暂时判断不了”，记作跳过，不算答错。</li>
          <li>进度只保存在这台设备的浏览器里，可以随时离开，回来接着做。</li>
        </ul>

        {progress > 0 ? (
          <div className="roles-resume" role="group" aria-label="上次的进度">
            <p>上次做到第 {progress} / {STEP_COUNT} 步。</p>
            <div className="roles-actions">
              <button type="button" className="btn btn-primary roles-big" onClick={onResume}>
                继续上次
              </button>
              <button type="button" className="btn btn-secondary roles-big" onClick={onStart}>
                重新开始
              </button>
            </div>
          </div>
        ) : (
          <div className="roles-actions">
            <button type="button" className="btn btn-primary roles-big" onClick={onStart}>
              开始探索
            </button>
          </div>
        )}

        <aside className="roles-diff" aria-label="和招新小游戏的区别">
          <h2>和 3 分钟招新小游戏有什么不同？</h2>
          <p>
            招新小游戏是趣味向，五道题后给你一张角色卡片。这里慢一些：兴趣、已有经验和任务表现分开记录；结果会写出本次的依据、还没观察到的部分和下一步练习，不贴固定标签，也可能同时建议几种分工。两边的记录互不影响。
          </p>
        </aside>
      </div>
    </div>
  );
}

const SAVE_FAILURE = "当前浏览器无法保存进度，本次仍可继续；离开或刷新后可能无法恢复。";

function Progress({ step, onRestart, saveFailed }: { step: number; onRestart: () => void; saveFailed: boolean }) {
  const section = step === 0 ? "已有经验" : step === 1 ? "兴趣" : step === STEP_COUNT - 1 ? "做完之后" : `小任务 ${step - 1} / ${TASKS.length}`;
  return (
    <div className="roles-progress">
      <div className="roles-progress-text">
        <span>
          第 {step + 1} / {STEP_COUNT} 步 · {section}
        </span>
        <button type="button" className="roles-text-btn" onClick={onRestart}>
          重新开始
        </button>
      </div>
      <div className="roles-bar" role="progressbar" aria-label="进度" aria-valuemin={1} aria-valuemax={STEP_COUNT} aria-valuenow={step + 1}>
        <span style={{ width: `${((step + 1) / STEP_COUNT) * 100}%` }} />
      </div>
      <p className={saveFailed ? "notice notice-warn" : "roles-saved"} role="status">
        {saveFailed ? SAVE_FAILURE : "进度已自动保存在本机，可以随时离开。"}
      </p>
    </div>
  );
}

function StepShell({ heading, kicker, title, children }: { heading: React.RefObject<HTMLHeadingElement>; kicker: string; title: ReactNode; children: ReactNode }) {
  return (
    <section className="roles-step" aria-labelledby="roles-step-title">
      <p className="page-kicker">{kicker}</p>
      <h1 id="roles-step-title" ref={heading} tabIndex={-1}>
        {title}
      </h1>
      {children}
    </section>
  );
}

function Nav({ onBack, children }: { onBack?: () => void; children: ReactNode }) {
  return (
    <div className="roles-nav">
      {onBack && (
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          上一步
        </button>
      )}
      {children}
    </div>
  );
}

function ExperienceStep({
  heading,
  value,
  onChange,
  onNext,
}: {
  heading: React.RefObject<HTMLHeadingElement>;
  value: Answers["experience"];
  onChange: (v: Answers["experience"]) => void;
  onNext: () => void;
}) {
  const done = ROLE_ORDER.every((r) => value[r]);
  return (
    <StepShell heading={heading} kicker="自评 · 没有对错" title="你接触过下面这些事吗？">
      <p className="roles-help">只是了解起点，不计入任务表现。没接触过很正常。</p>
      {ROLE_ORDER.map((role) => (
        <fieldset key={role} className="roles-fieldset">
          <legend>{EXPERIENCE_AREAS[role]}</legend>
          <div className="roles-chips">
            {EXPERIENCE_LEVELS.map((level) => (
              <label key={level.id} className={`roles-chip${value[role] === level.id ? " is-on" : ""}`}>
                <input
                  type="radio"
                  name={`exp-${role}`}
                  value={level.id}
                  checked={value[role] === level.id}
                  onChange={() => onChange({ ...value, [role]: level.id as Experience })}
                />
                <span>{level.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <Nav>
        <button type="button" className="btn btn-primary roles-big" disabled={!done} onClick={onNext}>
          {done ? "下一步" : "三项都选一个后继续"}
        </button>
      </Nav>
    </StepShell>
  );
}

function InterestStep({
  heading,
  value,
  onChange,
  onNext,
  onBack,
}: {
  heading: React.RefObject<HTMLHeadingElement>;
  value: string[];
  onChange: (v: string[]) => void;
  onNext: () => void;
  onBack?: () => void;
}) {
  const full = value.length >= INTEREST_MAX;
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : full ? value : [...value, id]);
  return (
    <StepShell heading={heading} kicker="兴趣 · 没有对错" title="比赛三天里，哪些事你愿意多花时间？">
      <p className="roles-help" id="interest-help">
        最多选 {INTEREST_MAX} 项，凭第一感觉就好；都不想选也可以直接下一步。
      </p>
      <fieldset className="roles-fieldset" aria-describedby="interest-help">
        <legend className="sr-only">愿意多花时间的事（最多 {INTEREST_MAX} 项）</legend>
        <div className="roles-options">
          {INTERESTS.map((o) => {
            const on = value.includes(o.id);
            return (
              <label key={o.id} className={`roles-option${on ? " is-on" : ""}${!on && full ? " is-off" : ""}`}>
                <input type="checkbox" checked={on} disabled={!on && full} onChange={() => toggle(o.id)} />
                <span>{o.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <p className="roles-count" aria-live="polite">
        已选 {value.length} / {INTEREST_MAX}
      </p>
      <Nav onBack={onBack}>
        <button type="button" className="btn btn-primary roles-big" onClick={onNext}>
          下一步：开始小任务
        </button>
      </Nav>
    </StepShell>
  );
}

const OUTCOME_HEAD: Record<Exclude<Outcome, "missing">, string> = {
  correct: "答对了",
  wrong: "和参考答案不同",
  skipped: "已记为“暂时判断不了”，不算答错",
};

function TaskStep({
  heading,
  index,
  task,
  answer,
  onAnswer,
  onNext,
  onBack,
}: {
  heading: React.RefObject<HTMLHeadingElement>;
  index: number;
  task: Task;
  answer?: TaskAnswer;
  onAnswer: (a: TaskAnswer) => void;
  onNext: () => void;
  onBack?: () => void;
}) {
  const [picked, setPicked] = useState<string[]>(() => (answer && "choice" in answer ? answer.choice : []));
  const outcome = taskOutcome(task, answer);
  const locked = outcome !== "missing";
  /** 确认后显示提交的选项；跳过时不显示任何“你的选择”。 */
  const shown = answer ? ("choice" in answer ? answer.choice : []) : picked;
  const limit = task.kind === "multi" ? task.answer.length : 1;
  const pick = (id: string) => {
    if (locked) return;
    if (task.kind === "single") setPicked([id]);
    else setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= limit ? p : [...p, id]));
  };
  const ready = task.kind === "single" ? picked.length === 1 : picked.length === limit;

  return (
    <StepShell heading={heading} kicker={`小任务 ${index + 1} · ${ROLES[task.role].name}`} title={task.prompt}>
      <details className="roles-case" open={index === 0}>
        <summary>案例：{CASE.title}</summary>
        <p>{CASE.story}</p>
        <p>
          <strong>{CASE.question}</strong>
        </p>
      </details>
      {task.tip && <p className="roles-tip">小贴士：{task.tip}</p>}
      {task.evidence && <blockquote className="roles-evidence">{task.evidence}</blockquote>}
      {task.table && <DataTable table={task.table} />}
      {task.chart && <BarChart chart={task.chart} />}

      <fieldset className="roles-fieldset" disabled={locked}>
        <legend className="sr-only">{task.kind === "multi" ? `选 ${limit} 项` : "选一项"}</legend>
        <div className="roles-options">
          {task.options.map((o) => {
            const on = shown.includes(o.id);
            const isKey = task.answer.includes(o.id);
            const mark = locked ? (isKey ? " is-key" : on ? " is-miss" : "") : "";
            return (
              <label key={o.id} className={`roles-option${on ? " is-on" : ""}${mark}`}>
                <input
                  type={task.kind === "single" ? "radio" : "checkbox"}
                  name={task.id}
                  checked={on}
                  disabled={!locked && !on && task.kind === "multi" && picked.length >= limit}
                  onChange={() => pick(o.id)}
                />
                <span>
                  {o.label}
                  {locked && (isKey || on) && (
                    <small className="roles-why">
                      {isKey ? "参考答案：" : "你的选择："}
                      {o.why}
                    </small>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {locked ? (
        <div className={`roles-feedback is-${outcome}`} role="status">
          <p className="roles-feedback-head">{OUTCOME_HEAD[outcome as Exclude<Outcome, "missing">]}</p>
          <p>{task.explain}</p>
        </div>
      ) : (
        task.kind === "multi" && <p className="roles-count">已选 {picked.length} / {limit}</p>
      )}

      <Nav onBack={onBack}>
        {locked ? (
          <button type="button" className="btn btn-primary roles-big" onClick={onNext}>
            下一步
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-primary roles-big" disabled={!ready} onClick={() => onAnswer({ choice: picked })}>
              确认答案
            </button>
            <button type="button" className="btn btn-secondary roles-big" onClick={() => onAnswer({ skipped: true })}>
              暂时判断不了
            </button>
          </>
        )}
      </Nav>
    </StepShell>
  );
}

function DataTable({ table }: { table: TaskTable }) {
  return (
    <div className="roles-table-wrap">
      <table className="roles-table">
        <caption>{table.caption}</caption>
        <thead>
          <tr>
            {table.head.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={String(row[0])}>
              {row.map((cell, i) => (i === 0 ? <th key={i} scope="row">{cell}</th> : <td key={i}>{cell}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 分组柱状图：每根柱子上直接标数值，图下面附同样数据的表格（读屏和看不清颜色时用）。 */
function BarChart({ chart }: { chart: TaskChart }) {
  const max = Math.max(...chart.series.flatMap((s) => s.values));
  const W = 320;
  const H = 180;
  const top = 18;
  const bottom = 34;
  const group = W / chart.categories.length;
  const bar = 22;
  const y = (v: number) => top + (H - top - bottom) * (1 - v / max);
  return (
    <figure className="roles-chart">
      <figcaption>{chart.caption}</figcaption>
      <ul className="roles-legend" aria-hidden="true">
        {chart.series.map((s, si) => (
          <li key={s.name}>
            <i className={`roles-swatch s${si}`} />
            {s.name}
          </li>
        ))}
      </ul>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${chart.caption}，数据见图下的“查看数据表”`}>
        <line x1="0" x2={W} y1={H - bottom} y2={H - bottom} className="roles-axis" />
        {chart.categories.map((c, ci) => {
          const x0 = ci * group + (group - bar * chart.series.length - 4) / 2;
          return (
            <g key={c}>
              {chart.series.map((s, si) => {
                const x = x0 + si * (bar + 4);
                const v = s.values[ci];
                return (
                  <g key={s.name}>
                    <rect x={x} y={y(v)} width={bar} height={H - bottom - y(v)} className={`roles-bar-${si}`} rx="2" />
                    <text x={x + bar / 2} y={y(v) - 4} textAnchor="middle" className="roles-val">
                      {v}
                    </text>
                  </g>
                );
              })}
              <text x={ci * group + group / 2} y={H - bottom + 16} textAnchor="middle" className="roles-cat">
                {c}
              </text>
            </g>
          );
        })}
      </svg>
      <details className="roles-chart-data">
        <summary>查看数据表</summary>
        <DataTable
          table={{
            caption: `${chart.caption}（表格）`,
            head: ["停车点", ...chart.categories],
            rows: chart.series.map((s) => [s.name, ...s.values]),
          }}
        />
      </details>
    </figure>
  );
}

function PreferenceStep({
  heading,
  value,
  onChange,
  onNext,
  onBack,
}: {
  heading: React.RefObject<HTMLHeadingElement>;
  value: string[];
  onChange: (v: string[]) => void;
  onNext: () => void;
  onBack?: () => void;
}) {
  const roles = value.filter((v) => v !== PREFERENCE_UNSURE);
  const toggle = (id: string) => {
    if (id === PREFERENCE_UNSURE) return onChange(value.includes(id) ? [] : [id]);
    const base = roles.includes(id) ? roles.filter((v) => v !== id) : roles.length >= PREFERENCE_MAX ? roles : [...roles, id];
    onChange(base);
  };
  return (
    <StepShell heading={heading} kicker="做完之后 · 没有对错" title="刚才三类小任务，哪类你最想再多做几道？">
      <p className="roles-help">最多选 {PREFERENCE_MAX} 项；“还说不清”也是一个有用的答案。</p>
      <fieldset className="roles-fieldset">
        <legend className="sr-only">最想再多做的任务类型</legend>
        <div className="roles-options">
          {PREFERENCES.map((p) => {
            const on = value.includes(p.id);
            const off = !on && p.id !== PREFERENCE_UNSURE && roles.length >= PREFERENCE_MAX;
            return (
              <label key={p.id} className={`roles-option${on ? " is-on" : ""}${off ? " is-off" : ""}`}>
                <input type="checkbox" checked={on} disabled={off} onChange={() => toggle(p.id)} />
                <span>{p.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <Nav onBack={onBack}>
        <button type="button" className="btn btn-primary roles-big" onClick={onNext}>
          看本次结果
        </button>
      </Nav>
    </StepShell>
  );
}

// ---------------------------------------------------------------------------

const EXP_LABEL: Record<Experience, string> = Object.fromEntries(EXPERIENCE_LEVELS.map((l) => [l.id, l.label])) as Record<Experience, string>;
const OUTCOME_MARK: Record<Outcome, string> = { correct: "答对", wrong: "答错", skipped: "跳过", missing: "未作答" };

function Result({ heading, answers, onRestart, saveFailed }: { heading: React.RefObject<HTMLHeadingElement>; answers: Answers; onRestart: () => void; saveFailed: boolean }) {
  const evidence = summarize(answers);
  const suggested = evidence.filter((e) => SUGGESTED.includes(e.suggestion));
  return (
    <div className="roles-page">
      <div className="site-container roles-result">
        <p className="page-kicker">建模队伍分工探索 · 本次结果</p>
        <h1 ref={heading} tabIndex={-1}>
          {suggested.length ? `可以先尝试：${suggested.map((e) => ROLES[e.role].name).join("、")}` : "本次没有哪个方向特别突出"}
        </h1>
        <p className="roles-lead">
          {suggested.length
            ? "下面按本次的作答，分别列出兴趣、经验和任务表现的依据。建议不是唯一答案：三种分工经常互相补位。"
            : "这很常见：只做 9 个短任务，本来就不一定看得出来。建议先学第零课，再把三类任务各练一次，过一段时间回来重做。"}
        </p>

        <div className="roles-evidence-list">
          {evidence.map((e) => (
            <RoleCard key={e.role} e={e} />
          ))}
        </div>

        <section className="roles-common" aria-labelledby="roles-common-title">
          <h2 id="roles-common-title">想看三种分工怎么配合？</h2>
          <p>七关实战里有同一个校园共享单车案例，从读题、拆解、数据、模型、代码、图表到论文结构走一遍，每一关都对应某个分工的工作。</p>
          <Link className="btn btn-primary" to={QUEST_LINK.to}>
            {QUEST_LINK.label}
          </Link>
          {!suggested.length && (
            <Link className="btn btn-secondary" to="/learn/introduction">
              第零课：认识数学建模
            </Link>
          )}
        </section>

        <p className="notice notice-warn">{LIMITS}</p>
        {saveFailed && <p className="notice notice-warn" role="status">{SAVE_FAILURE}</p>}
        <p className="roles-privacy">{saveFailed ? "本次结果未能保存。" : "结果只保存在这台设备的浏览器里。"}不会上传；不影响招新小游戏的结果和你的学习记录。</p>

        <div className="roles-actions">
          <button type="button" className="btn btn-secondary roles-big" onClick={onRestart}>
            重新开始（清除本次记录）
          </button>
          <Link className="btn btn-secondary roles-big" to="/">
            回到首页
          </Link>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ e }: { e: RoleEvidence }) {
  const info = ROLES[e.role];
  const titleId = `roles-card-${e.role}`;
  return (
    <section className={`roles-card is-${e.suggestion}`} aria-labelledby={titleId}>
      <header>
        <h2 id={titleId}>{info.name}</h2>
        <span className="roles-badge">{SUGGESTION_LABEL[e.suggestion]}</span>
      </header>
      <p className="roles-reason">{SUGGESTION_REASON[e.suggestion]}</p>
      <dl className="roles-dl">
        <dt>兴趣</dt>
        <dd>
          {e.interestPicks.length || e.preferred ? (
            <ul>
              {e.interestPicks.map((o) => (
                <li key={o.id}>愿意多花时间：{o.label}</li>
              ))}
              {e.preferred && <li>做完任务后，选了想再多做这类任务</li>}
            </ul>
          ) : (
            "本次没有选择这类事情。"
          )}
        </dd>
        <dt>已有经验（自述）</dt>
        <dd>{e.experience ? EXP_LABEL[e.experience] : "未填写"}</dd>
        <dt>任务表现</dt>
        <dd>
          <ul>
            {e.tasks.map(({ task, outcome }) => (
              <li key={task.id} className={`roles-out is-${outcome}`}>
                <b>{OUTCOME_MARK[outcome]}</b> {task.skill}
              </li>
            ))}
          </ul>
          <p className="roles-tally">
            3 题中答对 {e.correct}、答错 {e.wrong}、跳过 {e.skipped}。
          </p>
        </dd>
      </dl>
      {e.notes.map((n) => (
        <p key={n} className="roles-note">
          {n}
        </p>
      ))}
      <p className="roles-unobserved">
        <b>本次没有观察到：</b>
        {info.unobserved}
      </p>
      <div className="roles-practice">
        <h3>下一步小练习</h3>
        <p>{info.practice}</p>
        <ul>
          {info.links.map((l) => (
            <li key={l.to}>
              <Link className="text-link" to={l.to}>
                {l.label} →
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
