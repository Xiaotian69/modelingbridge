import type { WorkbenchAnalysis } from "../../types";
import { ConfirmBar } from "../../components/workbench/ConfirmBar";
import { DataTable } from "../../components/workbench/DataTable";
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

export function Step2Data({ data, confirmed, onCheck, onConfirm, onModify, onExplain }: StepProps) {
  return (
    <StepShell>
      <DataTable
        columns={["字段", "作用", "来源", "必须"]}
        rows={data.data_needs.map((d) => [d.field_name, d.data_role, d.source_suggestion, d.required])}
      />
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
        需要人工确认的数据项：{data.data_needs.filter((d) => d.needs_manual_confirm).length}{" "}
        项。外部数据不要让 AI 代替你编来源。
      </p>
      <ConfirmBar
        checked={confirmed}
        onCheck={onCheck}
        label="我确认数据来源与缺失替代方案会人工核实。"
      />
      <StepActions disabled={!confirmed} onConfirm={onConfirm} onModify={onModify} onExplain={onExplain} />
    </StepShell>
  );
}
