/**
 * 把作答整理成“每个分工的证据”，再按固定规则给出建议。规则全部写在这里、对所有人相同，
 * 不为凑出某种结果调分；也不把兴趣、经验、任务表现换算成一个总分或百分比。
 */
import {
  INTERESTS,
  PREFERENCE_UNSURE,
  ROLE_ORDER,
  TASKS,
  type Experience,
  type InterestOption,
  type Role,
  type Task,
} from "./content";

export type TaskAnswer = { choice: string[] } | { skipped: true };
export type Answers = {
  experience: Partial<Record<Role, Experience>>;
  interests: string[];
  tasks: Record<string, TaskAnswer>;
  preference: string[];
};

export type Outcome = "correct" | "wrong" | "skipped" | "missing";

export function taskOutcome(task: Task, answer: TaskAnswer | undefined): Outcome {
  if (!answer) return "missing";
  if ("skipped" in answer) return "skipped";
  const picked = [...new Set(answer.choice)].sort();
  const key = [...task.answer].sort();
  return picked.length === key.length && picked.every((id, i) => id === key[i]) ? "correct" : "wrong";
}

/**
 * 兴趣：第 2 步每选一项该分工的事情 +1（最多 2），做完任务后又选了它 +1，合计 0–3。
 * strong ≥ 2，some = 1，none = 0。
 */
export type InterestLevel = "strong" | "some" | "none";
/**
 * 任务表现：只看作答了的题（跳过不算错）。作答少于 2 题 → insufficient（证据不足）；
 * 答对 ≥ 2 题 → good；其余 → mixed。
 */
export type TaskLevel = "good" | "mixed" | "insufficient";

/**
 * 建议（按顺序取第一条满足的）：
 * 1. start：任务 good，且有兴趣（strong 或 some）；
 * 2. basics：兴趣 strong，但任务不是 good（答错或跳过多）——从基础练起，不说明不适合；
 * 3. try：任务 good，但这次没表现出兴趣——值得实际做一次再看；
 * 4. unclear：作答太少，证据不足；
 * 5. weak：兴趣和任务的信号都较弱。
 */
export type Suggestion = "start" | "basics" | "try" | "unclear" | "weak";
export const SUGGESTION_ORDER: Suggestion[] = ["start", "basics", "try", "unclear", "weak"];
export const SUGGESTION_LABEL: Record<Suggestion, string> = {
  start: "可以先从这里开始",
  basics: "兴趣明显，从基础练起",
  try: "值得实际试一次",
  unclear: "本次证据不足",
  weak: "本次信号较弱",
};
export const SUGGESTION_REASON: Record<Suggestion, string> = {
  start: "兴趣和任务表现都有信号。",
  basics: "你对这类事情兴趣明显，任务里还有没把握的地方——这正是练习能补上的，不说明不适合。",
  try: "这类任务完成得不错，但这次没有表现出兴趣：可以实际做一次，再看自己喜不喜欢。",
  unclear: "这类任务跳过得较多，本次证据不足，判断不了。",
  weak: "本次兴趣和任务表现的信号都较弱。这不代表不适合，以后可以再试。",
};
/** 结果页上算作“可以先尝试”的建议。 */
export const SUGGESTED: Suggestion[] = ["start", "basics", "try"];

export type RoleEvidence = {
  role: Role;
  interestPicks: InterestOption[];
  preferred: boolean;
  interestScore: number;
  interestLevel: InterestLevel;
  experience?: Experience;
  tasks: { task: Task; outcome: Outcome }[];
  correct: number;
  wrong: number;
  skipped: number;
  taskLevel: TaskLevel;
  suggestion: Suggestion;
  /** 经验和表现放在一起时值得说的话，例如“没接触过但答对了” */
  notes: string[];
};

export function suggestionFor(interestLevel: InterestLevel, taskLevel: TaskLevel): Suggestion {
  if (taskLevel === "good" && interestLevel !== "none") return "start";
  if (interestLevel === "strong") return "basics";
  if (taskLevel === "good") return "try";
  if (taskLevel === "insufficient") return "unclear";
  return "weak";
}

function experienceNotes(experience: Experience | undefined, taskLevel: TaskLevel, correct: number): string[] {
  if (experience === "none" && taskLevel === "good")
    return [`你说还没接触过，但这类任务答对了 ${correct} 题：上手门槛可能比你想的低。`];
  if (experience === "none") return ["还没接触过很正常，这类任务可以通过练习学会；跳过或答错都不说明不适合。"];
  if (experience === "project" && taskLevel !== "good")
    return ["你做过相关作业或项目，这次的案例情境可能不熟悉；3 道短题说明不了你的能力。"];
  return [];
}

export function evidenceFor(role: Role, answers: Answers): RoleEvidence {
  const interestPicks = INTERESTS.filter((o) => o.role === role && answers.interests.includes(o.id));
  const preferred = answers.preference.includes(role) && !answers.preference.includes(PREFERENCE_UNSURE);
  const interestScore = Math.min(interestPicks.length, 2) + (preferred ? 1 : 0);
  const interestLevel: InterestLevel = interestScore >= 2 ? "strong" : interestScore === 1 ? "some" : "none";

  const tasks = TASKS.filter((t) => t.role === role).map((task) => ({ task, outcome: taskOutcome(task, answers.tasks[task.id]) }));
  const count = (o: Outcome) => tasks.filter((t) => t.outcome === o).length;
  const correct = count("correct");
  const wrong = count("wrong");
  const skipped = count("skipped") + count("missing");
  const taskLevel: TaskLevel = correct + wrong < 2 ? "insufficient" : correct >= 2 ? "good" : "mixed";

  const experience = answers.experience[role];
  return {
    role,
    interestPicks,
    preferred,
    interestScore,
    interestLevel,
    experience,
    tasks,
    correct,
    wrong,
    skipped,
    taskLevel,
    suggestion: suggestionFor(interestLevel, taskLevel),
    notes: experienceNotes(experience, taskLevel, correct),
  };
}

/** 三个分工的证据，按建议排序（同一档按 建模 → 编程 → 论文 的固定顺序）。不会只留下一个。 */
export function summarize(answers: Answers): RoleEvidence[] {
  return ROLE_ORDER.map((role) => evidenceFor(role, answers)).sort(
    (a, b) => SUGGESTION_ORDER.indexOf(a.suggestion) - SUGGESTION_ORDER.indexOf(b.suggestion),
  );
}
