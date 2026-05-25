import type { WorkbenchAnalysis } from "../../types";
import { ConfirmBar } from "../../components/workbench/ConfirmBar";
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

export function Step4Code({ data, confirmed, onCheck, onConfirm, onModify, onExplain }: StepProps) {
  return (
    <StepShell>
      <p className="text-sm leading-7 text-slate-700">
        建议目录：<code className="rounded bg-slate-100 px-1">data/</code> 读入与清洗；
        <code className="rounded bg-slate-100 px-1">features/</code> 特征工程；
        <code className="rounded bg-slate-100 px-1">models/</code> 训练与评估；
        <code className="rounded bg-slate-100 px-1">report/</code> 图表与摘要。
      </p>
      <Field label="推荐下一步" value={data.learning.recommended_next} />
      <ol className="list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-700">
        {data.action_list.slice(0, 4).map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ol>
      <ConfirmBar
        checked={confirmed}
        onCheck={onCheck}
        label="我已理解代码框架与本地运行责任在我本机。"
      />
      <StepActions disabled={!confirmed} onConfirm={onConfirm} onModify={onModify} onExplain={onExplain} />
    </StepShell>
  );
}
