import { Button } from "../../components/ui/Button";
import { ConfirmBar } from "../../components/workbench/ConfirmBar";
import { StepShell } from "../../components/workbench/StepShell";

interface Step7Props {
  confirmed: boolean;
  copyStatus: string;
  onCheck: (v: boolean) => void;
  onModify: () => void;
  onExplain: () => void;
  onSaveRecord: () => void;
  onCopyMarkdown: () => void;
  onCopyUsageLog: () => void;
}

export function Step7Paper({
  confirmed,
  copyStatus,
  onCheck,
  onModify,
  onExplain,
  onSaveRecord,
  onCopyMarkdown,
  onCopyUsageLog,
}: Step7Props) {
  return (
    <StepShell>
      <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
        <li>摘要：问题、方法、结果、结论，须你自己撰写。</li>
        <li>问题重述与假设；符号与数据说明。</li>
        <li>模型建立、求解与结果；灵敏度或稳健性讨论。</li>
        <li>模型评价与改进；参考文献仅列真实可追溯来源。</li>
      </ul>
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
        不输出完整论文正文；最终文字须由你独立完成，平台只提供结构与提示。
      </p>
      <ConfirmBar
        checked={confirmed}
        onCheck={onCheck}
        label="我已阅读论文边界说明并承诺自行完成表达。"
      />
      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          disabled={!confirmed}
          onClick={() => alert("已完成全部步骤卡片。建议保存记录并提交试运行反馈。")}
        >
          完成工作台
        </Button>
        <Button variant="ghost" disabled={!confirmed} onClick={onSaveRecord}>
          保存学习记录
        </Button>
        <Button variant="secondary" disabled={!confirmed} onClick={onCopyMarkdown}>
          复制分析摘要 Markdown
        </Button>
        <Button variant="secondary" disabled={!confirmed} onClick={onCopyUsageLog}>
          复制 AI 使用记录
        </Button>
        <Button variant="secondary" onClick={onModify}>
          我要修改输入
        </Button>
        <Button variant="secondary" onClick={onExplain}>
          不懂，解释一下
        </Button>
      </div>
      {copyStatus && <p className="text-sm text-slate-500">{copyStatus}</p>}
    </StepShell>
  );
}
