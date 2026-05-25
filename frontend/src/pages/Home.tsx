import { Link } from "react-router-dom";
import { contestCalendar, learningTracks, modelMethods } from "../data/modelingContent";

const studioStats = [
  { label: "闯关关卡", value: "7 关" },
  { label: "模型方法", value: `${modelMethods.length} 类` },
  { label: "训练副本", value: "8 个" },
  { label: "学习记录", value: "可导出" },
];

const workflow = [
  { title: "读题", desc: "识别目标、约束、小问关系" },
  { title: "选模", desc: "把 AI 建议接到模型方法卡" },
  { title: "编码", desc: "按数据流搭代码框架" },
  { title: "检验", desc: "误差、约束、灵敏度复盘" },
  { title: "成文", desc: "写结构，不代写终稿" },
];

export function HomePage() {
  const coreContests = contestCalendar.filter((item) => item.valueLevel === "核心").slice(0, 2);

  return (
    <div className="hairline-grid">
      <section className="premium-shell">
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div className="animate-rise text-white">
            <p className="inline-flex rounded-md border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-100">
              免费试运行 · 数模闯关训练营
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
              像通关一样，走完一次数学建模
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200">
              模桥把一道题拆成读题、拆问、数据、模型、代码、图表和论文框架 7 个关卡。AI 只当教练，给提示和检查；每一关都需要你写下自己的判断，最后生成学习复盘报告。
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <ModeLink to="/quest" eyebrow="Quest Mode" title="开始数模闯关" desc="围绕一道题完成读题、拆问、数据、模型、代码、图表和论文框架。" />
              <ModeLink to="/cases" eyebrow="Training Cases" title="选择训练副本" desc="从经典案例进入闯关，不追求题量，先把一题做深。" />
            </div>
          </div>

          <div className="glass-panel animate-rise animate-float-subtle rounded-3xl p-5" style={{ animationDelay: "120ms" }}>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">Model Map</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">模型关背后的学习地图</h2>
                </div>
                <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-semibold text-emerald-100">可点击</span>
              </div>
              <div className="mt-5 grid gap-3">
                {modelMethods.slice(0, 5).map((method, index) => (
                  <Link
                    key={method.slug}
                    to={`/learn#model-${method.slug}`}
                    className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 transition hover:bg-white/[0.14]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-xs font-bold text-slate-950">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-white">{method.name}</p>
                        <p className="text-xs text-slate-300">{method.family} · {method.level}</p>
                      </div>
                    </div>
                    <span className="text-sm text-emerald-100 transition group-hover:translate-x-1">学习</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-3 sm:grid-cols-4">
          {studioStats.map((item) => (
            <div key={item.label} className="quiet-card rounded-2xl p-4">
              <p className="text-xs font-semibold text-slate-400">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="quiet-card rounded-3xl p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bridge-700">Roadmap</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">学习底图仍然保留</h2>
            </div>
            <Link to="/learn" className="text-sm font-semibold text-bridge-700 hover:underline">
              查看学习卡
            </Link>
          </div>
          <div className="mt-6 grid gap-3">
            {learningTracks.map((track) => (
              <article key={track.title} className="interactive-card rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-slate-950">{track.title}</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{track.duration}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{track.focus}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {track.steps.map((step) => (
                    <span key={step} className="soft-badge rounded-full px-2.5 py-1 text-xs text-slate-600">
                      {step}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="quiet-card rounded-3xl p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bridge-700">Workflow</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">一次完整闯关产物</h2>
            </div>
            <Link to="/records" className="text-sm font-semibold text-bridge-700 hover:underline">
              查看记录
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-5">
            {workflow.map((item, index) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold text-bridge-700">0{index + 1}</p>
                <h3 className="mt-3 font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            闯关报告用于学习复盘。AI 只做拆解、解释、路线建议和检查；论文最终表达、数据来源核验和结论判断仍由学生完成。
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="quiet-card rounded-3xl p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bridge-700">Methods</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">基础模型方法库</h2>
            </div>
            <Link to="/learn#methods" className="text-sm font-semibold text-bridge-700 hover:underline">
              全部方法
            </Link>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {modelMethods.slice(0, 4).map((method) => (
              <Link key={method.slug} to={`/learn#model-${method.slug}`} className="interactive-card rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-slate-950">{method.name}</h3>
                  <span className="rounded-full bg-bridge-50 px-2 py-0.5 text-xs font-semibold text-bridge-800">{method.family}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{method.when}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="quiet-card rounded-3xl p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bridge-700">Calendar</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">核心赛事提醒</h2>
            </div>
            <Link to="/calendar" className="text-sm font-semibold text-bridge-700 hover:underline">
              完整日历
            </Link>
          </div>
          <div className="mt-6 space-y-3">
            {coreContests.map((contest) => (
              <article key={contest.slug} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-slate-950">{contest.name}</h3>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">{contest.valueLevel}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{contest.contestTime}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ModeLink({ to, eyebrow, title, desc }: { to: string; eyebrow: string; title: string; desc: string }) {
  return (
    <Link to={to} className="interactive-card rounded-2xl border border-white/14 bg-white/[0.1] p-5 text-white hover:bg-white/[0.16]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">{eyebrow}</p>
      <h2 className="mt-3 text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-200">{desc}</p>
    </Link>
  );
}
