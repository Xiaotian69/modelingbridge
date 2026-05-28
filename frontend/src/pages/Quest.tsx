import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CoachPanel } from "../components/quest/CoachPanel";
import { getCase } from "../api/client";
import { getCaseQuestSeed, getModelCardsForCase, getStageSeed } from "../quest/content";
import {
  buildQuestReportMarkdown,
  getQuestProgress,
  getStageUnlockState,
  questStages,
  type QuestStage,
} from "../quest/stages";
import { loadQuestDraft, saveQuestDraft } from "../quest/storage";
import { useQuestState } from "../hooks/useQuestState";
import type { CaseDetail } from "../types";
import { saveWorkbenchRecord } from "./Records";

const DEFAULT_PROBLEM =
  "某市共享单车管理部门希望你基于历史订单数据，预测未来一周各区域需求量，并在车辆总数约束下给出调度方案，使缺车率与运营成本综合最优。请建立数学模型并给出求解思路。";

export function QuestPage() {
  const [params] = useSearchParams();
  const caseSlug = params.get("case");
  const sourceId = caseSlug ? `case:${caseSlug}` : "default";
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [loadError, setLoadError] = useState("");
  const [questState, dispatch] = useQuestState(sourceId);
  const { states, checks, activeStageId, coachMode, saveStatus, loadedSourceId } = questState;

  useEffect(() => {
    if (!caseSlug) {
      setCaseDetail(null);
      setLoadError("");
      return;
    }
    let cancelled = false;
    setLoadError("");
    getCase(caseSlug)
      .then((res) => {
        if (!cancelled) setCaseDetail(res);
      })
      .catch(() => {
        if (!cancelled) setLoadError("案例加载失败，当前显示默认训练题。");
      });
    return () => {
      cancelled = true;
    };
  }, [caseSlug]);

  useEffect(() => {
    const draft = loadQuestDraft(sourceId);
    dispatch({ type: "LOAD_DRAFT", payload: { sourceId, draft } });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceId]);

  useEffect(() => {
    if (loadedSourceId !== sourceId) return;
    const draft = {
      activeStageId,
      states,
      checks,
      updatedAt: new Date().toISOString(),
    };
    saveQuestDraft(sourceId, draft);
  }, [activeStageId, checks, loadedSourceId, sourceId, states]);

  const activeStage = questStages.find((stage) => stage.id === activeStageId) ?? questStages[0];
  const activeState = states.find((state) => state.stageId === activeStage.id) ?? states[0];
  const caseSeed = getCaseQuestSeed(caseSlug);
  const activeSeed = getStageSeed(caseSlug, activeStage.id);
  const modelCards = activeStage.id === "model" ? getModelCardsForCase(caseSlug) : [];
  const progress = getQuestProgress(states);
  const title = caseDetail?.title ?? "自定义训练题";
  const sourceLabel = caseDetail ? `案例训练副本：${caseDetail.title}` : "默认示例题";
  const problemText = useMemo(() => {
    if (!caseDetail) return DEFAULT_PROBLEM;
    return [caseDetail.summary, caseDetail.sections.background].filter(Boolean).join("\n\n");
  }, [caseDetail]);
  const workbenchHref = useMemo(() => {
    const query = new URLSearchParams();
    query.set("problem_text", problemText.slice(0, 1500));
    query.set("attachment_note", `来自${sourceLabel}。请把 AI 输出作为学习提示，保留人工确认。`);
    return `/workbench?${query.toString()}`;
  }, [problemText, sourceLabel]);
  const checkedConditions = checks[activeStage.id] ?? [];
  const canComplete = activeState.answer.trim().length >= 20 && checkedConditions.every(Boolean);
  const report = buildQuestReportMarkdown({
    title,
    sourceLabel,
    states,
    checks,
    aiUsageNote: "本次闯关第一版使用本地 AI 教练提示卡；如跳转工作台调用大模型，请在最终报告中补充模型、时间和人工确认记录。",
  });

  function completeStage(stage: QuestStage) {
    const nextStage = questStages[stage.order];
    dispatch({ type: "COMPLETE_STAGE", payload: { stageId: stage.id, nextStageId: nextStage?.id ?? null } });
  }

  function saveReport() {
    saveWorkbenchRecord({
      title: `闯关报告：${title}`,
      summary: `完成进度：${progress.completed}/${progress.total}（${progress.percent}%）`,
      fullReport: report,
      usageLog: "闯关模式：本地提示卡 + 人工确认。未自动生成可提交论文。",
    });
    dispatch({ type: "SET_SAVE_STATUS", payload: "已保存到本机学习记录。" });
  }

  return (
    <div className="hairline-grid">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="premium-shell rounded-3xl p-6 text-white">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="inline-flex rounded-md border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                Quest Mode
              </p>
              <h1 className="mt-3 text-3xl font-semibold">数模闯关训练营</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">
                围绕一道题完成 7 个训练关卡：读题、拆问、数据、模型、代码、图表、论文框架。AI 只做教练提示，最终判断由你完成。
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Progress</p>
              <p className="mt-2 text-3xl font-semibold">{progress.percent}%</p>
              <p className="mt-1 text-xs text-slate-300">
                {progress.completed}/{progress.total} 关已通关
              </p>
            </div>
          </div>
        </header>

        {loadError && <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{loadError}</p>}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-bridge-700">{sourceLabel}</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">{title}</h2>
              <p className="mt-2 max-w-4xl whitespace-pre-wrap text-sm leading-7 text-slate-600">{problemText}</p>
            </div>
            <Link to={workbenchHref} className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:border-bridge-400">
              打开 AI 工作台
            </Link>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[18rem_1fr_20rem]">
          <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
            {questStages.map((stage) => {
              const unlock = getStageUnlockState(stage.id, states);
              const active = stage.id === activeStage.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  disabled={unlock === "locked"}
                  onClick={() => dispatch({ type: "SET_ACTIVE_STAGE", payload: stage.id })}
                  className={[
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm transition",
                    unlock === "locked"
                      ? "border-slate-100 bg-slate-50 text-slate-400"
                      : active
                        ? "border-slate-950 bg-slate-950 text-white"
                        : unlock === "completed"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-400",
                  ].join(" ")}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-current/10 text-xs font-bold">{stage.order}</span>
                  <span>
                    <span className="block font-semibold">{stage.title}</span>
                    <span className="block text-xs opacity-70">{unlock === "locked" ? "待解锁" : unlock === "completed" ? "已通关" : "可挑战"}</span>
                  </span>
                </button>
              );
            })}
          </aside>

          <main className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold text-bridge-700">
              第 {activeStage.order} 关 · {activeStage.outputLabel}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">{activeStage.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{activeStage.goal}</p>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">当前任务</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">{activeSeed?.taskBrief ?? activeStage.task}</p>
            </div>

            {activeSeed && (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <section className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-950">常见错误</p>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                    {activeSeed.commonMistakes.map((item) => (
                      <li key={item}>· {item}</li>
                    ))}
                  </ul>
                </section>
                <section className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-950">学生必须自己完成</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{activeSeed.mustDoByStudent}</p>
                  <p className="mt-3 text-xs leading-5 text-amber-700">{activeSeed.complianceNote}</p>
                </section>
              </div>
            )}

            {activeSeed?.outputExample && (
              <details className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-950">通关产物示例</summary>
                <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-700">{activeSeed.outputExample}</pre>
              </details>
            )}

            {modelCards.length > 0 && (
              <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-950">模型参考卡</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {modelCards.map((card) => (
                    <article key={card.modelId} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm font-semibold text-slate-950">{card.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{card.family} · {card.level}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{card.fitWhen}</p>
                      <details className="mt-2 text-xs leading-5 text-slate-600">
                        <summary className="cursor-pointer font-semibold text-slate-700">新手判断问题</summary>
                        <ul className="mt-2 space-y-1">
                          {card.noviceQuestions.slice(0, 3).map((question) => (
                            <li key={question}>· {question}</li>
                          ))}
                        </ul>
                      </details>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <label className="mt-5 block text-sm font-semibold text-slate-800">
              {activeSeed?.studentPrompt ?? activeStage.userPrompt}
              <textarea
                className="mt-2 min-h-40 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm leading-6 focus:border-bridge-600 focus:outline-none focus:ring-2 focus:ring-bridge-600/20"
                value={activeState.answer}
                onChange={(e) => dispatch({ type: "SET_ANSWER", payload: { stageId: activeStage.id, answer: e.target.value } })}
              />
            </label>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-950">通关条件</p>
              <div className="mt-3 space-y-2">
                {activeStage.passConditions.map((condition, index) => (
                  <label key={condition} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-bridge-700"
                      checked={checkedConditions[index] ?? false}
                      onChange={(e) => dispatch({ type: "SET_CONDITION", payload: { stageId: activeStage.id, index, value: e.target.checked } })}
                    />
                    <span className="text-sm leading-6 text-slate-700">{condition}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!canComplete}
                onClick={() => completeStage(activeStage)}
                className="rounded-lg bg-bridge-700 px-4 py-2 text-sm font-semibold text-white hover:bg-bridge-600 disabled:opacity-40"
              >
                通关并进入下一关
              </button>
              <button type="button" onClick={saveReport} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:border-bridge-400">
                保存通关报告
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: "RESET", payload: { sourceId } })}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:border-amber-400"
              >
                重置本次闯关
              </button>
              <Link to="/records" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:border-bridge-400">
                查看记录
              </Link>
            </div>
            {saveStatus && <p className="mt-3 text-sm text-slate-500">{saveStatus}</p>}
            {!canComplete && (
              <p className="mt-3 text-xs leading-5 text-slate-500">
                通关需要：回答不少于 20 个字符，并勾选本关全部通关条件。这里不是形式打卡，要留下你自己的判断。
              </p>
            )}
          </main>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24 lg:self-start">
            <p className="text-sm font-semibold text-slate-950">AI 教练提示</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              {[
                ["hint", "提示一下"],
                ["example", "举个例子"],
                ["check", "检查答案"],
              ].map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => dispatch({ type: "SET_COACH_MODE", payload: mode as "hint" | "example" | "check" })}
                  className={[
                    "rounded-lg border px-2 py-1.5 font-semibold transition",
                    coachMode === mode ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-bridge-400",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
            <CoachPanel
              mode={coachMode}
              stage={activeStage}
              answer={activeState.answer}
              caseTitle={caseSeed?.title ?? title}
              problemText={problemText}
              stageSeed={activeSeed}
            />
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
              AI 可以提示、举例和检查，但不能替你完成最终模型判断，也不会生成可直接提交的论文正文。
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
