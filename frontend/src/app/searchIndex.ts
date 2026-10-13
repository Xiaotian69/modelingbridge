/** Local, offline search over what is actually available (no network, no stored queries). */
import {
  classicProblems,
  getClassicProblemPracticeLink,
  modelMethods,
} from "../data/modelingContent";

export type SearchGroup = "精讲" | "练习" | "方法速查" | "提示词" | "赛题";
export type SearchEntry = {
  id: string;
  group: SearchGroup;
  title: string;
  meta: string;
  href: string;
  badge: string;
  haystack: string;
};

export const GROUP_ORDER: SearchGroup[] = ["精讲", "练习", "方法速查", "提示词", "赛题"];
const LP_SLUG = "linear-programming";
const norm = (s: string) => s.toLowerCase();

/** Entries that do not need the lesson text. */
export function staticEntries(): SearchEntry[] {
  const methods = modelMethods.map<SearchEntry>((m) => {
    const taught = m.slug === LP_SLUG;
    return {
      id: `method:${m.slug}`,
      group: "方法速查",
      title: m.name,
      meta: `${m.family} · ${m.level}`,
      href: taught ? "/learn/linear-programming" : `/learn/reference#model-${m.slug}`,
      badge: taught ? "精讲可学" : "速查 · 精讲筹备中",
      haystack: norm([m.name, m.family, m.when, ...m.aliases].join(" ")),
    };
  });
  const problems = classicProblems.map<SearchEntry>((p) => {
    const link = getClassicProblemPracticeLink(p);
    const experimental = link.href.startsWith("/workbench");
    return {
      id: `problem:${p.slug}`,
      group: "赛题",
      title: p.title,
      meta: `${p.contest} ${p.year} · ${p.type}`,
      href: link.href,
      badge: experimental ? "AI 工作台（实验）" : "教学案例",
      haystack: norm([p.title, p.contest, p.year, p.type, ...p.methods].join(" ")),
    };
  });
  const practice: SearchEntry = {
    id: "practice:lp",
    group: "练习",
    title: "线性规划专项练习",
    meta: "确定性判分 · 错题重练",
    href: "/practice/linear-programming",
    badge: "可练",
    haystack: norm("线性规划 专项 练习 刷题 题目 约束 目标函数 整数 灵敏度 lp"),
  };
  const lab: SearchEntry = {
    id: "lab:lp",
    group: "练习",
    title: "线性规划交互实验室",
    meta: "改利润和约束，实时看可行域与最优解",
    href: "/learn/linear-programming/lab",
    badge: "可操作",
    haystack: norm("线性规划 交互 实验室 实验 可行域 最优解 无界 无可行解 多重最优 灵敏度 参数 lp"),
  };
  return [practice, lab, ...methods, ...problems];
}

/** Lesson sections and prompt templates, loaded only when someone starts searching. */
export async function lessonEntries(): Promise<SearchEntry[]> {
  const [{ sections }, { publishedPrompts }] = await Promise.all([
    import("../learning/content"),
    import("../content/prompts"),
  ]);
  const prompts = publishedPrompts.map<SearchEntry>((p) => ({
    id: `prompt:${p.id}`,
    group: "提示词",
    title: p.title,
    meta: `提示词库 · ${p.taskType}`,
    href: `/library/prompts/${p.id}`,
    badge: p.reviewStatus === "owner-reviewed" ? "原创模板" : "原创模板 · 待复核",
    haystack: norm(`提示词 prompt ${p.title} ${p.summary} ${p.taskType}`),
  }));
  return [...prompts, ...sections.map<SearchEntry>((s, i) => ({
    id: `lesson:${s.id}`,
    group: "精讲",
    title: s.title,
    meta: `线性规划 · 第 ${i + 1} 节`,
    href: `/learn/linear-programming#${s.id}`,
    badge: "可学",
    haystack: norm(`线性规划 ${s.title} ${s.lead}`),
  }))];
}

/** All whitespace-separated terms must match. Results grouped, at most `perGroup` each. */
export function searchEntries(entries: SearchEntry[], query: string, perGroup = 4) {
  const terms = norm(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const hits = entries.filter((e) => terms.every((t) => e.haystack.includes(t) || norm(e.title).includes(t)));
  return GROUP_ORDER.flatMap((g) => hits.filter((e) => e.group === g).slice(0, perGroup));
}
