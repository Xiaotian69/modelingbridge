import type { ProviderId, StudentLevel, WorkbenchAnalysis } from "../../types";
import { ConfirmBar } from "../../components/workbench/ConfirmBar";
import { Field } from "../../components/workbench/Field";
import { StepActions } from "../../components/workbench/StepActions";

interface Step0Props {
  problemText: string;
  attachmentNote: string;
  level: StudentLevel;
  provider: ProviderId;
  loading: boolean;
  error: string | null;
  data: WorkbenchAnalysis | null;
  confirmed: boolean;
  onProblemTextChange: (v: string) => void;
  onAttachmentNoteChange: (v: string) => void;
  onLevelChange: (v: StudentLevel) => void;
  onAnalyze: () => void;
  onCheck: (v: boolean) => void;
  onConfirm: () => void;
  onModify: () => void;
  onExplain: () => void;
}

export function Step0Problem({
  problemText,
  attachmentNote,
  level,
  provider,
  loading,
  error,
  data,
  confirmed,
  onProblemTextChange,
  onAttachmentNoteChange,
  onLevelChange,
  onAnalyze,
  onCheck,
  onConfirm,
  onModify,
  onExplain,
}: Step0Props) {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        题目全文
        <textarea
          className="mt-1 min-h-40 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-bridge-600 focus:outline-none focus:ring-2 focus:ring-bridge-600/20"
          value={problemText}
          onChange={(e) => onProblemTextChange(e.target.value)}
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        附件说明
        <textarea
          className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-bridge-600 focus:outline-none focus:ring-2 focus:ring-bridge-600/20"
          value={attachmentNote}
          onChange={(e) => onAttachmentNoteChange(e.target.value)}
        />
      </label>
      <label className="block max-w-md text-sm font-medium text-slate-700">
        学习水平自评
        <select
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-bridge-600 focus:outline-none focus:ring-2 focus:ring-bridge-600/20"
          value={level}
          onChange={(e) => onLevelChange(e.target.value as StudentLevel)}
        >
          <option value="beginner">新手</option>
          <option value="intermediate">会 Python / 需要建模脚手架</option>
          <option value="advanced">冲奖 / 更关注检验与表达</option>
        </select>
      </label>
      <div className="max-w-md text-sm">
        <p className="font-medium text-slate-700">运行模式</p>
        <p className="mt-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-700">教学演示</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          公开快照为演示模式，真实 AI 服务不包含在 V3.0 公开快照中。
        </p>
      </div>
      <button
        type="button"
        onClick={onAnalyze}
        disabled={loading || problemText.trim().length < 10}
        className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? "生成中..." : "生成引导结果"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {data && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <p className="font-semibold text-slate-950">AI 题目摘要</p>
          <Field label="题型" value={data.problem_type} />
          <Field label="判断依据" value={data.type_reason} />
          <p className="mt-2 text-xs text-slate-500">
            模式：{data.mode === "demo" ? "演示结构化" : "大模型"} · {data.provider || provider} ·{" "}
            {data.prompt_version}
          </p>
          {data.mode === "demo" && (
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
              这是教学演示结果，不是实时 AI 回复。公开快照不包含真实 AI 服务。
            </p>
          )}
          <ConfirmBar
            checked={confirmed}
            onCheck={onCheck}
            label="我已核对题目与附件说明，准备检查小问是否遗漏。"
          />
          <StepActions
            disabled={!confirmed}
            onConfirm={onConfirm}
            onModify={onModify}
            onExplain={onExplain}
          />
        </div>
      )}
    </div>
  );
}
