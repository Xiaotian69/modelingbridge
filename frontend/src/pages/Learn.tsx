import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { classicProblems, codingTips, getClassicProblemPracticeLink, learningTracks, modelMethods, recentTrainingCases, writingTips } from "../data/modelingContent";

const tabs = ["全部", "预测", "优化", "评价", "统计", "机理", "网络"] as const;

export function LearnPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("全部");
  const filtered = useMemo(() => (tab === "全部" ? modelMethods : modelMethods.filter((item) => item.family === tab)), [tab]);

  return (
    <div className="hairline-grid">
      <section className="premium-shell">
        <div className="relative mx-auto max-w-7xl px-4 py-14 text-white">
          <p className="inline-flex rounded-md border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-100">
            Learning Mode
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            基础建模学习台
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
            每张模型卡都按“什么时候用、怎么想、代码怎么写、论文怎么表达、怎么检验”组织。AI 工作台推荐模型后，可以回到这里继续问方法、找例题、补技巧。
          </p>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {learningTracks.map((track) => (
              <article key={track.title} className="glass-panel rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold text-white">{track.title}</h2>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-emerald-100">{track.duration}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-200">{track.focus}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bridge-700">Recent MCM/ICM</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">近三年优先训练</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            先从题面读懂、数据处理、模型选择和论文表达四件事入手。每个案例都拆成建模、编程、写论文三条线，适合按周推进，也适合赛前集中复盘。
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {recentTrainingCases.map((caseItem) => (
            <article key={caseItem.slug} className="quiet-card interactive-card rounded-2xl p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-slate-950 px-2.5 py-1 font-semibold text-white">
                  {caseItem.year}
                  {caseItem.problem}
                </span>
                <span className="rounded-full bg-bridge-50 px-2.5 py-1 font-semibold text-bridge-800">{caseItem.priority}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{caseItem.difficulty}</span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-950">{caseItem.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{caseItem.positioning}</p>

              <div className="mt-5 grid gap-4 xl:grid-cols-3">
                <PracticeLine title="建模" items={caseItem.modelingLine.slice(0, 2)} />
                <PracticeLine title="编程" items={caseItem.codingLine.slice(0, 2)} />
                <PracticeLine title="论文" items={caseItem.paperLine.slice(0, 2)} />
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-400">可对照的获奖论文路线</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {caseItem.paperRoutes.slice(0, 3).map((route) => (
                    <span key={route.paperId} className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600 ring-1 ring-slate-200">
                      {route.paperId}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {caseItem.methodSlugs.map((slug) => {
                  const method = modelMethods.find((item) => item.slug === slug);
                  return (
                    <a key={slug} href={`#model-${slug}`} className="rounded-full bg-bridge-50 px-2.5 py-1 text-xs font-semibold text-bridge-800 hover:bg-bridge-100">
                      {method?.name || slug}
                    </a>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="methods" className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bridge-700">Model Library</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">模型方法库</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={[
                  "rounded-full border px-3 py-1.5 text-sm font-semibold transition",
                  tab === item ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-bridge-400",
                ].join(" ")}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-5">
          {filtered.map((method) => {
            const related = classicProblems.filter((problem) => problem.methods.includes(method.slug)).slice(0, 3);
            return (
              <article id={`model-${method.slug}`} key={method.slug} className="quiet-card scroll-mt-24 rounded-3xl p-6">
                <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-bridge-50 px-3 py-1 text-xs font-semibold text-bridge-800">{method.family}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{method.level}</span>
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold text-slate-950">{method.name}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{method.intuition}</p>
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold text-slate-400">什么时候用</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{method.when}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <MethodBlock title="输入" items={method.inputs} />
                    <MethodBlock title="输出" items={method.outputs} />
                    <MethodBlock title="学习步骤" items={method.learnSteps} />
                    <MethodBlock title="检验方式" items={method.validation} />
                    <MethodBlock title="编码技巧" items={method.coding} />
                    <MethodBlock title="论文写法" items={method.paper} />
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                    <p className="text-sm font-semibold text-rose-900">常见坑</p>
                    <ul className="mt-2 space-y-1 text-sm leading-6 text-rose-900">
                      {method.pitfalls.map((item) => (
                        <li key={item}>· {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-950">相关例题</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {related.map((problem) => (
                        <a key={problem.slug} href={`#problem-${problem.slug}`} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-bridge-50 hover:text-bridge-800">
                          {problem.title}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bridge-700">Classic Problems</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">经典题改编练习</h2>
          </div>
          <Link to="/cases" className="text-sm font-semibold text-bridge-700 hover:underline">
            查看案例库
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {classicProblems.map((problem) => {
            const practiceLink = getClassicProblemPracticeLink(problem);
            return (
              <article id={`problem-${problem.slug}`} key={problem.slug} className="quiet-card interactive-card scroll-mt-24 rounded-2xl p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-slate-950 px-2 py-0.5 font-semibold text-white">{problem.contest}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{problem.year}</span>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">{problem.difficulty}</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-slate-950">{problem.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{problem.value}</p>
                <p className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700">{problem.simplifiedTask}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {problem.methods.map((slug) => {
                    const method = modelMethods.find((item) => item.slug === slug);
                    return (
                      <a key={slug} href={`#model-${slug}`} className="rounded-full bg-bridge-50 px-2.5 py-1 text-xs font-semibold text-bridge-800">
                        {method?.name || slug}
                      </a>
                    );
                  })}
                </div>
                <Link
                  to={practiceLink.href}
                  aria-label={practiceLink.ariaLabel}
                  className="mt-4 inline-flex rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:border-bridge-400 hover:text-bridge-800"
                >
                  {practiceLink.label}
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-10 lg:grid-cols-2">
        <TipPanel title="编码技巧" items={codingTips} />
        <TipPanel title="论文写作技巧" items={writingTips} />
      </section>
    </div>
  );
}

function PracticeLine({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
        {items.map((item) => (
          <li key={item}>· {item}</li>
        ))}
      </ul>
    </div>
  );
}

function MethodBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
        {items.map((item) => (
          <li key={item}>· {item}</li>
        ))}
      </ul>
    </div>
  );
}

function TipPanel({ title, items }: { title: string; items: { title: string; items: string[] }[] }) {
  return (
    <section className="quiet-card rounded-3xl p-6">
      <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
      <div className="mt-5 grid gap-3">
        {items.map((tip) => (
          <article key={tip.title} className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="font-semibold text-slate-950">{tip.title}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {tip.items.map((item) => (
                <span key={item} className="soft-badge rounded-full px-2.5 py-1 text-xs text-slate-600">
                  {item}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
