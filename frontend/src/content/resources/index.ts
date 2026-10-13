/**
 * 资料索引 (design doc §5.5, §8.2 ResourceItem; Q6).
 *
 * Built only from content already reviewed for public display:
 * - official contest pages (links only, no copies of rules or problems);
 * - ModelingBridge original teaching material (lesson, cases, adapted drills, tools).
 * Third-party collections (problem / paper bundles from unknown sources) are NOT listed and
 * never offered for download until their licence is verified.
 */
import { listLocalCases } from "../../data/localCases";
import { classicProblems, getClassicProblemPracticeLink, recentTrainingCases } from "../../data/modelingContent";
import { ALL_EDITIONS, contestCatalog } from "../contests";

export const RESOURCE_KINDS = ["官方赛事与规则", "近年赛题（官方链接）", "原创教学案例", "原创改编练习", "课程与工具"] as const;
export type ResourceKind = (typeof RESOURCE_KINDS)[number];

export type LicenseStatus = "original" | "official-link" | "index-only";
export const LICENSE_LABEL: Record<LicenseStatus, string> = {
  original: "原创",
  "official-link": "官方公开链接",
  "index-only": "仅索引 · 待授权",
};

export type ResourceItem = {
  id: string;
  title: string;
  kind: ResourceKind;
  summary: string;
  meta: string[];
  licenseStatus: LicenseStatus;
  /** In-site route. */
  to?: string;
  /** Official external page (opens in a new tab). */
  officialUrl?: string;
  officialLabel?: string;
};

export function buildResourceIndex(): ResourceItem[] {
  const contests: ResourceItem[] = contestCatalog.map((info) => {
    const latest = ALL_EDITIONS.filter((e) => e.contestId === info.id).sort((x, y) => y.year - x.year)[0];
    const source = latest?.sources.find((s) => s.type !== "repost") ?? latest?.sources[0];
    return {
      id: `res.contest.${info.id}`,
      title: info.name,
      kind: "官方赛事与规则",
      summary: info.fit,
      meta: [info.category, latest ? `${latest.year} 年${latest.status === "suspended" ? "暂停" : "已收录"}` : "待收录"],
      licenseStatus: "official-link",
      // 只外链 https 页面；仅有 http 的官网通过站内日历详情查看来源。
      ...(() => {
        const url = [info.website, source?.url].find((u) => u?.startsWith("https://"));
        return url ? { officialUrl: url, officialLabel: url === info.website ? `${info.short}官网` : source?.publisher } : {};
      })(),
      to: `/library/calendar?c=${info.id}`,
    };
  });
  const problems: ResourceItem[] = recentTrainingCases.map((item) => ({
    id: `res.${item.contest.toLowerCase()}.${item.year}.${item.problem.toLowerCase()}`,
    title: `${item.contest} ${item.year} ${item.problem} 题 · ${item.title.replace(/^\d{4}[A-F]\s*/, "")}`,
    kind: "近年赛题（官方链接）",
    summary: `${item.positioning} 题面与数据请到 COMAP 官方页面获取；站内只提供学习拆解。`,
    meta: [item.contest, item.year, item.difficulty],
    licenseStatus: "official-link",
    officialUrl: item.sourceUrl,
    officialLabel: "COMAP 官方页面",
    to: "/learn/reference",
  }));
  const cases: ResourceItem[] = listLocalCases().map((item) => ({
    id: `res.case.${item.slug}`,
    title: item.title,
    kind: "原创教学案例",
    summary: item.summary,
    meta: [item.difficulty, "可进入七关实战"],
    licenseStatus: "original",
    to: `/cases/${item.slug}`,
  }));
  const drills: ResourceItem[] = classicProblems.map((item) => {
    const practice = getClassicProblemPracticeLink(item).href;
    return {
    id: `res.drill.${item.slug}`,
    title: item.title,
    kind: "原创改编练习",
    summary: `${item.simplifiedTask}（${item.source}，非原题搬运）`,
    meta: [item.type, item.difficulty],
    licenseStatus: "original",
    // A matching teaching case when there is one; the AI workbench link is not used here.
    to: practice.startsWith("/cases/") ? practice : `/learn/reference#problem-${item.slug}`,
  };
  });
  const tools: ResourceItem[] = [
    {
      id: "res.lesson.lp",
      title: "线性规划精讲（含交互图与 6 道练习）",
      kind: "课程与工具",
      summary: "从一个加工坊的生产计划出发，完整走完变量、约束、可行域、最优解与检验。",
      meta: ["精讲", "已核验例题"],
      licenseStatus: "original",
      to: "/learn/linear-programming",
    },
    {
      id: "res.reference.methods",
      title: "8 种常用方法速查卡",
      kind: "课程与工具",
      summary: "适用条件、输入输出、检验方式与常见误区，适合赛前快速回顾。",
      meta: ["方法速查"],
      licenseStatus: "original",
      to: "/learn/reference#methods",
    },
    {
      id: "res.tools.checklists",
      title: "编码、写作技巧与交稿前检查卡",
      kind: "课程与工具",
      summary: "数据清洗、模型检验、图表表达、合规记录四张检查卡。",
      meta: ["模板与工具"],
      licenseStatus: "original",
      to: "/library/tools",
    },
    {
      id: "res.skills",
      title: "AI 建模技能包（原创）",
      kind: "课程与工具",
      summary: "选题、赛题分析、数据处理、建模求解、检验、论文写作六步任务说明书，按赛事生成，复制给自己的 AI 使用。",
      meta: ["AI 技能"],
      licenseStatus: "original",
      to: "/library/skills",
    },
  ];
  return [...tools, ...cases, ...drills, ...problems, ...contests];
}
