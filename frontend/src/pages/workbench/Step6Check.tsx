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

export function Step6Check({ data, confirmed, onCheck, onConfirm, onModify, onExplain }: StepProps) {
  return (
    <StepShell>
      <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
        <li>样本划分与数据泄漏检查；缺失与异常值处理是否记录。</li>
        <li>交叉验证 / 滚动预测 / 残差与白噪声，按题型选用。</li>
        <li>灵敏度分析：关键参数变动对结论的影响。</li>
        <li>优化类：硬约束可行性、边界案例与目标平衡。</li>
      </ul>
      <Field label="检验与风险" value={data.learning.common_mistakes} />
      <ConfirmBar
        checked={confirmed}
        onCheck={onCheck}
        label="我确认将按清单完成检验并记录局限。"
      />
      <StepActions disabled={!confirmed} onConfirm={onConfirm} onModify={onModify} onExplain={onExplain} />
    </StepShell>
  );
}
