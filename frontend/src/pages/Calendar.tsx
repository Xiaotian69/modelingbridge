import { useMemo, useState } from "react";
import { generateContestPlan } from "../api/client";
import { contestCalendar, type ContestEvent } from "../data/modelingContent";
import type { ContestPlanOutput, ProviderId, StudentLevel } from "../types";

const valueTone = {
  核心: "border-emerald-200 bg-emerald-50 text-emerald-800",
  高: "border-cyan-200 bg-cyan-50 text-cyan-800",
  训练: "border-amber-200 bg-amber-50 text-amber-800",
  关注: "border-slate-200 bg-slate-100 text-slate-700",
};

const statusTone = {
  已确认: "bg-emerald-50 text-emerald-800",
  需核验: "bg-amber-50 text-amber-800",
  暂停: "bg-slate-100 text-slate-600",
};

const categories = ["全部", "核心赛", "练手赛", "专项赛", "研究生赛", "中学生赛"] as const;

export function CalendarPage() {
  const [category, setCategory] = useState<(typeof categories)[number]>("全部");
  const [activeSlug, setActiveSlug] = useState(contestCalendar[0]?.slug ?? "");
  const [plannedSlugs, setPlannedSlugs] = useState<string[]>(["wuyi", "cumcm"]);
  const [studentLevel, setStudentLevel] = useState<StudentLevel>("beginner");
  const [weeklyHours, setWeeklyHours] = useState(8);
  const [goal, setGoal] = useState("从小白开始，先参加练手赛，再准备国赛");
  const [teamStatus, setTeamStatus] = useState("还没稳定组队");
  const [strengths, setStrengths] = useState("愿意学 Python，能每周固定训练");
  const [weaknesses, setWeaknesses] = useState("读题和模型选择不熟，论文也没写过");
  const [provider, setProvider] = useState<ProviderId>("deepseek");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<ContestPlanOutput | null>(null);
  const [planError, setPlanError] = useState("");

  const visibleEvents = useMemo(
    () => contestCalendar.filter((item) => category === "全部" || item.category === category).sort((a, b) => a.month - b.month),
    [category],
  );
  const active = contestCalendar.find((item) => item.slug === activeSlug) ?? contestCalendar[0];
  const plannedEvents = plannedSlugs.map((slug) => contestCalendar.find((item) => item.slug === slug)).filter(Boolean) as ContestEvent[];

  function togglePlan(slug: string) {
    setPlannedSlugs((prev) => (prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug]));
  }

  async function onGeneratePlan() {
    const selected = plannedEvents.map((event) => ({
      slug: event.slug,
      name: event.name,
      month: event.month,
      period: event.period,
      registration: event.registration,
      contestTime: event.contestTime,
      valueLevel: event.valueLevel,
      category: event.category,
      status: event.status,
      fit: event.fit,
      prepFocus: event.prepFocus,
    }));
    setLoading(true);
    setPlanError("");
    try {
      const result = await generateContestPlan({
        student_level: studentLevel,
        weekly_hours: weeklyHours,
        goal,
        team_status: teamStatus,
        strengths,
        weaknesses,
        selected_contests: selected,
        provider,
      });
      setPlan(result);
    } catch (e) {
      setPlan(buildLocalPlan(plannedEvents, { studentLevel, weeklyHours, goal }));
      setPlanError(e instanceof Error ? `大模型规划暂不可用，已生成本地兜底计划：${e.message}` : "大模型规划暂不可用，已生成本地兜底计划。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hairline-grid">
      <section className="premium-shell">
        <div className="relative mx-auto max-w-7xl px-4 py-14 text-white">
          <p className="inline-flex rounded-md border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-100">
            Contest Planner
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            赛事日历 + AI 备赛规划
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
            先点开赛事看详情，把目标赛和练手赛加入规划，再填写个人基础。系统会按小白/进阶/冲刺水平，生成一套可执行的备赛路线。
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 lg:grid-cols-[1fr_0.86fr]">
        <div className="space-y-5">
          <div className="quiet-card rounded-3xl p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bridge-700">Calendar</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">选择赛事加入规划</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={[
                      "rounded-full border px-3 py-1.5 text-sm font-semibold transition",
                      category === item ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-bridge-400",
                    ].join(" ")}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {visibleEvents.map((item) => {
                const selected = plannedSlugs.includes(item.slug);
                const opened = active.slug === item.slug;
                return (
                  <article
                    key={item.slug}
                    className={[
                      "interactive-card rounded-2xl border bg-white p-4",
                      opened ? "border-slate-950" : "border-slate-200",
                    ].join(" ")}
                  >
                    <button type="button" className="block w-full text-left" onClick={() => setActiveSlug(item.slug)}>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={`rounded-full border px-2 py-0.5 font-semibold ${valueTone[item.valueLevel]}`}>{item.valueLevel}</span>
                        <span className={`rounded-full px-2 py-0.5 font-semibold ${statusTone[item.status]}`}>{item.status}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{item.period}</span>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-slate-950">{item.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.fit}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePlan(item.slug)}
                      disabled={item.status === "暂停"}
                      className={[
                        "mt-4 rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45",
                        selected ? "bg-slate-950 text-white" : "border border-slate-300 bg-white text-slate-800 hover:border-bridge-400",
                      ].join(" ")}
                    >
                      {selected ? "已加入规划" : item.status === "暂停" ? "今年暂停" : "加入规划"}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>

          {active && (
            <div className="quiet-card rounded-3xl p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bridge-700">Detail</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">{active.name}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => togglePlan(active.slug)}
                  disabled={active.status === "暂停"}
                  className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-45"
                >
                  {plannedSlugs.includes(active.slug) ? "移出规划" : "加入规划"}
                </button>
              </div>
              <dl className="mt-5 grid gap-3 md:grid-cols-2">
                <Info label="报名" value={active.registration} />
                <Info label="比赛" value={active.contestTime} />
                <Info label="适合" value={active.fit} />
                <Info label="提醒" value={active.note} />
              </dl>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <TagBlock title="训练重点" items={active.prepFocus} />
                <TagBlock title="推荐人群" items={active.recommendedFor} />
              </div>
              <a
                href={active.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:border-bridge-400"
              >
                查看来源：{active.sourceName}
              </a>
            </div>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="quiet-card rounded-3xl p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bridge-700">My Plan</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">我的备赛画像</h2>
            <div className="mt-5 grid gap-4">
              <label className="text-sm font-semibold text-slate-700">
                当前水平
                <select className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" value={studentLevel} onChange={(e) => setStudentLevel(e.target.value as StudentLevel)}>
                  <option value="beginner">小白：没完整参赛过</option>
                  <option value="intermediate">进阶：会 Python 或做过训练题</option>
                  <option value="advanced">冲刺：有完整参赛经验</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">
                每周可投入小时
                <input className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" type="number" min={1} max={80} value={weeklyHours} onChange={(e) => setWeeklyHours(Number(e.target.value))} />
              </label>
              <Field label="目标" value={goal} onChange={setGoal} />
              <Field label="组队情况" value={teamStatus} onChange={setTeamStatus} />
              <Field label="优势" value={strengths} onChange={setStrengths} />
              <Field label="短板" value={weaknesses} onChange={setWeaknesses} />
              <label className="text-sm font-semibold text-slate-700">
                分析模型
                <select className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2" value={provider} onChange={(e) => setProvider(e.target.value as ProviderId)}>
                  <option value="deepseek">DeepSeek</option>
                  <option value="mimo">Xiaomi MiMo</option>
                </select>
              </label>
            </div>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-950">已加入规划</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {plannedEvents.length === 0 && <span className="text-sm text-slate-500">先从左侧选择赛事</span>}
                {plannedEvents.map((event) => (
                  <button key={event.slug} type="button" onClick={() => togglePlan(event.slug)} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700">
                    {event.name}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={onGeneratePlan}
              disabled={loading || plannedEvents.length === 0}
              className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-45"
            >
              {loading ? "正在分析..." : "生成 AI 备赛计划"}
            </button>
            {planError && <p className="mt-3 text-xs leading-5 text-amber-700">{planError}</p>}
          </div>

          {plan && <PlanResult plan={plan} />}
        </aside>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
      <dt className="text-xs font-semibold text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-slate-700">{value}</dd>
    </div>
  );
}

function TagBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
      <p className="text-xs font-semibold text-slate-400">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <textarea className="mt-1 min-h-20 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function PlanResult({ plan }: { plan: ContestPlanOutput }) {
  return (
    <div className="quiet-card rounded-3xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-slate-950">备赛计划</h2>
        <span className="rounded-full bg-bridge-50 px-3 py-1 text-xs font-semibold text-bridge-800">
          {plan.mode === "llm" ? `AI · ${plan.provider}` : "本地兜底"}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{plan.summary}</p>
      <Section title="推荐路径" items={plan.recommended_path} />
      <div className="mt-5 space-y-3">
        <p className="text-sm font-semibold text-slate-950">阶段安排</p>
        {plan.monthly_plan.map((item) => (
          <article key={`${item.month}-${item.focus}`} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-950">{item.month}</h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{item.focus}</span>
            </div>
            <ul className="mt-3 space-y-1 text-sm leading-6 text-slate-600">
              {item.tasks.map((task) => (
                <li key={task}>· {task}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs font-semibold text-bridge-800">产物：{item.deliverable}</p>
          </article>
        ))}
      </div>
      <Section title="每周节奏" items={plan.weekly_rhythm} />
      <Section title="风险提醒" items={plan.risk_notes} tone="amber" />
      <Section title="下一步" items={plan.next_actions} />
    </div>
  );
}

function Section({ title, items, tone = "slate" }: { title: string; items: string[]; tone?: "slate" | "amber" }) {
  return (
    <div className={`mt-5 rounded-2xl border p-4 ${tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-950" : "border-slate-200 bg-white text-slate-700"}`}>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-2 space-y-1 text-sm leading-6">
        {items.map((item) => (
          <li key={item}>· {item}</li>
        ))}
      </ul>
    </div>
  );
}

function buildLocalPlan(
  events: ContestEvent[],
  profile: { studentLevel: StudentLevel; weeklyHours: number; goal: string },
): ContestPlanOutput {
  const sorted = [...events].sort((a, b) => a.month - b.month);
  const first = sorted[0]?.name ?? "练手赛";
  const core = sorted.find((item) => item.valueLevel === "核心");
  const beginner = profile.studentLevel === "beginner";
  return {
    mode: "demo",
    provider: "local",
    summary: `围绕「${profile.goal}」，建议先用 ${first} 建立完整流程，再把训练成果迁移到 ${core?.name ?? "目标核心赛"}。`,
    recommended_path: [
      beginner ? "小白先补读题、数据清洗、基础模型和论文结构，不建议一上来冲核心赛。" : "已有基础可以把训练重心放在模型检验、代码复现和论文表达。",
      "至少选择 1 个练手赛做全流程演练，再准备 1 个核心赛。",
      "每次比赛后保存 AI 使用记录、代码目录和论文复盘清单。",
    ],
    monthly_plan: [
      { month: "第 1-2 周", focus: "基础补齐", tasks: ["学习线性规划/TOPSIS/时间序列", "完成 1 道简化例题", "整理队伍分工"], deliverable: "个人能力诊断和模型清单" },
      { month: "第 3-4 周", focus: "练手赛演练", tasks: [`围绕 ${first} 做模拟`, "限时完成开题和模型选择", "输出一份训练报告"], deliverable: "训练报告 + 代码目录" },
      { month: "核心赛前", focus: "专项冲刺", tasks: ["补短板模型", "做论文合稿演练", "检查报名和规则"], deliverable: "备赛包和最终 checklist" },
    ],
    weekly_rhythm: profile.weeklyHours <= 6 ? ["每周 1 次模型学习", "每周 1 次代码复现", "周末写复盘"] : ["每周 2 次模型/代码训练", "每周 1 次论文互评", "每两周 1 次限时模拟"],
    risk_notes: ["赛事时间需官网核验", "不要用 AI 代写论文", "小白队伍要避免赛事过密导致复盘不足"],
    next_actions: ["先确认目标核心赛", "从学习页完成三张基础模型卡", "用 AI 工作台跑一遍训练样题"],
  };
}
