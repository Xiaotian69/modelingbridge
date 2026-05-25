import { Button } from "../ui/Button";

export function StepActions({
  disabled,
  onConfirm,
  onModify,
  onExplain,
}: {
  disabled: boolean;
  onConfirm: () => void;
  onModify: () => void;
  onExplain: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      <Button disabled={disabled} onClick={onConfirm}>
        我已确认，下一步
      </Button>
      <Button variant="secondary" onClick={onModify}>
        我要修改输入
      </Button>
      <Button variant="secondary" onClick={onExplain}>
        不懂，解释一下
      </Button>
    </div>
  );
}
