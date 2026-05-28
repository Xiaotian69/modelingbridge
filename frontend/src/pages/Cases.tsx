import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listCases } from "../api/client";
import { classicProblems, getClassicProblemPracticeLink, modelMethods, recentTrainingCases, resourcePacks } from "../data/modelingContent";
import type { CaseSummary } from "../types";

export function CasesPage() {
  const [items, setItems] = useState<CaseSummary[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    listCases()
      .then(setItems)
      .catch(() => setErr("无法加载案例列表，请确认后端已启动（见项目 README）。"));
  }, []);

  return (
    <div className="hairline-grid">
      <section className="premium-shell">
        <div className="relative mx-auto max-w-7xl px-4 py-14 text-white">
          <p className="inline-flex rounded-md border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-100">
            Problem Studio
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            例题库：先练简化题，再上正式赛题
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
            每道题只给教学路径和训练目标，不给可直接提交的论文答案。经典赛题只做改编练习，正式备赛请回到官方原题。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bridge-700">Guided Cases</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">完整教学案例</h2>
          </div>
          {!err && <p className="text-sm font-medium text-slate-600">当前 {items.length} 个</p>}
        </div>
        {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {items.map((c) => (
            <Link key={c.slug} to={`/cases/${c.slug}`} className="quiet-card interactive-card rounded-3xl p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-bridge-50 px-2 py-0.5 font-semibold text-bridge-800">{c.difficulty}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{c.data_status}</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-950">{c.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{c.summary}</p>
              <p className="mt-4 text-xs text-slate-500">适合：{c.audience}</p>
            </Link>
          ))}
          {!err && items.length === 0 && (
            <p className="text-sm text-slate-600">暂无案例数据，请检查后端 `cases/` 目录是否可读。</p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bridge-700">Recent Contest Scripts</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">近三年真题拆解</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            优先把 2023-2025 的美赛题做成训练脚本：先读懂题面和数据，再照着获奖论文路线学拆题、建模、编程和写作。这里只做学习拆解，不提供可直接提交的成稿。
          </p>
        </div>

        <div className="mt-8 grid gap-5">
          {recentTrainingCases.map((caseItem) => (
            <article key={caseItem.slug} className="quiet-card interactive-card rounded-2xl p-5">
              <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-slate-950 px-2.5 py-1 font-semibold text-white">
                      {caseItem.contest} {caseItem.year}
                      {caseItem.problem}
                    </span>
                    <span className="rounded-full bg-bridge-50 px-2.5 py-1 font-semibold text-bridge-800">{caseItem.priority}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{caseItem.difficulty}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-slate-950">{caseItem.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{caseItem.positioning}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {caseItem.methodSlugs.map((slug) => {
                      const method = modelMethods.find((item) => item.slug === slug);
                      return (
                        <Link key={slug} to={`/learn#model-${slug}`} className="rounded-full bg-bridge-50 px-2.5 py-1 text-xs font-semibold text-bridge-800">
                          {method?.name || slug}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                  <CaseLearningColumn title="建模线" items={caseItem.modelingLine.slice(0, 3)} />
                  <CaseLearningColumn title="编程线" items={caseItem.codingLine.slice(0, 3)} />
                  <CaseLearningColumn title="论文线" items={caseItem.paperLine.slice(0, 3)} />
                </div>
              </div>

              <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <p className="text-sm font-semibold text-slate-950">获奖论文路线怎么学</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {caseItem.paperRoutes.slice(0, 2).map((route) => (
                      <div key={route.paperId} className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-xs font-semibold text-slate-400">{route.paperId}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">{route.route}</p>
                        <p className="mt-2 text-xs leading-5 text-bridge-800">{route.learnPoint}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-950">先避开的坑</p>
                  <ul className="mt-2 space-y-1 text-sm leading-6 text-amber-950">
                    {caseItem.pitfalls.slice(0, 3).map((item) => (
                      <li key={item}>· {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bridge-700">Local Resources</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">已上传的美赛资料包</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            这些资料先作为内容加工来源：用于整理经典题、优秀论文结构和问答式学习提示，不直接在网页里批量展开 PDF。
          </p>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {resourcePacks.map((pack) => (
            <article key={pack.title} className="quiet-card rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-slate-950">{pack.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{pack.summary}</p>
              <p className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-500">{pack.localPath}</p>
              <p className="mt-3 text-sm text-slate-700">{pack.files}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {pack.usage.map((item) => (
                  <span key={item} className="rounded-full bg-bridge-50 px-2.5 py-1 text-xs font-semibold text-bridge-800">
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bridge-700">Classic Drills</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">历年经典母题 · 简化训练版</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            这里不是原题搬运，而是把经典题背后的建模母题拆成可训练的小任务，适合新队伍先建立手感。
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {classicProblems.map((problem) => {
            const practiceLink = getClassicProblemPracticeLink(problem);
            return (
              <article key={problem.slug} className="quiet-card interactive-card rounded-2xl p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-slate-950 px-2 py-0.5 font-semibold text-white">{problem.contest}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{problem.year}</span>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">{problem.difficulty}</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-slate-950">{problem.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{problem.simplifiedTask}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {problem.methods.map((slug) => {
                    const method = modelMethods.find((item) => item.slug === slug);
                    return (
                      <Link key={slug} to={`/learn#model-${slug}`} className="rounded-full bg-bridge-50 px-2.5 py-1 text-xs font-semibold text-bridge-800">
                        {method?.name || slug}
                      </Link>
                    );
                  })}
                </div>
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold text-slate-400">训练产物</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{problem.deliverables.join(" · ")}</p>
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
    </div>
  );
}

function CaseLearningColumn({ title, items }: { title: string; items: string[] }) {
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
