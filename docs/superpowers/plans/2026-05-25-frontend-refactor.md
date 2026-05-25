# Frontend Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 三阶段重构前端：提取公共组件和工具函数 → 拆分大文件 → useReducer 重构状态

**Architecture:** Stage A 建目录/提取组件/utils；Stage B 拆分 Workbench(699行)和 Quest(340行)；Stage C 用 useReducer 替换散乱 useState。全程保持现有测试通过。

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vite, Vitest

---

## File Map

**新增：**
- `src/utils/markdownBuilder.ts` — Workbench 的三个 markdown 函数 + Records 的两个
- `src/components/ui/Button.tsx` — variant(primary/secondary/ghost) × size(sm/md/lg)
- `src/components/ui/Card.tsx` — variant(quiet/interactive/glass)
- `src/components/ui/Badge.tsx` — variant(default/success/locked/ai)
- `src/components/workbench/StepShell.tsx` — 从 Workbench.tsx 提取
- `src/components/workbench/Field.tsx` — 从 Workbench.tsx 提取
- `src/components/workbench/DataTable.tsx` — 从 Workbench.tsx 提取
- `src/components/workbench/ConfirmBar.tsx` — 从 Workbench.tsx 提取
- `src/components/workbench/StepActions.tsx` — 从 Workbench.tsx 提取
- `src/components/workbench/ModelRecommendationCard.tsx` — 从 Workbench.tsx 提取
- `src/components/quest/CoachPanel.tsx` — 从 Quest.tsx 提取
- `src/pages/workbench/Step0Problem.tsx` — step 0 输入表单
- `src/pages/workbench/Step1Tasks.tsx` — step 1~6 内容各一文件
- `src/pages/workbench/Step2Data.tsx`
- `src/pages/workbench/Step3Model.tsx`
- `src/pages/workbench/Step4Code.tsx`
- `src/pages/workbench/Step5Results.tsx`
- `src/pages/workbench/Step6Check.tsx`
- `src/pages/workbench/Step7Paper.tsx`
- `src/hooks/useWorkbenchState.ts` — 13个useState → useReducer
- `src/hooks/useQuestState.ts` — Quest useState → useReducer

**修改：**
- `src/pages/Workbench.tsx` — 精简为协调器(~100行)
- `src/pages/Quest.tsx` — 精简为入口(~120行)
- `src/pages/Records.tsx` — 改用 markdownBuilder

---

### Task 1: markdownBuilder utility

**Files:**
- Create: `frontend/src/utils/markdownBuilder.ts`
- Modify: `frontend/src/pages/Workbench.tsx` (移除三个函数，改 import)
- Modify: `frontend/src/pages/Records.tsx` (移除两个函数，改 import)

- [ ] **Step 1: 创建 markdownBuilder.ts**

```ts
// frontend/src/utils/markdownBuilder.ts
import type { ProviderId, StudentLevel, WorkbenchAnalysis } from "../types";
import type { StoredRecord } from "../pages/Records";

export interface WorkbenchMarkdownContext {
  problemText: string;
  attachmentNote: string;
  level: StudentLevel;
  provider: ProviderId;
  resultNotes: string;
}

export function buildWorkbenchSummary(
  d: WorkbenchAnalysis,
  ctx: { confirmedCount: number; stepCount: number; resultNotes: string }
): string {
  return [
    `题型：${d.problem_type}`,
    `主线：${d.modeling_mainline}`,
    `小问数：${d.subtasks.length}`,
    `数据字段数：${d.data_needs.length}`,
    `模型候选数：${d.models.length}`,
    `已确认节点：${ctx.confirmedCount}/${ctx.stepCount}`,
    "",
    "学习提示：",
    d.learning.recommended_next,
    "",
    "结果要点（自填）：",
    ctx.resultNotes || "（未填写）",
  ].join("\n");
}

export function buildWorkbenchUsageLog(
  d: WorkbenchAnalysis,
  ctx: WorkbenchMarkdownContext & { confirmed: boolean[]; stepTitles: string[] }
): string {
  const confirmedSteps = ctx.stepTitles.filter((_, i) => ctx.confirmed[i]);
  return [
    "AI 使用记录（试运行版）",
    `时间：${new Date().toLocaleString()}`,
    `工具：模桥 ModelingBridge AI 引导工作台`,
    `模式：${d.mode === "demo" ? "演示结构化输出" : "大模型接口输出"}`,
    `模型提供方：${d.provider || ctx.provider}`,
    `提示词版本：${d.prompt_version}`,
    `学生水平自评：${ctx.level}`,
    "",
    "输入摘要：",
    ctx.problemText.slice(0, 500),
    "",
    "附件说明：",
    ctx.attachmentNote || "无",
    "",
    "AI 输出摘要：",
    `题型：${d.problem_type}`,
    `建模主线：${d.modeling_mainline}`,
    `数据需求数量：${d.data_needs.length}`,
    `模型候选数量：${d.models.length}`,
    "",
    "人工确认节点：",
    confirmedSteps.length ? confirmedSteps.join("、") : "尚未确认",
    "",
    "人工补充/结果要点：",
    ctx.resultNotes || "暂无",
    "",
    "边界说明：本记录仅说明 AI 辅助拆解、解释和建议过程，不代表可直接提交的论文正文。",
  ].join("\n");
}

export function buildWorkbenchAnalysis(
  d: WorkbenchAnalysis,
  ctx: WorkbenchMarkdownContext
): string {
  return [
    "# AI 引导建模分析摘要",
    "",
    `生成时间：${new Date().toLocaleString()}`,
    `模型提供方：${d.provider || ctx.provider}`,
    `生成模式：${d.mode === "demo" ? "演示结构化输出" : "大模型接口输出"}`,
    `提示词版本：${d.prompt_version}`,
    `学生水平自评：${ctx.level}`,
    "",
    "## 题目摘要",
    ctx.problemText.slice(0, 800),
    "",
    "## 附件说明",
    ctx.attachmentNote || "无",
    "",
    "## 题型与建模主线",
    `- 题型：${d.problem_type}`,
    `- 混合题型可能：${d.mixed_types}`,
    `- 判断依据：${d.type_reason}`,
    `- 建模主线：${d.modeling_mainline}`,
    `- 需人工确认：${d.type_confirm_notes}`,
    "",
    "## 小问拆解",
    ...d.subtasks.map((s) => `- ${s.index}. ${s.direct_goal}；隐含目标：${s.implicit_goal}；输出：${s.outputs}`),
    "",
    "## 数据需求",
    ...d.data_needs.map((item) => `- ${item.field_name}：${item.data_role}；来源建议：${item.source_suggestion}；必须：${item.required}`),
    "",
    "## 模型候选",
    ...d.models.map((item) => `- ${item.name}（${item.tier}）：${item.reason}；局限：${item.cons}`),
    "",
    "## 行动清单",
    ...d.action_list.map((item) => `- ${item}`),
    "",
    "## 学习提示",
    d.learning.recommended_next,
    "",
    "## 人工补充",
    ctx.resultNotes || "暂无",
    "",
    "## 合规边界",
    "本摘要仅用于学习复盘和人工确认，不是可直接提交的论文正文；数据来源、模型假设、计算结果和最终表述仍需学生自行核验与完成。",
  ].join("\n");
}

export function recordToMarkdown(record: StoredRecord, index?: number): string {
  return [
    `## ${index === undefined ? "" : `${index + 1}. `}${record.title || "未命名题目"}`,
    "",
    `保存时间：${new Date(record.savedAt).toLocaleString()}`,
    "",
    "### 输出摘要",
    record.summary || "未填写",
    "",
    "### AI 使用记录",
    record.usageLog || "未保存",
    "",
  ].join("\n");
}

export function recordsToMarkdown(rows: StoredRecord[]): string {
  return [
    "# 学习记录导出",
    "",
    `导出时间：${new Date().toLocaleString()}`,
    `记录数量：${rows.length}`,
    "",
    ...rows.map((record, index) => recordToMarkdown(record, index)),
  ].join("\n");
}
```

- [ ] **Step 2: 运行现有测试，确认基线通过**

```
cd frontend && npx vitest run
```
Expected: 11 tests pass

- [ ] **Step 3: 更新 Records.tsx，从 markdownBuilder import**

在 Records.tsx 中删除 `recordToMarkdown` 和 `recordsToMarkdown` 函数定义，改为：
```ts
import { recordToMarkdown, recordsToMarkdown } from "../utils/markdownBuilder";
```

- [ ] **Step 4: 运行测试确认通过**

```
cd frontend && npx vitest run
```

---

### Task 2: UI 基础组件

**Files:**
- Create: `frontend/src/components/ui/Button.tsx`
- Create: `frontend/src/components/ui/Card.tsx`
- Create: `frontend/src/components/ui/Badge.tsx`

- [ ] **Step 1: 创建 Button.tsx**

```tsx
// frontend/src/components/ui/Button.tsx
import { type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-bridge-700 text-white hover:bg-bridge-600 disabled:opacity-40",
  secondary: "border border-slate-300 bg-white text-slate-800 hover:border-slate-500 disabled:opacity-50",
  ghost: "border border-bridge-600 bg-white text-bridge-800 hover:bg-bridge-50 disabled:opacity-50",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={[
        "rounded-lg font-semibold transition",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {loading ? "加载中..." : children}
    </button>
  );
}
```

- [ ] **Step 2: 创建 Card.tsx**

```tsx
// frontend/src/components/ui/Card.tsx
import { type ReactNode } from "react";

type CardVariant = "quiet" | "interactive" | "glass";

interface CardProps {
  variant?: CardVariant;
  className?: string;
  children: ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  quiet: "quiet-card",
  interactive: "interactive-card",
  glass: "glass-panel",
};

export function Card({ variant = "quiet", className, children }: CardProps) {
  return (
    <div className={[variantClasses[variant], className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: 创建 Badge.tsx**

```tsx
// frontend/src/components/ui/Badge.tsx
import { type ReactNode } from "react";

type BadgeVariant = "default" | "success" | "locked" | "ai";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "border border-white/15 bg-white/10 text-emerald-100",
  success: "border border-emerald-200 bg-emerald-50 text-emerald-900",
  locked: "border border-slate-100 bg-slate-50 text-slate-400",
  ai: "border border-bridge-200 bg-bridge-50 text-bridge-800",
};

export function Badge({ variant = "default", children }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex rounded-md px-3 py-1 text-xs font-semibold",
        variantClasses[variant],
      ].join(" ")}
    >
      {children}
    </span>
  );
}
```

---

### Task 3: 提取 Workbench 子组件

**Files:**
- Create: `frontend/src/components/workbench/StepShell.tsx`
- Create: `frontend/src/components/workbench/Field.tsx`
- Create: `frontend/src/components/workbench/DataTable.tsx`
- Create: `frontend/src/components/workbench/ConfirmBar.tsx`
- Create: `frontend/src/components/workbench/StepActions.tsx`
- Create: `frontend/src/components/workbench/ModelRecommendationCard.tsx`
- Modify: `frontend/src/pages/Workbench.tsx`

- [ ] **Step 1: 创建六个组件文件**（见下方代码）

```tsx
// frontend/src/components/workbench/StepShell.tsx
import { type ReactNode } from "react";
export function StepShell({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}
```

```tsx
// frontend/src/components/workbench/Field.tsx
export function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-800">{value}</p>
    </div>
  );
}
```

```tsx
// frontend/src/components/workbench/DataTable.tsx
export function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-xs text-slate-600">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-3 py-2 text-left font-semibold">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row[0]}-${i}`} className="border-t border-slate-100 align-top">
              {row.map((cell, j) => (
                <td key={`${cell}-${j}`} className="px-3 py-3 leading-6 text-slate-700">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

```tsx
// frontend/src/components/workbench/ConfirmBar.tsx
export function ConfirmBar({
  checked,
  onCheck,
  label,
}: {
  checked: boolean;
  onCheck: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-slate-300 text-bridge-700"
        checked={checked}
        onChange={(e) => onCheck(e.target.checked)}
      />
      <span className="text-sm leading-6 text-slate-800">{label}</span>
    </label>
  );
}
```

```tsx
// frontend/src/components/workbench/StepActions.tsx
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
      <Button disabled={disabled} onClick={onConfirm}>我已确认，下一步</Button>
      <Button variant="secondary" onClick={onModify}>我要修改输入</Button>
      <Button variant="secondary" onClick={onExplain}>不懂，解释一下</Button>
    </div>
  );
}
```

```tsx
// frontend/src/components/workbench/ModelRecommendationCard.tsx
import { Link } from "react-router-dom";
import { findModelMethod } from "../../data/modelingContent";
import { Button } from "../ui/Button";
import type { WorkbenchAnalysis } from "../../types";

export function ModelRecommendationCard({
  model,
  onCopyPrompt,
}: {
  model: WorkbenchAnalysis["models"][number];
  onCopyPrompt: () => void;
}) {
  const method = findModelMethod(model.name);
  return (
    <article className="interactive-card rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-bridge-700">{model.tier} · {model.model_type}</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">{model.name}</h3>
        </div>
        {method && (
          <Link
            to={`/learn#model-${method.slug}`}
            className="rounded-full bg-bridge-50 px-3 py-1 text-xs font-semibold text-bridge-800 hover:bg-bridge-100"
          >
            学方法
          </Link>
        )}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{model.reason}</p>
      <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
        <p className="rounded-xl bg-slate-50 p-3">输入：{model.inputs}</p>
        <p className="rounded-xl bg-slate-50 p-3">输出：{model.outputs}</p>
        <p className="rounded-xl bg-amber-50 p-3 text-amber-900">局限：{model.cons}</p>
        <p className="rounded-xl bg-emerald-50 p-3 text-emerald-900">检验：{model.validation}</p>
      </div>
      <Button variant="secondary" size="sm" className="mt-4" onClick={onCopyPrompt}>
        复制问答式学习提示
      </Button>
    </article>
  );
}
```

- [ ] **Step 2: 更新 Workbench.tsx 中的 import，删除本地函数定义**

在 Workbench.tsx 顶部 import 中添加：
```ts
import { StepShell } from "../components/workbench/StepShell";
import { Field } from "../components/workbench/Field";
import { DataTable } from "../components/workbench/DataTable";
import { ConfirmBar } from "../components/workbench/ConfirmBar";
import { StepActions } from "../components/workbench/StepActions";
import { ModelRecommendationCard } from "../components/workbench/ModelRecommendationCard";
```

删除文件末尾的六个函数定义（StepShell、Field、DataTable、ModelRecommendationCard、ConfirmBar、StepActions）。

- [ ] **Step 3: 运行测试确认无破坏**

```
cd frontend && npx vitest run
```
Expected: 11 tests pass, build passes

---

### Task 4: 提取 CoachPanel

**Files:**
- Create: `frontend/src/components/quest/CoachPanel.tsx`
- Modify: `frontend/src/pages/Quest.tsx`

- [ ] **Step 1: 创建 CoachPanel.tsx**

```tsx
// frontend/src/components/quest/CoachPanel.tsx
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
```

- [ ] **Step 2: 更新 Quest.tsx**

在 Quest.tsx 顶部添加：
```ts
import { CoachPanel } from "../components/quest/CoachPanel";
```

删除文件末尾的 `CoachPanel` 函数定义（第307-339行）。

- [ ] **Step 3: 运行测试**

```
cd frontend && npx vitest run
```

---

### Task 5: 拆分 Workbench 步骤文件

**Files:**
- Create: `frontend/src/pages/workbench/Step0Problem.tsx`
- Create: `frontend/src/pages/workbench/Step1Tasks.tsx`
- Create: `frontend/src/pages/workbench/Step2Data.tsx`
- Create: `frontend/src/pages/workbench/Step3Model.tsx`
- Create: `frontend/src/pages/workbench/Step4Code.tsx`
- Create: `frontend/src/pages/workbench/Step5Results.tsx`
- Create: `frontend/src/pages/workbench/Step6Check.tsx`
- Create: `frontend/src/pages/workbench/Step7Paper.tsx`
- Modify: `frontend/src/pages/Workbench.tsx`

每个步骤组件的通用 props 接口（Step1-6）：
```ts
interface StepProps {
  data: WorkbenchAnalysis;
  confirmed: boolean;
  onCheck: (v: boolean) => void;
  onConfirm: () => void;
  onModify: () => void;
  onExplain: () => void;
}
```

- [ ] **Step 1: 创建 Step0Problem.tsx**

```tsx
// frontend/src/pages/workbench/Step0Problem.tsx
import type { LlmProviderInfo, ProviderId, StudentLevel, WorkbenchAnalysis } from "../../types";
import { ConfirmBar } from "../../components/workbench/ConfirmBar";
import { Field } from "../../components/workbench/Field";
import { StepActions } from "../../components/workbench/StepActions";

interface Step0Props {
  problemText: string;
  attachmentNote: string;
  level: StudentLevel;
  provider: ProviderId;
  providers: LlmProviderInfo[];
  loading: boolean;
  error: string | null;
  data: WorkbenchAnalysis | null;
  confirmed: boolean;
  onProblemTextChange: (v: string) => void;
  onAttachmentNoteChange: (v: string) => void;
  onLevelChange: (v: StudentLevel) => void;
  onProviderChange: (v: ProviderId) => void;
  onAnalyze: () => void;
  onCheck: (v: boolean) => void;
  onConfirm: () => void;
  onModify: () => void;
  onExplain: () => void;
}

export function Step0Problem({
  problemText, attachmentNote, level, provider, providers,
  loading, error, data, confirmed,
  onProblemTextChange, onAttachmentNoteChange, onLevelChange, onProviderChange,
  onAnalyze, onCheck, onConfirm, onModify, onExplain,
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
      <label className="block max-w-md text-sm font-medium text-slate-700">
        大模型选择
        <select
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-bridge-600 focus:outline-none focus:ring-2 focus:ring-bridge-600/20"
          value={provider}
          onChange={(e) => onProviderChange(e.target.value as ProviderId)}
        >
          {providers.length === 0 && (
            <>
              <option value="deepseek">DeepSeek</option>
              <option value="mimo">Xiaomi MiMo</option>
            </>
          )}
          {providers.map((item) => (
            <option key={item.id} value={item.id} disabled={!item.enabled}>
              {item.name} · {item.model}{item.enabled ? "" : "（未配置）"}
            </option>
          ))}
        </select>
        {providers.length > 0 && (
          <span className="mt-1 block text-xs leading-5 text-slate-500">
            {providers.find((item) => item.id === provider)?.note}
          </span>
        )}
      </label>
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
            模式：{data.mode === "demo" ? "演示结构化" : "大模型"} · {data.provider || provider} · {data.prompt_version}
          </p>
          {data.mode === "demo" && (
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
              当前返回的是演示回退结果，请检查模型 Key、Base URL 或模型名是否可用。
            </p>
          )}
          <ConfirmBar
            checked={confirmed}
            onCheck={onCheck}
            label="我已核对题目与附件说明，准备检查小问是否遗漏。"
          />
          <StepActions disabled={!confirmed} onConfirm={onConfirm} onModify={onModify} onExplain={onExplain} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 创建 Step1Tasks.tsx**

```tsx
// frontend/src/pages/workbench/Step1Tasks.tsx
import type { WorkbenchAnalysis } from "../../types";
import { StepShell } from "../../components/workbench/StepShell";
import { Field } from "../../components/workbench/Field";
import { DataTable } from "../../components/workbench/DataTable";
import { ConfirmBar } from "../../components/workbench/ConfirmBar";
import { StepActions } from "../../components/workbench/StepActions";

interface StepProps { data: WorkbenchAnalysis; confirmed: boolean; onCheck: (v: boolean) => void; onConfirm: () => void; onModify: () => void; onExplain: () => void; }

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
      <ConfirmBar checked={confirmed} onCheck={onCheck} label="我确认小问与目标理解无明显遗漏，或已知道需要修改哪里。" />
      <StepActions disabled={!confirmed} onConfirm={onConfirm} onModify={onModify} onExplain={onExplain} />
    </StepShell>
  );
}
```

- [ ] **Step 3: 创建 Step2Data.tsx**

```tsx
// frontend/src/pages/workbench/Step2Data.tsx
import type { WorkbenchAnalysis } from "../../types";
import { StepShell } from "../../components/workbench/StepShell";
import { DataTable } from "../../components/workbench/DataTable";
import { ConfirmBar } from "../../components/workbench/ConfirmBar";
import { StepActions } from "../../components/workbench/StepActions";

interface StepProps { data: WorkbenchAnalysis; confirmed: boolean; onCheck: (v: boolean) => void; onConfirm: () => void; onModify: () => void; onExplain: () => void; }

export function Step2Data({ data, confirmed, onCheck, onConfirm, onModify, onExplain }: StepProps) {
  return (
    <StepShell>
      <DataTable
        columns={["字段", "作用", "来源", "必须"]}
        rows={data.data_needs.map((d) => [d.field_name, d.data_role, d.source_suggestion, d.required])}
      />
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
        需要人工确认的数据项：{data.data_needs.filter((d) => d.needs_manual_confirm).length} 项。外部数据不要让 AI 代替你编来源。
      </p>
      <ConfirmBar checked={confirmed} onCheck={onCheck} label="我确认数据来源与缺失替代方案会人工核实。" />
      <StepActions disabled={!confirmed} onConfirm={onConfirm} onModify={onModify} onExplain={onExplain} />
    </StepShell>
  );
}
```

- [ ] **Step 4: 创建 Step3Model.tsx**

```tsx
// frontend/src/pages/workbench/Step3Model.tsx
import type { WorkbenchAnalysis } from "../../types";
import { StepShell } from "../../components/workbench/StepShell";
import { ConfirmBar } from "../../components/workbench/ConfirmBar";
import { StepActions } from "../../components/workbench/StepActions";
import { ModelRecommendationCard } from "../../components/workbench/ModelRecommendationCard";

interface StepProps { data: WorkbenchAnalysis; confirmed: boolean; onCheck: (v: boolean) => void; onConfirm: () => void; onModify: () => void; onExplain: () => void; onCopyModelPrompt: (name: string) => void; }

export function Step3Model({ data, confirmed, onCheck, onConfirm, onModify, onExplain, onCopyModelPrompt }: StepProps) {
  return (
    <StepShell>
      <div className="grid gap-4 md:grid-cols-2">
        {data.models.map((model) => (
          <ModelRecommendationCard key={`${model.name}-${model.tier}`} model={model} onCopyPrompt={() => onCopyModelPrompt(model.name)} />
        ))}
      </div>
      <ConfirmBar checked={confirmed} onCheck={onCheck} label="我已选择并理解主线模型，包括它的检验方式和局限。" />
      <StepActions disabled={!confirmed} onConfirm={onConfirm} onModify={onModify} onExplain={onExplain} />
    </StepShell>
  );
}
```

- [ ] **Step 5: 创建 Step4Code.tsx**

```tsx
// frontend/src/pages/workbench/Step4Code.tsx
import type { WorkbenchAnalysis } from "../../types";
import { StepShell } from "../../components/workbench/StepShell";
import { Field } from "../../components/workbench/Field";
import { ConfirmBar } from "../../components/workbench/ConfirmBar";
import { StepActions } from "../../components/workbench/StepActions";

interface StepProps { data: WorkbenchAnalysis; confirmed: boolean; onCheck: (v: boolean) => void; onConfirm: () => void; onModify: () => void; onExplain: () => void; }

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
        {data.action_list.slice(0, 4).map((a) => <li key={a}>{a}</li>)}
      </ol>
      <ConfirmBar checked={confirmed} onCheck={onCheck} label="我已理解代码框架与本地运行责任在我本机。" />
      <StepActions disabled={!confirmed} onConfirm={onConfirm} onModify={onModify} onExplain={onExplain} />
    </StepShell>
  );
}
```

- [ ] **Step 6: 创建 Step5Results.tsx**

```tsx
// frontend/src/pages/workbench/Step5Results.tsx
import type { WorkbenchAnalysis } from "../../types";
import { StepShell } from "../../components/workbench/StepShell";
import { Field } from "../../components/workbench/Field";
import { ConfirmBar } from "../../components/workbench/ConfirmBar";
import { StepActions } from "../../components/workbench/StepActions";

interface StepProps { data: WorkbenchAnalysis; confirmed: boolean; resultNotes: string; onCheck: (v: boolean) => void; onConfirm: () => void; onModify: () => void; onExplain: () => void; onResultNotesChange: (v: string) => void; }

export function Step5Results({ data, confirmed, resultNotes, onCheck, onConfirm, onModify, onExplain, onResultNotesChange }: StepProps) {
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
      <ConfirmBar checked={confirmed} onCheck={onCheck} label="我确认数值与结论表述已自查，未夸大 AI 输出。" />
      <StepActions disabled={!confirmed} onConfirm={onConfirm} onModify={onModify} onExplain={onExplain} />
    </StepShell>
  );
}
```

- [ ] **Step 7: 创建 Step6Check.tsx**

```tsx
// frontend/src/pages/workbench/Step6Check.tsx
import type { WorkbenchAnalysis } from "../../types";
import { StepShell } from "../../components/workbench/StepShell";
import { Field } from "../../components/workbench/Field";
import { ConfirmBar } from "../../components/workbench/ConfirmBar";
import { StepActions } from "../../components/workbench/StepActions";

interface StepProps { data: WorkbenchAnalysis; confirmed: boolean; onCheck: (v: boolean) => void; onConfirm: () => void; onModify: () => void; onExplain: () => void; }

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
      <ConfirmBar checked={confirmed} onCheck={onCheck} label="我确认将按清单完成检验并记录局限。" />
      <StepActions disabled={!confirmed} onConfirm={onConfirm} onModify={onModify} onExplain={onExplain} />
    </StepShell>
  );
}
```

- [ ] **Step 8: 创建 Step7Paper.tsx**

```tsx
// frontend/src/pages/workbench/Step7Paper.tsx
import type { WorkbenchAnalysis } from "../../types";
import { StepShell } from "../../components/workbench/StepShell";
import { ConfirmBar } from "../../components/workbench/ConfirmBar";
import { Button } from "../../components/ui/Button";

interface Step7Props {
  data: WorkbenchAnalysis;
  confirmed: boolean;
  copyStatus: string;
  onCheck: (v: boolean) => void;
  onModify: () => void;
  onExplain: () => void;
  onSaveRecord: () => void;
  onCopyMarkdown: () => void;
  onCopyUsageLog: () => void;
}

export function Step7Paper({ data: _data, confirmed, copyStatus, onCheck, onModify, onExplain, onSaveRecord, onCopyMarkdown, onCopyUsageLog }: Step7Props) {
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
      <ConfirmBar checked={confirmed} onCheck={onCheck} label="我已阅读论文边界说明并承诺自行完成表达。" />
      <div className="flex flex-wrap gap-2 pt-2">
        <Button disabled={!confirmed} onClick={() => alert("已完成全部步骤卡片。建议保存记录并提交试运行反馈。")}>
          完成工作台
        </Button>
        <Button variant="ghost" disabled={!confirmed} onClick={onSaveRecord}>保存学习记录</Button>
        <Button variant="secondary" disabled={!confirmed} onClick={onCopyMarkdown}>复制分析摘要 Markdown</Button>
        <Button variant="secondary" disabled={!confirmed} onClick={onCopyUsageLog}>复制 AI 使用记录</Button>
        <Button variant="secondary" onClick={onModify}>我要修改输入</Button>
        <Button variant="secondary" onClick={onExplain}>不懂，解释一下</Button>
      </div>
      {copyStatus && <p className="text-sm text-slate-500">{copyStatus}</p>}
    </StepShell>
  );
}
```

- [ ] **Step 9: 重写 Workbench.tsx 为协调器（使用旧版 useState，Stage C 再换 reducer）**

重写 Workbench.tsx，保持原有 useState，但通过 Step 组件渲染内容：
```tsx
// 在 step 渲染区域用 switch 语句替换大段 JSX
const stepContent = !data ? null : (() => {
  const commonProps = {
    data,
    confirmed: confirmed[step],
    onCheck: (v: boolean) => markConfirmed(step, v),
    onConfirm: () => onConfirmStep(step),
    onModify: onNeedModify,
    onExplain: () => setExplainOpen((v) => !v),
  };
  switch (step) {
    case 0: return null; // step 0 渲染在下方 Step0Problem
    case 1: return <Step1Tasks {...commonProps} />;
    case 2: return <Step2Data {...commonProps} />;
    case 3: return <Step3Model {...commonProps} onCopyModelPrompt={copyModelStudyPrompt} />;
    case 4: return <Step4Code {...commonProps} />;
    case 5: return <Step5Results {...commonProps} resultNotes={resultNotes} onResultNotesChange={setResultNotes} />;
    case 6: return <Step6Check {...commonProps} />;
    case 7: return <Step7Paper confirmed={confirmed[7]} copyStatus={copyStatus} onCheck={(v) => markConfirmed(7, v)} onModify={onNeedModify} onExplain={() => setExplainOpen((v) => !v)} onSaveRecord={doSaveRecord} onCopyMarkdown={copyAnalysisMarkdown} onCopyUsageLog={copyUsageLog} />;
    default: return null;
  }
})();
```

- [ ] **Step 10: 运行测试验证**

```
cd frontend && npx vitest run && npx tsc --noEmit
```

---

### Task 6: useWorkbenchState hook

**Files:**
- Create: `frontend/src/hooks/useWorkbenchState.ts`
- Modify: `frontend/src/pages/Workbench.tsx`

- [ ] **Step 1: 创建 useWorkbenchState.ts**

```ts
// frontend/src/hooks/useWorkbenchState.ts
import { useReducer } from "react";
import type { LlmProviderInfo, ProviderId, StudentLevel, WorkbenchAnalysis } from "../types";

const STEPS_COUNT = 8;

export interface WorkbenchState {
  problemText: string;
  attachmentNote: string;
  level: StudentLevel;
  provider: ProviderId;
  providers: LlmProviderInfo[];
  step: number;
  confirmed: boolean[];
  resultNotes: string;
  explainOpen: boolean;
  data: WorkbenchAnalysis | null;
  loading: boolean;
  error: string | null;
  copyStatus: string;
  promptMeta: { workbench_prompt: string; updated: string } | null;
}

export type WorkbenchAction =
  | { type: "SET_PROBLEM_TEXT"; payload: string }
  | { type: "SET_ATTACHMENT_NOTE"; payload: string }
  | { type: "SET_LEVEL"; payload: StudentLevel }
  | { type: "SET_PROVIDER"; payload: ProviderId }
  | { type: "SET_PROVIDERS"; payload: LlmProviderInfo[] }
  | { type: "SET_STEP"; payload: number }
  | { type: "MARK_CONFIRMED"; payload: { index: number; value: boolean } }
  | { type: "SET_RESULT_NOTES"; payload: string }
  | { type: "TOGGLE_EXPLAIN" }
  | { type: "CLOSE_EXPLAIN" }
  | { type: "SET_COPY_STATUS"; payload: string }
  | { type: "SET_PROMPT_META"; payload: WorkbenchState["promptMeta"] }
  | { type: "ANALYZE_START" }
  | { type: "ANALYZE_SUCCESS"; payload: WorkbenchAnalysis }
  | { type: "ANALYZE_ERROR"; payload: string }
  | { type: "CONFIRM_STEP"; payload: number };

function reducer(state: WorkbenchState, action: WorkbenchAction): WorkbenchState {
  switch (action.type) {
    case "SET_PROBLEM_TEXT": return { ...state, problemText: action.payload };
    case "SET_ATTACHMENT_NOTE": return { ...state, attachmentNote: action.payload };
    case "SET_LEVEL": return { ...state, level: action.payload };
    case "SET_PROVIDER": return { ...state, provider: action.payload };
    case "SET_PROVIDERS": return { ...state, providers: action.payload };
    case "SET_STEP": return { ...state, step: action.payload };
    case "MARK_CONFIRMED": {
      const next = [...state.confirmed];
      next[action.payload.index] = action.payload.value;
      return { ...state, confirmed: next };
    }
    case "SET_RESULT_NOTES": return { ...state, resultNotes: action.payload };
    case "TOGGLE_EXPLAIN": return { ...state, explainOpen: !state.explainOpen };
    case "CLOSE_EXPLAIN": return { ...state, explainOpen: false };
    case "SET_COPY_STATUS": return { ...state, copyStatus: action.payload };
    case "SET_PROMPT_META": return { ...state, promptMeta: action.payload };
    case "ANALYZE_START":
      return { ...state, loading: true, error: null, confirmed: Array(STEPS_COUNT).fill(false), step: 0, explainOpen: false, copyStatus: "" };
    case "ANALYZE_SUCCESS":
      return { ...state, loading: false, data: action.payload, confirmed: Array(STEPS_COUNT).fill(false) };
    case "ANALYZE_ERROR":
      return { ...state, loading: false, data: null, error: action.payload };
    case "CONFIRM_STEP": {
      const i = action.payload;
      const next = [...state.confirmed];
      next[i] = true;
      return { ...state, confirmed: next, explainOpen: false, step: i < STEPS_COUNT - 1 ? i + 1 : i };
    }
    default: return state;
  }
}

export function useWorkbenchState(initialProblemText: string, initialAttachmentNote: string) {
  return useReducer(reducer, {
    problemText: initialProblemText,
    attachmentNote: initialAttachmentNote,
    level: "beginner",
    provider: "deepseek",
    providers: [],
    step: 0,
    confirmed: Array(STEPS_COUNT).fill(false),
    resultNotes: "",
    explainOpen: false,
    data: null,
    loading: false,
    error: null,
    copyStatus: "",
    promptMeta: null,
  });
}
```

- [ ] **Step 2: 更新 Workbench.tsx 使用 useWorkbenchState**

将 Workbench.tsx 中的 13 个 `useState` 替换为：
```tsx
import { useWorkbenchState } from "../hooks/useWorkbenchState";

// 在组件顶部
const [searchParams] = useSearchParams();
const initialProblem = searchParams.get("problem_text")?.trim() || DEFAULT_PROBLEM_TEXT;
const initialAttachment = searchParams.get("attachment_note")?.trim() || DEFAULT_ATTACHMENT_NOTE;
const [state, dispatch] = useWorkbenchState(initialProblem, initialAttachment);
const { problemText, attachmentNote, level, provider, providers, step, confirmed, resultNotes, explainOpen, data, loading, error, copyStatus, promptMeta } = state;
```

更新所有事件处理函数，改用 `dispatch`：
```tsx
// 原: setProblemText(v) → dispatch({ type: "SET_PROBLEM_TEXT", payload: v })
// 原: setExplainOpen(v => !v) → dispatch({ type: "TOGGLE_EXPLAIN" })
// 原: markConfirmed(i, v) → dispatch({ type: "MARK_CONFIRMED", payload: { index: i, value: v } })
// 原: onConfirmStep(i) → dispatch({ type: "CONFIRM_STEP", payload: i })
// 原: ANALYZE_START/SUCCESS/ERROR 复合操作 → dispatch 对应 action
```

- [ ] **Step 3: 运行测试和类型检查**

```
cd frontend && npx vitest run && npx tsc --noEmit
```

---

### Task 7: useQuestState hook

**Files:**
- Create: `frontend/src/hooks/useQuestState.ts`
- Modify: `frontend/src/pages/Quest.tsx`

- [ ] **Step 1: 创建 useQuestState.ts**

```ts
// frontend/src/hooks/useQuestState.ts
import { useReducer } from "react";
import { createEmptyQuestStates, updateQuestStageState, questStages } from "../quest/stages";
import type { QuestStageId, QuestStageState } from "../quest/stages";
import type { QuestDraft } from "../quest/storage";

function initialChecks(): Record<QuestStageId, boolean[]> {
  return Object.fromEntries(
    questStages.map((stage) => [stage.id, stage.passConditions.map(() => false)])
  ) as Record<QuestStageId, boolean[]>;
}

export interface QuestState {
  states: QuestStageState[];
  checks: Record<QuestStageId, boolean[]>;
  activeStageId: QuestStageId;
  coachMode: "hint" | "example" | "check";
  saveStatus: string;
  loadedSourceId: string;
}

type QuestAction =
  | { type: "LOAD_DRAFT"; payload: { draft: QuestDraft | null; sourceId: string } }
  | { type: "SET_ANSWER"; payload: { stageId: QuestStageId; answer: string } }
  | { type: "SET_CONDITION"; payload: { stageId: QuestStageId; index: number; value: boolean } }
  | { type: "COMPLETE_STAGE"; payload: { stageId: QuestStageId; nextStageId?: QuestStageId } }
  | { type: "SET_ACTIVE_STAGE"; payload: QuestStageId }
  | { type: "SET_COACH_MODE"; payload: "hint" | "example" | "check" }
  | { type: "SET_SAVE_STATUS"; payload: string }
  | { type: "RESET"; payload: string };

function reducer(state: QuestState, action: QuestAction): QuestState {
  switch (action.type) {
    case "LOAD_DRAFT":
      return {
        ...state,
        states: action.payload.draft?.states ?? createEmptyQuestStates(),
        checks: action.payload.draft?.checks ?? initialChecks(),
        activeStageId: action.payload.draft?.activeStageId ?? "read_problem",
        loadedSourceId: action.payload.sourceId,
        saveStatus: action.payload.draft ? "已恢复上次闯关草稿。" : "",
      };
    case "SET_ANSWER":
      return {
        ...state,
        states: updateQuestStageState(state.states, action.payload.stageId, { answer: action.payload.answer, completed: false }),
        saveStatus: "",
      };
    case "SET_CONDITION":
      return {
        ...state,
        checks: {
          ...state.checks,
          [action.payload.stageId]: state.checks[action.payload.stageId].map(
            (item, i) => (i === action.payload.index ? action.payload.value : item)
          ),
        },
      };
    case "COMPLETE_STAGE": {
      const updated = updateQuestStageState(state.states, action.payload.stageId, { completed: true });
      return { ...state, states: updated, activeStageId: action.payload.nextStageId ?? state.activeStageId };
    }
    case "SET_ACTIVE_STAGE": return { ...state, activeStageId: action.payload };
    case "SET_COACH_MODE": return { ...state, coachMode: action.payload };
    case "SET_SAVE_STATUS": return { ...state, saveStatus: action.payload };
    case "RESET":
      return { ...state, states: createEmptyQuestStates(), checks: initialChecks(), activeStageId: "read_problem", saveStatus: "已重置本次闯关进度。", loadedSourceId: action.payload };
    default: return state;
  }
}

export function useQuestState(sourceId: string) {
  return useReducer(reducer, {
    states: createEmptyQuestStates(),
    checks: initialChecks(),
    activeStageId: "read_problem" as QuestStageId,
    coachMode: "hint",
    saveStatus: "",
    loadedSourceId: sourceId,
  });
}
```

- [ ] **Step 2: 更新 Quest.tsx 使用 useQuestState**

将 Quest.tsx 中的 useState 替换为：
```tsx
import { useQuestState } from "../hooks/useQuestState";

const [questState, dispatch] = useQuestState(sourceId);
const { states, checks, activeStageId, coachMode, saveStatus, loadedSourceId } = questState;
```

更新所有事件处理，改用 dispatch：
```tsx
// setStates → dispatch({ type: "SET_ANSWER", ... }) 或 COMPLETE_STAGE
// setChecks → dispatch({ type: "SET_CONDITION", ... })
// setActiveStageId → dispatch({ type: "SET_ACTIVE_STAGE", ... })
// setCoachMode → dispatch({ type: "SET_COACH_MODE", ... })
// setSaveStatus → dispatch({ type: "SET_SAVE_STATUS", ... })
// resetDraft → dispatch({ type: "RESET", payload: sourceId })
```

更新两个 useEffect（draft load 和 draft save）使用 dispatch 和 questState。

- [ ] **Step 3: 最终验证**

```
cd frontend && npx vitest run && npx tsc --noEmit && npm run build
```
Expected: 11 tests pass, 0 type errors, build succeeds
