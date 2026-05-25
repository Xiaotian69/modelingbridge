import type { QuestStage } from "../../quest/stages";

export function CoachPanel({
  mode,
  stage,
  answer,
}: {
  mode: "hint" | "example" | "check";
  stage: QuestStage;
  answer: string;
}) {
  if (mode === "example") {
    return (
      <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
        <p className="font-semibold text-slate-950">可学习示例</p>
        <p className="mt-2">
          你可以先写成"我认为本关的核心是……，原因是……，我还需要人工确认……"。示例只提供结构，不替你填写最终答案。
        </p>
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
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {stage.coachHints.map((hint) => (
        <p key={hint} className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
          {hint}
        </p>
      ))}
    </div>
  );
}
