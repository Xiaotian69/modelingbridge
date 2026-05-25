import type { WorkbenchAnalysis } from "../../types";
import { ConfirmBar } from "../../components/workbench/ConfirmBar";
import { Field } from "../../components/workbench/Field";
import { StepActions } from "../../components/workbench/StepActions";
import { StepShell } from "../../components/workbench/StepShell";

interface StepProps {
  data: WorkbenchAnalysis;
  confirmed: boolean;
  resultNotes: string;
  onCheck: (v: boolean) => void;
  onConfirm: () => void;
  onModify: () => void;
  onExplain: () => void;
  onResultNotesChange: (v: string) => void;
}

export function Step5Results({
  data,
  confirmed,
  resultNotes,
  onCheck,
  onConfirm,
  onModify,
  onExplain,
  onResultNotesChange,
}: StepProps) {
  return (
    <StepShell>
      <Field label="做到怎样算合格" value={data.learning.done_criteria} />
      <Field label="你必须确认" value={data.learning.student_must_confirm} />
      <label className="block text-sm font-medium text-slate-700">
        粘贴你的结果要点、图表结论或异常
        <textarea
          className="mt-1 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={resultNotes}
          onChange={(e) => onResultNotesChange(e.target.value)}
        />
      </label>
      <ConfirmBar
        checked={confirmed}
        onCheck={onCheck}
        label="我确认数值与结论表述已自查，未夸大 AI 输出。"
      />
      <StepActions disabled={!confirmed} onConfirm={onConfirm} onModify={onModify} onExplain={onExplain} />
    </StepShell>
  );
}
