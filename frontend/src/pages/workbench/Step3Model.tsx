import type { WorkbenchAnalysis } from "../../types";
import { ConfirmBar } from "../../components/workbench/ConfirmBar";
import { ModelRecommendationCard } from "../../components/workbench/ModelRecommendationCard";
import { StepActions } from "../../components/workbench/StepActions";
import { StepShell } from "../../components/workbench/StepShell";

interface StepProps {
  data: WorkbenchAnalysis;
  confirmed: boolean;
  onCheck: (v: boolean) => void;
  onConfirm: () => void;
  onModify: () => void;
  onExplain: () => void;
  onCopyModelPrompt: (name: string) => void;
}

export function Step3Model({
  data,
  confirmed,
  onCheck,
  onConfirm,
  onModify,
  onExplain,
  onCopyModelPrompt,
}: StepProps) {
  return (
    <StepShell>
      <div className="grid gap-4 md:grid-cols-2">
        {data.models.map((model) => (
          <ModelRecommendationCard
            key={`${model.name}-${model.tier}`}
            model={model}
            onCopyPrompt={() => onCopyModelPrompt(model.name)}
          />
        ))}
      </div>
      <ConfirmBar
        checked={confirmed}
        onCheck={onCheck}
        label="我已选择并理解主线模型，包括它的检验方式和局限。"
      />
      <StepActions disabled={!confirmed} onConfirm={onConfirm} onModify={onModify} onExplain={onExplain} />
    </StepShell>
  );
}
