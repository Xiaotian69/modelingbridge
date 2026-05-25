import type { WorkbenchAnalysis } from "../../types";
import { ConfirmBar } from "../../components/workbench/ConfirmBar";
import { DataTable } from "../../components/workbench/DataTable";
import { Field } from "../../components/workbench/Field";
import { StepActions } from "../../components/workbench/StepActions";
import { StepShell } from "../../components/workbench/StepShell";

interface StepProps {
  data: WorkbenchAnalysis;
  confirmed: boolean;
  onCheck: (v: boolean) => void;
  onConfirm: () => void;
  onModify: () => void;
  onExplain: () => void;
}

export function Step1Tasks({ data, confirmed, onCheck, onConfirm, onModify, onExplain }: StepProps) {
  return (
    <StepShell>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="主要题型" value={data.problem_type} />
        <Field label="混合题型可能" value={data.mixed_types} />
        <Field label="建模主线" value={data.modeling_mainline} />
        <Field label="需你确认" value={data.type_confirm_notes} />
      </div>
      <DataTable
        columns={["#", "直接目标", "隐含目标", "输出"]}
        rows={data.subtasks.map((s) => [String(s.index), s.direct_goal, s.implicit_goal, s.outputs])}
      />
      <ConfirmBar
        checked={confirmed}
        onCheck={onCheck}
        label="我确认小问与目标理解无明显遗漏，或已知道需要修改哪里。"
      />
      <StepActions disabled={!confirmed} onConfirm={onConfirm} onModify={onModify} onExplain={onExplain} />
    </StepShell>
  );
}
