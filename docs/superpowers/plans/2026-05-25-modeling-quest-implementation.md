# Modeling Quest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable “数模闯关训练营” slice: a 7-stage quest page that can start from a case, guide user answers, save a learning report, and make the product feel like task-based learning rather than a plain course site.

**Architecture:** Keep the backend unchanged for this slice. Add a small pure quest domain module under `frontend/src/quest/` for stage definitions, progress helpers, and report generation, then build a `/quest` page on top of it. Reuse the existing cases API and localStorage record workflow to avoid premature database/account work.

**Tech Stack:** React 18, React Router 6, TypeScript, Vite, Tailwind CSS, Vitest for focused unit tests.

---

## File Structure

- Create `frontend/src/quest/stages.ts`: seven quest stage definitions and pure helper functions.
- Create `frontend/src/quest/stages.test.ts`: Vitest unit tests for progress, unlock logic, and report generation.
- Create `frontend/src/pages/Quest.tsx`: main quest map/task-card/AI-coach page.
- Modify `frontend/src/App.tsx`: add `/quest` route.
- Modify `frontend/src/layouts/Layout.tsx`: reduce primary nav to the MVP learning loop.
- Modify `frontend/src/pages/Home.tsx`: retune home copy and CTAs toward the quest direction.
- Modify `frontend/src/pages/CaseDetail.tsx`: route cases into `/quest?case=<slug>`.
- Modify `frontend/package.json`: add `test` script and Vitest dev dependency.
- Modify `frontend/package-lock.json`: update after installing Vitest.

## Task 1: Add Quest Domain Tests And Test Runner

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Create: `frontend/src/quest/stages.test.ts`

- [ ] **Step 1: Install Vitest**

Run:

```powershell
cd frontend
npm install -D vitest
```

Expected: `package.json` and `package-lock.json` include `vitest` under dev dependencies.

- [ ] **Step 2: Add test script**

Patch `frontend/package.json` scripts to include:

```json
"test": "vitest run"
```

Expected scripts:

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest run"
}
```

- [ ] **Step 3: Write failing quest tests**

Create `frontend/src/quest/stages.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  buildQuestReportMarkdown,
  getQuestProgress,
  getStageUnlockState,
  questStages,
  type QuestStageState,
} from "./stages";

describe("questStages", () => {
  it("defines the seven math-modeling training stages in order", () => {
    expect(questStages.map((stage) => stage.id)).toEqual([
      "read_problem",
      "breakdown",
      "data",
      "model",
      "code",
      "charts",
      "paper",
    ]);
    expect(questStages[0].title).toBe("读题破冰");
    expect(questStages[6].title).toBe("论文框架");
  });
});

describe("getQuestProgress", () => {
  it("returns completed count and rounded percent", () => {
    const states: QuestStageState[] = questStages.map((stage, index) => ({
      stageId: stage.id,
      answer: index < 3 ? `answer-${index}` : "",
      completed: index < 3,
      updatedAt: "2026-05-25T00:00:00.000Z",
    }));

    expect(getQuestProgress(states)).toEqual({
      completed: 3,
      total: 7,
      percent: 43,
    });
  });
});

describe("getStageUnlockState", () => {
  it("unlocks the first incomplete stage and keeps later stages locked", () => {
    const states: QuestStageState[] = questStages.map((stage, index) => ({
      stageId: stage.id,
      answer: index === 0 ? "I understand the goal" : "",
      completed: index === 0,
      updatedAt: "2026-05-25T00:00:00.000Z",
    }));

    expect(getStageUnlockState(questStages[0].id, states)).toBe("completed");
    expect(getStageUnlockState(questStages[1].id, states)).toBe("available");
    expect(getStageUnlockState(questStages[2].id, states)).toBe("locked");
  });
});

describe("buildQuestReportMarkdown", () => {
  it("keeps AI advice separate from student judgment", () => {
    const states: QuestStageState[] = questStages.map((stage, index) => ({
      stageId: stage.id,
      answer: index === 0 ? "My own problem understanding" : "",
      completed: index === 0,
      updatedAt: "2026-05-25T00:00:00.000Z",
    }));

    const report = buildQuestReportMarkdown({
      title: "共享单车需求预测",
      sourceLabel: "案例训练副本",
      states,
      aiUsageNote: "AI only gave hints.",
    });

    expect(report).toContain("# 数模闯关通关报告");
    expect(report).toContain("## 我的判断");
    expect(report).toContain("My own problem understanding");
    expect(report).toContain("## AI 使用记录");
    expect(report).toContain("AI only gave hints.");
  });
});
```

- [ ] **Step 4: Run tests and verify RED**

Run:

```powershell
cd frontend
npm test -- src/quest/stages.test.ts
```

Expected: FAIL because `frontend/src/quest/stages.ts` does not exist.

## Task 2: Implement Quest Stage Domain

**Files:**
- Create: `frontend/src/quest/stages.ts`
- Test: `frontend/src/quest/stages.test.ts`

- [ ] **Step 1: Create quest stage model**

Create `frontend/src/quest/stages.ts`:

```ts
export type QuestStageId =
  | "read_problem"
  | "breakdown"
  | "data"
  | "model"
  | "code"
  | "charts"
  | "paper";

export type StageUnlockState = "locked" | "available" | "completed";

export type QuestStage = {
  id: QuestStageId;
  order: number;
  title: string;
  shortTitle: string;
  goal: string;
  task: string;
  userPrompt: string;
  coachHints: string[];
  passConditions: string[];
  outputLabel: string;
};

export type QuestStageState = {
  stageId: QuestStageId;
  answer: string;
  completed: boolean;
  updatedAt: string;
};

export type QuestProgress = {
  completed: number;
  total: number;
  percent: number;
};

export const questStages: QuestStage[] = [
  {
    id: "read_problem",
    order: 1,
    title: "读题破冰",
    shortTitle: "读题",
    goal: "说清题目背景、目标、限制和关键词。",
    task: "先不要选模型，用自己的话复述这道题到底要解决什么。",
    userPrompt: "这道题的背景是什么？最核心的目标是什么？题目里有哪些限制或关键词？",
    coachHints: ["找出题目中的对象、目标、约束。", "把题目改写成一句普通话。", "先写不确定点，不要急着补答案。"],
    passConditions: ["能说清题目目标", "列出至少 2 个约束或限制", "标出仍需确认的信息"],
    outputLabel: "题目理解卡",
  },
  {
    id: "breakdown",
    order: 2,
    title: "拆解任务",
    shortTitle: "拆问",
    goal: "把大问题拆成小问，明确输入、输出和评价标准。",
    task: "把题目拆成 2-4 个可执行的小任务。",
    userPrompt: "请列出本题的小问、每个小问需要的输入、预期输出和判断指标。",
    coachHints: ["先按题目问法拆，再补隐藏目标。", "每个小问都要有输出。", "不要把求解方法当成问题目标。"],
    passConditions: ["至少拆出 2 个小任务", "每个小任务有输入和输出", "能说明任务之间的先后关系"],
    outputLabel: "问题拆解表",
  },
  {
    id: "data",
    order: 3,
    title: "数据侦查",
    shortTitle: "数据",
    goal: "判断需要哪些数据字段、来源、单位和替代方案。",
    task: "列出完成本题必须的数据和可选数据。",
    userPrompt: "本题需要哪些字段？哪些必须有？缺失时可以用什么替代？来源需要如何人工核验？",
    coachHints: ["字段要服务模型，不要越列越散。", "区分必须字段和锦上添花字段。", "AI 不能替你虚构数据来源。"],
    passConditions: ["列出必须字段", "写出缺失替代方案", "标注需要人工核验的来源"],
    outputLabel: "数据需求表",
  },
  {
    id: "model",
    order: 4,
    title: "模型选择",
    shortTitle: "模型",
    goal: "比较基础模型和进阶模型，并说明选择理由。",
    task: "选择一条主线模型路线，并说明为什么不是另一个模型。",
    userPrompt: "你准备使用哪个基础模型？是否需要进阶模型？选择理由、输入输出和检验方式分别是什么？",
    coachHints: ["先选能解释清楚的基础模型。", "模型选择要匹配数据字段。", "写清局限比堆模型更重要。"],
    passConditions: ["给出主线模型", "写出选择理由", "写出至少 1 个检验方法"],
    outputLabel: "模型决策卡",
  },
  {
    id: "code",
    order: 5,
    title: "代码起步",
    shortTitle: "代码",
    goal: "把模型路线拆成数据流、函数和伪代码。",
    task: "写出本题最小代码框架，不需要一次性写完整程序。",
    userPrompt: "请写出数据读取、清洗、建模、评估、出图分别需要哪些函数或步骤。",
    coachHints: ["先画数据流，再写函数名。", "每个函数只做一件事。", "先跑通最小版本，再补复杂模型。"],
    passConditions: ["有数据流顺序", "有函数划分", "有最小运行目标"],
    outputLabel: "代码骨架说明",
  },
  {
    id: "charts",
    order: 6,
    title: "图表表达",
    shortTitle: "图表",
    goal: "判断需要哪些图表，以及每张图服务哪个结论。",
    task: "设计论文中最关键的 3-5 张图表。",
    userPrompt: "你准备画哪些图？每张图展示什么结论？应该放在论文哪个部分？",
    coachHints: ["每张图都要服务一个结论。", "预测题重趋势和误差，评价题重排序和权重。", "不要为了好看堆图。"],
    passConditions: ["列出至少 3 张图表", "说明每张图的结论", "标注论文位置"],
    outputLabel: "图表计划",
  },
  {
    id: "paper",
    order: 7,
    title: "论文框架",
    shortTitle: "论文",
    goal: "整理章节、结论、检验和 AI 使用记录。",
    task: "生成学习复盘用的论文结构，不写可直接提交的正文。",
    userPrompt: "请写出章节框架、每章要回答的问题、仍需人工完成的内容和 AI 使用记录。",
    coachHints: ["框架不是终稿。", "结论必须来自你的计算和检验。", "AI 使用记录要透明保留。"],
    passConditions: ["有章节框架", "区分 AI 建议和我的判断", "记录人工确认与剩余工作"],
    outputLabel: "通关报告",
  },
];

export function createEmptyQuestStates(now = new Date().toISOString()): QuestStageState[] {
  return questStages.map((stage) => ({
    stageId: stage.id,
    answer: "",
    completed: false,
    updatedAt: now,
  }));
}

export function getQuestProgress(states: QuestStageState[]): QuestProgress {
  const completed = states.filter((state) => state.completed).length;
  const total = questStages.length;
  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100),
  };
}

export function getStageUnlockState(stageId: QuestStageId, states: QuestStageState[]): StageUnlockState {
  const index = questStages.findIndex((stage) => stage.id === stageId);
  if (index < 0) return "locked";
  if (states.find((state) => state.stageId === stageId)?.completed) return "completed";
  const previousStages = questStages.slice(0, index);
  const previousComplete = previousStages.every((stage) => states.find((state) => state.stageId === stage.id)?.completed);
  return previousComplete ? "available" : "locked";
}

export function updateQuestStageState(
  states: QuestStageState[],
  stageId: QuestStageId,
  patch: Partial<Pick<QuestStageState, "answer" | "completed">>,
  now = new Date().toISOString(),
): QuestStageState[] {
  return states.map((state) =>
    state.stageId === stageId
      ? {
          ...state,
          ...patch,
          updatedAt: now,
        }
      : state,
  );
}

export function buildQuestReportMarkdown(input: {
  title: string;
  sourceLabel: string;
  states: QuestStageState[];
  aiUsageNote: string;
}): string {
  const stageSections = questStages.flatMap((stage) => {
    const state = input.states.find((item) => item.stageId === stage.id);
    return [
      `## ${stage.order}. ${stage.title}`,
      "",
      `训练目标：${stage.goal}`,
      "",
      "## 我的判断",
      state?.answer?.trim() || "（未填写）",
      "",
      `通关状态：${state?.completed ? "已通关" : "未通关"}`,
      "",
    ];
  });

  return [
    "# 数模闯关通关报告",
    "",
    `训练题：${input.title}`,
    `来源：${input.sourceLabel}`,
    `导出时间：${new Date().toLocaleString()}`,
    "",
    ...stageSections,
    "## AI 使用记录",
    "",
    input.aiUsageNote || "本次训练未记录 AI 调用，或仅使用本地提示卡。",
    "",
    "## 合规说明",
    "",
    "本报告用于学习复盘。AI 只提供提示、解释和检查，最终数据核验、模型判断、计算结果和论文表达由学生完成。",
  ].join("\n");
}
```

- [ ] **Step 2: Run quest tests and verify GREEN**

Run:

```powershell
cd frontend
npm test -- src/quest/stages.test.ts
```

Expected: PASS.

## Task 3: Build The Quest Page

**Files:**
- Create: `frontend/src/pages/Quest.tsx`
- Modify: `frontend/src/App.tsx`
- Test: `frontend/src/quest/stages.test.ts`

- [ ] **Step 1: Create `/quest` page**

Create `frontend/src/pages/Quest.tsx` with a component that:

- Reads `case` from `useSearchParams`.
- Loads the case via `getCase(caseSlug)` when present.
- Initializes `QuestStageState[]` with `createEmptyQuestStates`.
- Shows a left-side stage map, middle task card, and right-side AI coach panel.
- Lets users write an answer, tick pass conditions, complete a stage, and unlock the next stage.
- Saves a report to existing `saveWorkbenchRecord`.

Core component shape:

```tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getCase } from "../api/client";
import {
  buildQuestReportMarkdown,
  createEmptyQuestStates,
  getQuestProgress,
  getStageUnlockState,
  questStages,
  updateQuestStageState,
  type QuestStageId,
  type QuestStageState,
} from "../quest/stages";
import type { CaseDetail } from "../types";
import { saveWorkbenchRecord } from "./Records";
```

Implementation details:

- Default title: `自定义训练题`.
- Default problem text: existing shared-bike sample.
- For case mode, title comes from `case.title`, source label is `案例训练副本：${case.title}`, and problem text uses `case.summary` plus `case.sections.background`.
- Use `getStageUnlockState` to disable locked stages.
- A stage can be marked complete only when the answer has at least 20 non-space characters and all pass-condition checkboxes are checked.

- [ ] **Step 2: Add route**

Patch `frontend/src/App.tsx`:

```tsx
import { QuestPage } from "./pages/Quest";
```

Add the route inside `<Route element={<Layout />}>`:

```tsx
<Route path="quest" element={<QuestPage />} />
```

- [ ] **Step 3: Run build**

Run:

```powershell
cd frontend
npm run build
```

Expected: TypeScript and Vite build succeed.

## Task 4: Connect Home, Navigation, And Cases To Quest

**Files:**
- Modify: `frontend/src/layouts/Layout.tsx`
- Modify: `frontend/src/pages/Home.tsx`
- Modify: `frontend/src/pages/CaseDetail.tsx`

- [ ] **Step 1: Reduce primary nav**

Patch `frontend/src/layouts/Layout.tsx` `nav` to:

```ts
const nav = [
  { to: "/", label: "总览" },
  { to: "/quest", label: "闯关" },
  { to: "/cases", label: "案例" },
  { to: "/records", label: "记录" },
  { to: "/about", label: "关于" },
];
```

Keep existing routes available in `App.tsx`; only remove them from primary nav.

- [ ] **Step 2: Retune Home CTA**

Patch `frontend/src/pages/Home.tsx` so the first two `ModeLink` cards become:

```tsx
<ModeLink to="/quest" eyebrow="Quest Mode" title="开始数模闯关" desc="围绕一道题完成读题、拆问、数据、模型、代码、图表和论文框架。" />
<ModeLink to="/cases" eyebrow="Training Cases" title="选择训练副本" desc="从经典案例进入闯关，不追求题量，先把一题做深。" />
```

Change hero paragraph to emphasize “AI 教练 + 人工确认 + 通关报告”.

- [ ] **Step 3: Route case CTA to quest**

Patch `frontend/src/pages/CaseDetail.tsx` primary CTA:

```tsx
<Link
  to={`/quest?case=${encodeURIComponent(c.slug)}`}
  className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-100"
>
  进入闯关训练
</Link>
```

- [ ] **Step 4: Run build**

Run:

```powershell
cd frontend
npm run build
```

Expected: build succeeds.

## Task 5: Verify Quest Flow

**Files:**
- No code changes unless verification finds a bug.

- [ ] **Step 1: Run unit tests**

Run:

```powershell
cd frontend
npm test -- src/quest/stages.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run production build**

Run:

```powershell
cd frontend
npm run build
```

Expected: PASS.

- [ ] **Step 3: Manual smoke path**

Run:

```powershell
cd frontend
npm run dev -- --host 127.0.0.1
```

Expected:

- `/quest` loads with the default training task.
- Completing stage 1 unlocks stage 2.
- Locked stages cannot be opened.
- `/cases/<slug>` primary CTA opens `/quest?case=<slug>`.
- Final stage can save a report, and `/records` shows it.

## Task 6: Update Project Notes

**Files:**
- Modify: `docs/superpowers/specs/2026-05-25-modeling-quest-design.md`

- [ ] **Step 1: Add implementation note**

Append a short note:

```md
## 11. 第一版实现切片

第一版工程实现先覆盖 `/quest` 闯关页、案例进入闯关、导航收束、localStorage 学习记录和通关报告导出。AI 教练第一版以提示卡和现有工作台能力为主，不新增后端接口；剧情、数据库、排行榜和公开资源下载延后。
```

- [ ] **Step 2: Final verification**

Run:

```powershell
cd frontend
npm test -- src/quest/stages.test.ts
npm run build
```

Expected: both pass.
