import type { QuestStage } from "../../quest/stages";
import { getCoachPrompt, type CoachMode, type QuestStageSeed } from "../../quest/content";

export function CoachPanel({
  mode,
  stage,
  answer,
  caseTitle,
  problemText,
  stageSeed,
}: {
  mode: CoachMode;
  stage: QuestStage;
  answer: string;
  caseTitle: string;
  problemText: string;
  stageSeed?: QuestStageSeed | null;
}) {
  const prompt = getCoachPrompt(stage.id, mode);
  const promptContext = prompt ? `${caseTitle} · ${stage.title} · ${problemText.slice(0, 36)}${problemText.length > 36 ? "..." : ""}` : "";

  if (mode === "example") {
    return (
      <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
        <p className="font-semibold text-slate-950">可学习示例</p>
        <p className="mt-2">
          你可以先写成"我认为本关的核心是……，原因是……，我还需要人工确认……"。示例只提供结构，不替你填写最终答案。
        </p>
        {prompt && <p className="mt-3 text-xs leading-5 text-slate-500">{prompt.outputFormat}</p>}
      </div>
    );
  }

  if (mode === "check") {
    const enough = answer.trim().length >= 20;
    return (
      <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
        <p className="font-semibold text-slate-950">检查结果</p>
        <p className="mt-2">
          {enough
            ? "你的回答已有基本长度，下一步检查是否覆盖通关条件。"
            : "回答还太短，先写出自己的判断，再让 AI 帮你检查。"}
        </p>
        <p className="mt-2">重点看：是否有目标、理由、不确定点和人工确认内容。</p>
        {prompt && <p className="mt-3 text-xs leading-5 text-slate-500">{prompt.prohibitions}</p>}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {(stageSeed?.coachHints ?? stage.coachHints).map((hint) => (
        <p key={hint} className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
          {hint}
        </p>
      ))}
      {prompt && <p className="rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-500">提示模板：{prompt.promptId} · {promptContext}</p>}
    </div>
  );
}
