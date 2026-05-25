import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCase } from "../api/client";
import type { CaseDetail } from "../types";

const sections = [
  { key: "background", label: "案例背景", focus: "先理解业务问题" },
  { key: "learning_goals", label: "学习目标", focus: "明确本案例练什么" },
  { key: "problem_breakdown", label: "题目拆解", focus: "拆成可执行的小问" },
  { key: "data_needs", label: "数据需求", focus: "确认字段、来源和缺失风险" },
  { key: "model_route", label: "模型路线", focus: "比较基础与进阶方案" },
  { key: "code_framework", label: "代码框架", focus: "把模型变成工程结构" },
  { key: "chart_plan", label: "图表计划", focus: "让图服务结论" },
  { key: "checklist", label: "检验清单", focus: "检查可靠性和局限" },
  { key: "paper_structure", label: "论文结构", focus: "只给结构，不给终稿" },
  { key: "student_must_complete", label: "学生需自行完成", focus: "保留人工判断" },
] as const;

export function CaseDetailPage() {
  const { slug } = useParams();
  const [c, setC] = useState<CaseDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setErr(null);
    getCase(slug)
      .then(setC)
      .catch(() => setErr("案例不存在或加载失败。"));
  }, [slug]);

  if (!slug) return null;

  return (
    <div className="hairline-grid">
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Link to="/cases" className="text-sm font-semibold text-bridge-700 hover:underline">
        返回例题库
      </Link>
      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
      {c && (
        <article className="mt-6">
          <header className="premium-shell rounded-3xl p-6 text-white">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white px-2 py-0.5 font-medium text-slate-950">{c.difficulty}</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-slate-200">{c.data_status}</span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold">{c.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">{c.summary}</p>
            <p className="mt-3 text-sm text-slate-300">适合：{c.audience}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to={`/quest?case=${encodeURIComponent(c.slug)}`}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-100"
              >
                进入闯关训练
              </Link>
              <Link
                to="/feedback"
                className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
              >
                试用后反馈
              </Link>
            </div>
          </header>

          <div className="mt-8 grid gap-6 lg:grid-cols-[16rem_1fr]">
            <aside className="hidden lg:block">
              <div className="quiet-card sticky top-24 rounded-2xl p-4">
                <p className="text-sm font-semibold text-slate-950">案例路径</p>
                <ol className="mt-3 space-y-2 text-sm">
                  {sections.map((item, index) => (
                    <li key={item.key}>
                      <a href={`#${item.key}`} className="flex gap-2 rounded-md px-2 py-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-950">
                        <span className="text-xs text-slate-400">{index + 1}</span>
                        <span>{item.label}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>

            <div className="space-y-4">
              {sections.map((item, index) => {
                const text = c.sections[item.key];
                if (!text) return null;
                return (
                  <section id={item.key} key={item.key} className="quiet-card scroll-mt-24 rounded-2xl p-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold text-bridge-700">0{index + 1}</p>
                        <h2 className="mt-1 text-xl font-semibold text-slate-950">{item.label}</h2>
                      </div>
                      <p className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{item.focus}</p>
                    </div>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{text}</p>
                  </section>
                );
              })}
            </div>
          </div>
        </article>
      )}
    </div>
    </div>
  );
}
