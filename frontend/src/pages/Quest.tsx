import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CoachPanel } from "../components/quest/CoachPanel";
import { PageHead } from "../components/ui/PageHead";
import { getCase } from "../api/client";
import { promptsForStage } from "../content/prompts";
import { getLocalCase, listLocalCases } from "../data/localCases";
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
import { prefillPromptVars } from "./library/PromptDetail";
import { saveWorkbenchRecord } from "../state/localRecords";

const DEFAULT_PROBLEM =
  "某市共享单车管理部门希望你基于历史订单数据，预测未来一周各区域需求量，并在车辆总数约束下给出调度方案，使缺车率与运营成本综合最优。请建立数学模型并给出求解思路。";

const COACH_MODES = [
  ["hint", "提示一下"],
  ["example", "举个例子"],
  ["check", "检查答案"],
] as const;

/**
 * 七关实战 (design doc §5.4). Stage logic, drafts and reports are unchanged;
 * this page only re-lays them out in the V2 system and applies Q4:
 * every stage can be previewed and drafted, “确认完成” still goes in order.
 */
export function QuestPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const caseSlug = params.get("case");
  const sourceId = caseSlug ? `case:${caseSlug}` : "default";
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [loadError, setLoadError] = useState("");
  const [questState, dispatch] = useQuestState(sourceId);
  const { states, checks, activeStageId, coachMode, saveStatus, loadedSourceId } = questState;
  const workArea = useRef<HTMLDivElement>(null);
  const cases = useMemo(listLocalCases, []);

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
        if (cancelled) return;
        // Static hosting has no case API: the bundled teaching cases are the same content.
        const local = getLocalCase(caseSlug);
        if (local) setCaseDetail(local);
        else setLoadError("没有找到这道训练题，当前显示默认训练题。");
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
    saveQuestDraft(sourceId, { activeStageId, states, checks, updatedAt: new Date().toISOString() });
  }, [activeStageId, checks, loadedSourceId, sourceId, states]);

  const activeStage = questStages.find((stage) => stage.id === activeStageId) ?? questStages[0];
  const activeState = states.find((state) => state.stageId === activeStage.id) ?? states[0];
  const caseSeed = getCaseQuestSeed(caseSlug);
  const activeSeed = getStageSeed(caseSlug, activeStage.id);
  const modelCards = activeStage.id === "model" ? getModelCardsForCase(caseSlug) : [];
  const progress = getQuestProgress(states);
  const title = caseDetail?.title ?? "默认训练题：共享单车需求与调度";
  const sourceLabel = caseDetail ? `案例训练副本：${caseDetail.title}` : "默认示例题";
  const problemText = useMemo(() => {
    if (!caseDetail) return DEFAULT_PROBLEM;
    return [caseDetail.summary, caseDetail.sections.background].filter(Boolean).join("\n\n");
  }, [caseDetail]);
  const unlock = getStageUnlockState(activeStage.id, states);
  const blockedBy = questStages.find((s) => s.order < activeStage.order && !states.find((x) => x.stageId === s.id)?.completed);
  const checkedConditions = checks[activeStage.id] ?? [];
  const answerReady = activeState.answer.trim().length >= 20;
  const allChecked = checkedConditions.every(Boolean);
  const canComplete = unlock !== "locked" && answerReady && allChecked;
  const relatedPrompts = promptsForStage(activeStage.id);
  const here = `/quest${caseSlug ? `?case=${encodeURIComponent(caseSlug)}` : ""}`;
  const report = buildQuestReportMarkdown({
    title,
    sourceLabel,
    states,
    checks,
    aiUsageNote: "本次七关实战使用站内课程预置的教练提示卡，未调用在线 AI。如在外部 AI 工具中使用了提示词库模板，请在最终报告中补充工具、时间和人工确认记录。",
  });

  function selectStage(stage: QuestStage) {
    dispatch({ type: "SET_ACTIVE_STAGE", payload: stage.id });
    if (window.matchMedia?.("(max-width: 899px)").matches) workArea.current?.scrollIntoView({ block: "start" });
  }

  function completeStage(stage: QuestStage) {
    const nextStage = questStages[stage.order];
    dispatch({ type: "COMPLETE_STAGE", payload: { stageId: stage.id, nextStageId: nextStage?.id ?? null } });
  }

  function saveReport() {
    saveWorkbenchRecord({
      title: `七关实战报告：${title}`,
      summary: `完成进度：${progress.completed}/${progress.total}（${progress.percent}%）`,
      fullReport: report,
      usageLog: "七关实战：课程预置教练提示 + 人工确认。未自动生成可提交论文。",
    });
    dispatch({ type: "SET_SAVE_STATUS", payload: "已保存到本机学习记录。" });
  }

  function reset() {
    if (!window.confirm(`确定重置「${title}」的七关进度吗？本题 7 关的作答和勾选都会清空，已保存的实战报告不受影响。`)) return;
    dispatch({ type: "RESET", payload: { sourceId } });
  }

  return (
    <div className="quest-page">
      <PageHead
        crumbs={[{ label: "实战", to: "/quest" }, { label: caseDetail ? caseDetail.title : "默认训练题" }]}
        title="七关实战"
        lead="围绕一道题走完 7 关：读题、拆解、数据、模型、代码、图表、论文框架。教练提示只给方向，判断由你完成。"
      >
        <p className="quest-progress" aria-label={`进度 ${progress.completed} / ${progress.total}`}>
          <strong>{progress.percent}%</strong>
          <span>
            {progress.completed}/{progress.total} 关已通关
          </span>
        </p>
      </PageHead>

      <div className="site-container">
        {loadError && <p className="notice notice-warn">{loadError}</p>}

        <section className="quest-problem" aria-labelledby="quest-problem-title">
          <div className="quest-problem-head">
            <div>
              <p className="page-kicker">{caseDetail ? "教学案例训练题" : "默认训练题"}</p>
              <h2 id="quest-problem-title">{title}</h2>
            </div>
            <label className="quest-switch">
              <span>换一道训练题</span>
              <select
                value={caseSlug ?? ""}
                onChange={(e) => navigate(e.target.value ? `/quest?case=${encodeURIComponent(e.target.value)}` : "/quest")}
              >
                <option value="">默认训练题：共享单车需求与调度</option>
                {cases.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <details className="quest-problem-text" open>
            <summary>题面</summary>
            <p>{problemText}</p>
            {caseDetail && (
              <Link className="text-link" to={`/cases/${caseDetail.slug}`}>
                查看完整案例拆解 →
              </Link>
            )}
          </details>
        </section>

        <nav className="stage-bar" aria-label="七关进度">
          <ol>
            {questStages.map((stage) => {
              const state = getStageUnlockState(stage.id, states);
              const active = stage.id === activeStage.id;
              const label = state === "completed" ? "已通关" : state === "available" ? "可挑战" : "可预览";
              return (
                <li key={stage.id}>
                  <button
                    type="button"
                    className={`stage-step is-${state}`}
                    aria-current={active ? "step" : undefined}
                    onClick={() => selectStage(stage)}
                  >
                    <span className="stage-num" aria-hidden="true">
                      {state === "completed" ? "✓" : stage.order}
                    </span>
                    <span className="stage-text">
                      <span className="stage-name">{stage.title}</span>
                      <span className="stage-state">{label}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="quest-layout">
          <div className="quest-work" ref={workArea}>
            <p className="page-kicker">
              第 {activeStage.order} 关 · 产出：{activeStage.outputLabel}
            </p>
            <h2 className="quest-stage-title">{activeStage.title}</h2>
            <p className="quest-goal">{activeStage.goal}</p>
            {unlock === "locked" && blockedBy && (
              <p className="notice notice-info">
                预览模式：可以先阅读任务、写草稿；需先完成第 {blockedBy.order} 关「{blockedBy.title}」，才能确认完成本关。
              </p>
            )}

            <div className="quest-task">
              <h3>当前任务</h3>
              <p>{activeSeed?.taskBrief ?? activeStage.task}</p>
            </div>

            {activeSeed && (
              <div className="quest-two">
                <section className="quest-box">
                  <h3>常见错误</h3>
                  <ul>
                    {activeSeed.commonMistakes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
                <section className="quest-box">
                  <h3>必须自己完成</h3>
                  <p>{activeSeed.mustDoByStudent}</p>
                  <p className="quest-compliance">{activeSeed.complianceNote}</p>
                </section>
              </div>
            )}

            {activeSeed?.outputExample && (
              <details className="quest-box">
                <summary>通关产物示例</summary>
                <pre>{activeSeed.outputExample}</pre>
              </details>
            )}

            {modelCards.length > 0 && (
              <section className="quest-box">
                <h3>模型参考卡</h3>
                <div className="quest-cards">
                  {modelCards.map((card) => (
                    <article key={card.modelId}>
                      <strong>{card.name}</strong>
                      <span className="muted-note">
                        {card.family} · {card.level}
                      </span>
                      <p>{card.fitWhen}</p>
                      <details>
                        <summary>新手判断问题</summary>
                        <ul>
                          {card.noviceQuestions.slice(0, 3).map((question) => (
                            <li key={question}>{question}</li>
                          ))}
                        </ul>
                      </details>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <label className="quest-answer">
              <span>{activeSeed?.studentPrompt ?? activeStage.userPrompt}</span>
              <textarea
                value={activeState.answer}
                rows={8}
                onChange={(e) => dispatch({ type: "SET_ANSWER", payload: { stageId: activeStage.id, answer: e.target.value } })}
              />
              <span className="muted-note">
                作答自动保存在本机浏览器 · 已写 {activeState.answer.trim().length} 字（至少 20 字）
              </span>
            </label>

            <fieldset className="quest-box quest-conditions">
              <legend>通关条件（自检）</legend>
              {activeStage.passConditions.map((condition, index) => (
                <label key={condition}>
                  <input
                    type="checkbox"
                    checked={checkedConditions[index] ?? false}
                    onChange={(e) => dispatch({ type: "SET_CONDITION", payload: { stageId: activeStage.id, index, value: e.target.checked } })}
                  />
                  <span>{condition}</span>
                </label>
              ))}
            </fieldset>

            <div className="quest-actions">
              <button type="button" className="btn btn-primary" disabled={!canComplete} onClick={() => completeStage(activeStage)}>
                {unlock === "completed" ? "已通关 · 重新确认" : activeStage.order === questStages.length ? "确认完成最后一关" : "确认完成，进入下一关"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={saveReport}>
                保存实战报告
              </button>
              <button type="button" className="btn btn-quiet" onClick={reset}>
                重置本题进度
              </button>
              <Link to="/records" className="text-link">
                查看学习记录
              </Link>
            </div>
            <p className="quest-status" role="status">
              {saveStatus}
            </p>
            {!canComplete && (
              <p className="muted-note">
                {unlock === "locked" && blockedBy
                  ? `确认完成需要先完成第 ${blockedBy.order} 关。`
                  : `确认完成需要：${[!answerReady && "作答不少于 20 字", !allChecked && "勾选全部通关条件"].filter(Boolean).join("，")}。这里不是形式打卡，要留下你自己的判断。`}
              </p>
            )}
          </div>

          <aside className="quest-tools" aria-label="本关工具">
            <section className="quest-box">
              <h3>教练提示</h3>
              <p className="muted-note">课程预置内容，不调用在线 AI。</p>
              <div className="segmented-row" role="group" aria-label="提示方式">
                {COACH_MODES.map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={coachMode === mode}
                    onClick={() => dispatch({ type: "SET_COACH_MODE", payload: mode })}
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
            </section>

            <section className="quest-box">
              <h3>相关提示词（{relatedPrompts.length}）</h3>
              {relatedPrompts.length ? (
                <ul className="quest-prompts">
                  {relatedPrompts.map((p) => (
                    <li key={p.id}>
                      <Link
                        to={`/library/prompts/${p.id}?back=${encodeURIComponent(here)}`}
                        onClick={() => prefillPromptVars(p, { problemText })}
                      >
                        {p.title}
                      </Link>
                      <span>{p.summary}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted-note">本关暂无配套模板。</p>
              )}
              <p className="muted-note">提示词只复制到你的剪贴板，供外部工具使用；打开时会预填公开题面，不会带上你的作答。</p>
            </section>

            <p className="notice notice-warn">
              提示可以帮你找方向和自查，但不能替你完成最终模型判断，也不会生成可直接提交的论文正文。
            </p>
          </aside>
        </div>

        <p className="quest-footnote">
          旧版
          <Link className="text-link" to="/workbench">
            AI 工作台（实验）
          </Link>
          需要后端服务，线上静态版本暂不可用。
        </p>
      </div>
    </div>
  );
}
