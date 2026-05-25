import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { analyzeProblem, getPromptVersion, listLlmProviders } from "../api/client";
import { useWorkbenchState } from "../hooks/useWorkbenchState";
import type { ProviderId, StudentLevel } from "../types";
import { buildWorkbenchAnalysis, buildWorkbenchSummary, buildWorkbenchUsageLog } from "../utils/markdownBuilder";
import { saveWorkbenchRecord } from "./Records";
import { Step0Problem } from "./workbench/Step0Problem";
import { Step1Tasks } from "./workbench/Step1Tasks";
import { Step2Data } from "./workbench/Step2Data";
import { Step3Model } from "./workbench/Step3Model";
import { Step4Code } from "./workbench/Step4Code";
import { Step5Results } from "./workbench/Step5Results";
import { Step6Check } from "./workbench/Step6Check";
import { Step7Paper } from "./workbench/Step7Paper";

const STEPS = [
  { id: 0, title: "题目导入", short: "导入", hint: "粘贴题目文本或补充附件说明，生成引导结果。" },
  { id: 1, title: "目标拆解", short: "拆题", hint: "题型判断 + 小问目标、隐含目标与输出形式。" },
  { id: 2, title: "数据清单", short: "数据", hint: "字段需求、来源、单位与频率建议。" },
  { id: 3, title: "模型选择", short: "模型", hint: "基础 / 进阶候选、适用条件、优缺点与检验方式。" },
  { id: 4, title: "代码实践", short: "代码", hint: "代码框架、本地运行步骤与待补充清单。" },
  { id: 5, title: "结果解释", short: "解释", hint: "结论解释、异常提醒、论文写法建议。" },
  { id: 6, title: "检验复盘", short: "检验", hint: "误差、鲁棒、敏感与约束检查建议。" },
  { id: 7, title: "论文表达", short: "表达", hint: "章节框架、图表引用提示、扣分风险提醒。" },
] as const;

const DEFAULT_PROBLEM_TEXT =
  "某市共享单车管理部门希望你基于历史订单数据，预测未来一周各区域需求量，并在车辆总数约束下给出调度方案，使缺车率与运营成本综合最优。请建立数学模型并给出求解思路。";

const DEFAULT_ATTACHMENT_NOTE =
  "附件：区域划分表、历史 30 天订单明细（字段：时间、起点区域、终点区域、天气）。库存与桩容量未完全给出。";

export function WorkbenchPage() {
  const [searchParams] = useSearchParams();
  const initialProblem = searchParams.get("problem_text")?.trim() || DEFAULT_PROBLEM_TEXT;
  const initialAttachment = searchParams.get("attachment_note")?.trim() || DEFAULT_ATTACHMENT_NOTE;
  const [state, dispatch] = useWorkbenchState(initialProblem, initialAttachment);
  const { problemText, attachmentNote, level, provider, providers, step, confirmed, explainOpen, data, loading, error, copyStatus, promptMeta, resultNotes } = state;

  useEffect(() => {
    getPromptVersion().then((m) => dispatch({ type: "SET_PROMPT_META", payload: m })).catch(() => {});
    listLlmProviders().then((p) => dispatch({ type: "SET_PROVIDERS", payload: p })).catch(() => {});
  }, []);

  const canEnter = useMemo(() => {
    return STEPS.map((_, i) => {
      if (i === 0) return true;
      if (!data) return false;
      return confirmed.slice(0, i).every(Boolean);
    });
  }, [confirmed, data]);

  const confirmedCount = confirmed.filter(Boolean).length;
  const progress = Math.round((confirmedCount / STEPS.length) * 100);

  async function onAnalyze() {
    dispatch({ type: "ANALYZE_START" });
    try {
      const res = await analyzeProblem({ problem_text: problemText, attachment_note: attachmentNote, student_level: level, provider });
      dispatch({ type: "ANALYZE_SUCCESS", payload: res });
    } catch (e) {
      dispatch({ type: "ANALYZE_ERROR", payload: e instanceof Error ? e.message : "分析失败" });
    }
  }

  function onConfirmStep(i: number) { dispatch({ type: "CONFIRM_STEP", payload: i }); }
  function onNeedModify() { dispatch({ type: "SET_STEP", payload: 0 }); dispatch({ type: "CLOSE_EXPLAIN" }); }

  const markdownCtx = { problemText, attachmentNote, level, provider, resultNotes };

  async function copyModelStudyPrompt(modelName: string) {
    const prompt = [
      "请用问答式方式教我这个数学建模方法。",
      `方法名称：${modelName}`,
      "",
      "请按下面顺序讲：",
      "1. 这个方法解决什么问题，用一句话解释。",
      "2. 它需要哪些输入，输出什么结果。",
      "3. 结合我当前题目，为什么适合或不适合。",
      "4. 给我一个最小可运行的 Python 思路，不要直接写完整论文。",
      "5. 告诉我如何检验结果是否可信。",
      "",
      "当前题目：",
      problemText.slice(0, 800),
      "",
      "附件说明：",
      attachmentNote || "无",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(prompt);
      dispatch({ type: "SET_COPY_STATUS", payload: `已复制「${modelName}」的追问提示词` });
    } catch {
      dispatch({ type: "SET_COPY_STATUS", payload: "复制失败，请手动记录模型名称后追问。" });
    }
  }

  async function copyUsageLog() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(buildWorkbenchUsageLog(data, { ...markdownCtx, confirmed, stepTitles: STEPS.map((s) => s.title) }));
      dispatch({ type: "SET_COPY_STATUS", payload: "已复制 AI 使用记录" });
    } catch { dispatch({ type: "SET_COPY_STATUS", payload: "复制失败，请手动保存学习记录" }); }
  }

  async function copyAnalysisMarkdown() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(buildWorkbenchAnalysis(data, markdownCtx));
      dispatch({ type: "SET_COPY_STATUS", payload: "已复制分析摘要 Markdown" });
    } catch { dispatch({ type: "SET_COPY_STATUS", payload: "复制失败，请先保存学习记录后到记录页导出。" }); }
  }

  function doSaveRecord() {
    if (!data) return;
    saveWorkbenchRecord({
      title: problemText.slice(0, 60) + (problemText.length > 60 ? "..." : ""),
      summary: buildWorkbenchSummary(data, { confirmedCount, stepCount: STEPS.length, resultNotes }),
      usageLog: buildWorkbenchUsageLog(data, { ...markdownCtx, confirmed, stepTitles: STEPS.map((s) => s.title) }),
    });
    alert("已保存到本机学习记录。");
  }

  function renderStepContent() {
    if (!data) return null;
    const baseProps = {
      data,
      confirmed: confirmed[step],
      onCheck: (v: boolean) => dispatch({ type: "MARK_CONFIRMED", payload: { index: step, value: v } }),
      onConfirm: () => onConfirmStep(step),
      onModify: onNeedModify,
      onExplain: () => dispatch({ type: "TOGGLE_EXPLAIN" }),
    };
    switch (step) {
      case 1: return <Step1Tasks {...baseProps} />;
      case 2: return <Step2Data {...baseProps} />;
      case 3: return <Step3Model {...baseProps} onCopyModelPrompt={copyModelStudyPrompt} />;
      case 4: return <Step4Code {...baseProps} />;
      case 5: return <Step5Results {...baseProps} resultNotes={resultNotes} onResultNotesChange={(v) => dispatch({ type: "SET_RESULT_NOTES", payload: v })} />;
      case 6: return <Step6Check {...baseProps} />;
      case 7: return (
        <Step7Paper
          confirmed={confirmed[7]}
          copyStatus={copyStatus}
          onCheck={(v) => dispatch({ type: "MARK_CONFIRMED", payload: { index: 7, value: v } })}
          onModify={onNeedModify}
          onExplain={() => dispatch({ type: "TOGGLE_EXPLAIN" })}
          onSaveRecord={doSaveRecord}
          onCopyMarkdown={copyAnalysisMarkdown}
          onCopyUsageLog={copyUsageLog}
        />
      );
      default: return null;
    }
  }

  return (
    <div className="hairline-grid">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="premium-shell rounded-3xl p-6 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex rounded-md border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                AI Studio
              </p>
              <h1 className="mt-3 text-3xl font-semibold">AI 辅助建模工作台</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
                从题面生成拆题、数据、模型、代码和检验路径。模型建议会连接到学习卡，方便继续追问和补课。
              </p>
            </div>
            <div className="text-sm text-slate-300">
              {promptMeta ? (
                <p>提示词版本：{promptMeta.workbench_prompt}（{promptMeta.updated}）</p>
              ) : (
                <p>提示词版本加载中</p>
              )}
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[18rem_1fr]">
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-950">流程进度</span>
                <span className="text-slate-500">{progress}%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-bridge-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-4 space-y-2">
                {STEPS.map((s, i) => {
                  const active = step === i;
                  const locked = !canEnter[i];
                  const done = confirmed[i];
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={locked}
                      onClick={() => dispatch({ type: "SET_STEP", payload: i })}
                      className={[
                        "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition",
                        locked ? "border-slate-100 bg-slate-50 text-slate-400"
                          : active ? "border-slate-950 bg-slate-950 text-white"
                          : done ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-400",
                      ].join(" ")}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-current/10 text-xs font-bold">
                        {i + 1}
                      </span>
                      <span>
                        <span className="block font-medium">{s.short}</span>
                        <span className="block text-xs opacity-70">{done ? "已确认" : locked ? "待解锁" : "可操作"}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
              <h2 className="font-semibold text-slate-950">试运行提示</h2>
              <p className="mt-2 leading-6 text-slate-600">
                第一次试用建议直接用示例题。跑完后保存记录，再到反馈页写下最有用和最不准的地方。
              </p>
            </section>
          </aside>

          <main className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="border-b border-slate-200 pb-4">
              <p className="text-xs font-semibold text-bridge-700">Step {step + 1}</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">{STEPS[step].title}</h2>
              <p className="mt-1 text-sm text-slate-500">{STEPS[step].hint}</p>
            </div>

            {explainOpen && data && (
              <div className="mt-5 rounded-lg border border-bridge-200 bg-bridge-50 p-4 text-sm text-slate-800">
                <p className="font-semibold text-bridge-900">为什么这样做</p>
                <p className="mt-2 whitespace-pre-wrap leading-6">{data.learning.why_important}</p>
                <p className="mt-3 font-semibold text-bridge-900">常见误区</p>
                <p className="mt-2 whitespace-pre-wrap leading-6">{data.learning.common_mistakes}</p>
              </div>
            )}

            <div className="mt-5">
              {step === 0 && (
                <Step0Problem
                  problemText={problemText}
                  attachmentNote={attachmentNote}
                  level={level}
                  provider={provider}
                  providers={providers}
                  loading={loading}
                  error={error}
                  data={data}
                  confirmed={confirmed[0]}
                  onProblemTextChange={(v) => dispatch({ type: "SET_PROBLEM_TEXT", payload: v })}
                  onAttachmentNoteChange={(v) => dispatch({ type: "SET_ATTACHMENT_NOTE", payload: v })}
                  onLevelChange={(v: StudentLevel) => dispatch({ type: "SET_LEVEL", payload: v })}
                  onProviderChange={(v: ProviderId) => dispatch({ type: "SET_PROVIDER", payload: v })}
                  onAnalyze={onAnalyze}
                  onCheck={(v) => dispatch({ type: "MARK_CONFIRMED", payload: { index: 0, value: v } })}
                  onConfirm={() => onConfirmStep(0)}
                  onModify={onNeedModify}
                  onExplain={() => dispatch({ type: "TOGGLE_EXPLAIN" })}
                />
              )}
              {step > 0 && renderStepContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
