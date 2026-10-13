/** Local, offline search over what is actually available (no network, no stored queries). */
import {
  classicProblems,
  getClassicProblemPracticeLink,
  modelMethods,
} from "../data/modelingContent";
import { COURSES, courseByMethod } from "../learning/courses";

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
const norm = (s: string) => s.toLowerCase();

/** Entries that do not need the lesson text. */
export function staticEntries(): SearchEntry[] {
  const methods = modelMethods.map<SearchEntry>((m) => {
    const taught = courseByMethod(m.slug);
    return {
      id: `method:${m.slug}`,
      group: "方法速查",
      title: m.name,
      meta: `${m.family} · ${m.level}`,
      href: taught ? taught.lessonPath : `/learn/reference#model-${m.slug}`,
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
  const keywords: Record<string, string> = {
    lp: "线性规划 专项 练习 刷题 题目 约束 目标函数 整数 灵敏度 lp",
    ahp: "层次分析法 ahp 专项 练习 刷题 判断矩阵 权重 一致性 cr 特征向量 评价",
  };
  const practice = COURSES.map<SearchEntry>((c) => ({
    id: `practice:${c.id}`,
    group: "练习",
    title: `${c.title}专项练习`,
    meta: "确定性判分 · 错题重练",
    href: c.practicePath,
    badge: "可练",
    haystack: norm(keywords[c.id] ?? c.title),
  }));
  return [...practice, ...methods, ...problems];
}

/** Lesson sections and prompt templates, loaded only when someone starts searching. */
export async function lessonEntries(): Promise<SearchEntry[]> {
  const [{ sections }, { publishedPrompts }, { ahpSections }] = await Promise.all([
    import("../learning/content"),
    import("../content/prompts"),
    import("../learning/ahp/content"),
  ]);
  const ahp = ahpSections.map<SearchEntry>((s, i) => ({
    id: `lesson:ahp:${s.id}`,
    group: "精讲",
    title: s.title,
    meta: `层次分析法 · 第 ${i + 1} 节`,
    href: `/learn/ahp#${s.id}`,
    badge: "可学",
    haystack: norm(`层次分析法 ahp 判断矩阵 权重 一致性 ${s.title} ${s.lead}`),
  }));
  const prompts = publishedPrompts.map<SearchEntry>((p) => ({
    id: `prompt:${p.id}`,
    group: "提示词",
    title: p.title,
    meta: `提示词库 · ${p.taskType}`,
    href: `/library/prompts/${p.id}`,
    badge: p.reviewStatus === "owner-reviewed" ? "原创模板" : "原创模板 · 待复核",
    haystack: norm(`提示词 prompt ${p.title} ${p.summary} ${p.taskType}`),
  }));
  return [...prompts, ...ahp, ...sections.map<SearchEntry>((s, i) => ({
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
