import type { CodeLanguage, Depth, PaperPart } from "../../content/skills";

/** 高级选项只在当前标签页保存（sessionStorage），不进入学习记录。 */
export type SkillPrefs = {
  depth: Depth;
  codeLanguage: CodeLanguage;
  problemLabel: string;
  hoursLeft: string;
  question: string;
  teamProfile: string;
  paperPart: PaperPart;
  sectionName: string;
  reviewTarget: string;
  handoffText: string;
};

export const DEFAULT_PREFS: SkillPrefs = {
  depth: "both",
  codeLanguage: "Python",
  problemLabel: "",
  hoursLeft: "",
  question: "",
  teamProfile: "",
  paperPart: "outline",
  sectionName: "",
  reviewTarget: "",
  handoffText: "",
};

const PREFS_KEY = "mb.v2.skillPrefs";
const CASE_KEY = "mb.v2.skillCase";
const CONTEST_KEY = "mb.v2.skillContest";

const ENUMS: Partial<Record<keyof SkillPrefs, readonly string[]>> = {
  depth: ["both", "stable"],
  codeLanguage: ["Python", "MATLAB", "R", "none"],
  paperPart: ["outline", "abstract", "section"],
};

export function readPrefs(): SkillPrefs {
  try {
    const raw: unknown = JSON.parse(sessionStorage.getItem(PREFS_KEY) ?? "null");
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...DEFAULT_PREFS };
    const out = { ...DEFAULT_PREFS };
    for (const key of Object.keys(DEFAULT_PREFS) as (keyof SkillPrefs)[]) {
      const v = (raw as Record<string, unknown>)[key];
      if (typeof v !== "string" || v.length > 20000) continue;
      if (ENUMS[key] && !ENUMS[key]!.includes(v)) continue;
      (out as Record<string, string>)[key] = v;
    }
    return out;
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function writePrefs(prefs: SkillPrefs) {
  try {
    sessionStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* 浏览器拒绝写入时只在内存中保留 */
  }
}

export function readLastContest(): string | null {
  try {
    return localStorage.getItem(CONTEST_KEY);
  } catch {
    return null;
  }
}
export function writeLastContest(id: string) {
  try {
    localStorage.setItem(CONTEST_KEY, id);
  } catch {
    /* ignore */
  }
}

/** 七关 → 技能：只带公开的训练题题面，不带学生的作答。 */
export type QuestCase = { title: string; text: string };
export function stashQuestCase(c: QuestCase) {
  try {
    sessionStorage.setItem(CASE_KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}
export function readQuestCase(): QuestCase | null {
  try {
    const v: unknown = JSON.parse(sessionStorage.getItem(CASE_KEY) ?? "null");
    if (v && typeof v === "object" && typeof (v as QuestCase).title === "string" && typeof (v as QuestCase).text === "string") return v as QuestCase;
  } catch {
    /* ignore */
  }
  return null;
}
