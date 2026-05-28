import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCase } from "../api/client";
import { getLocalCase } from "../data/localCases";
import type { CaseDetail } from "../types";

const sections = [
  { key: "problem_statement", label: "改编题目", focus: "先读题，再解题" },
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

function buildAdaptedProblemStatement(c: CaseDetail): string {
  const caseTitle = c.title.replace("（教学演示案例）", "");
  const breakdown = c.sections.problem_breakdown?.trim();

  return [
    "【说明】这是用于学习训练的改编题面，保留“先读题、再建模、再编程、再写论文”的竞赛流程；后续接入官方原题 PDF 后，可替换为官方题面摘录或原题链接。",
    "",
    `【改编题面】某团队需要围绕“${caseTitle}”完成一次数学建模竞赛训练。已知背景材料如下：${c.summary}`,
    "",
    "请你以数学建模团队的身份完成以下任务：",
    "1. 用自己的话重述问题，明确研究对象、关键变量、目标函数或评价目标。",
    "2. 列出完成建模所需的数据字段，说明哪些数据来自题目附件，哪些需要人工整理或合理假设。",
    "3. 建立一个基础模型，并说明模型假设、变量含义、约束条件和求解流程。",
    "4. 给出可复现的编程实现思路，输出必要的表格、图像、指标和检验结果。",
    "5. 按竞赛论文结构组织答案，写清摘要、模型建立、结果分析、模型评价与改进方向。",
    breakdown ? "\n【本题小问】\n" + breakdown : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function getSectionText(c: CaseDetail, key: (typeof sections)[number]["key"]): string | null {
  const explicitText = c.sections[key]?.trim();
  if (explicitText) return explicitText;
  if (key === "problem_statement") return buildAdaptedProblemStatement(c);
  return null;
}

export function CaseDetailPage() {
  const { slug } = useParams();
  const [c, setC] = useState<CaseDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let ignore = false;
    setErr(null);
    setC(null);
    getCase(slug)
      .then((remoteCase) => {
        if (!ignore) setC(remoteCase);
      })
      .catch(() => {
        if (ignore) return;
        const localCase = getLocalCase(slug);
        if (localCase) {
          setC(localCase);
          return;
        }
        setErr("案例不存在或加载失败。");
      });
    return () => {
      ignore = true;
    };
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
                        <span className="text-xs text-slate-400">{String(index + 1).padStart(2, "0")}</span>
                        <span>{item.label}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>

            <div className="space-y-4">
              {sections.map((item, index) => {
                const text = getSectionText(c, item.key);
                if (!text) return null;
                return (
                  <section id={item.key} key={item.key} className="quiet-card scroll-mt-24 rounded-2xl p-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold text-bridge-700">{String(index + 1).padStart(2, "0")}</p>
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
