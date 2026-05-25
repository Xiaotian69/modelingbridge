import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listCases } from "../api/client";
import { classicProblems, modelMethods, resourcePacks } from "../data/modelingContent";
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
          {classicProblems.map((problem) => (
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
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
