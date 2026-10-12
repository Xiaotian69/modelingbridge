import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listCases } from "../api/client";
import { listLocalCases } from "../data/localCases";
import { classicProblems, getClassicProblemPracticeLink, modelMethods, recentTrainingCases } from "../data/modelingContent";
import { PageHead } from "../components/ui/PageHead";
import type { CaseSummary } from "../types";

export function CasesPage() {
  const [items, setItems] = useState<CaseSummary[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    listCases()
      .then((remoteCases) => setItems(remoteCases.length ? remoteCases : listLocalCases()))
      .catch(() => {
        setItems(listLocalCases());
        setErr("当前显示站内内置的教学案例。");
      });
  }, []);

  return (
    <div className="hairline-grid">
      <PageHead
        crumbs={[{ label: "实战", to: "/quest" }, { label: "教学案例" }]}
        title="教学案例：先练简化题，再上正式赛题"
        lead="每道题只给教学路径和训练目标，不给可直接提交的论文答案。经典赛题只做改编练习，正式备赛请回到官方原题。"
      />

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bridge-700">教学案例</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">完整教学案例</h2>
          </div>
          <p className="text-sm font-medium text-slate-600">当前 {items.length} 个</p>
        </div>
        {err && <p className="mt-4 text-sm text-slate-500">{err}</p>}
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
          {items.length === 0 && (
            <p className="text-sm text-slate-600">暂无案例数据，请检查后端 `cases/` 目录是否可读。</p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bridge-700">近年真题拆解</p>
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

      <section className="mx-auto max-w-7xl px-4 py-6">
        <p className="notice notice-info">
          历年赛题原文与优秀论文请到各赛事官方页面获取；第三方整理的合集在授权核验前不提供下载。可在
          <Link to="/library" className="text-link"> 资料中心 › 资料索引 </Link>
          查看官方链接。
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bridge-700">经典母题</p>
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
