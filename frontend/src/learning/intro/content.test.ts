// 第零课 content checks: structure, every number in the text, the checkpoints and their feedback,
// and the content rules from the brief (original case, no outdated contest rules, no award promises).
import { describe, expect, it } from "vitest";
import verified from "./intro-verified.json";
import { introNumbers, introSections } from "./content";
import { introExerciseMeta } from "./exerciseMeta";
import { COMMUTE_STEPS, UMBRELLA_STEPS } from "./process";
import { introQuestions } from "./questions";
import { INTRO_CHECKPOINT_IDS, INTRO_SECTIONS } from "./sectionIds";
import { TEAM_TASKS } from "./TeamBoard";

type AnyBlock = { type: string; text?: string; id?: string; rows?: string[][]; caption?: string; headers?: string[] };
const blocksOf = (id: string) => introSections.find((s) => s.id === id)!.blocks as AnyBlock[];
const textOf = (blocks: AnyBlock[]) =>
  blocks.map((b) => [b.text ?? "", b.caption ?? "", ...(b.headers ?? []), ...(b.rows ?? []).flat()].join(" ")).join(" ");
const allText = [
  textOf(introSections.flatMap((s) => s.blocks as AnyBlock[])),
  introSections.map((s) => `${s.title} ${s.lead}`).join(" "),
  JSON.stringify(introQuestions),
  JSON.stringify(introExerciseMeta),
  JSON.stringify(COMMUTE_STEPS),
  JSON.stringify(UMBRELLA_STEPS),
  JSON.stringify(TEAM_TASKS),
].join(" ");

describe("structure", () => {
  it("sections equal sectionIds.ts, in order", () => {
    expect(introSections.map((s) => ({ id: s.id, title: s.title }))).toEqual(INTRO_SECTIONS.map((s) => ({ ...s })));
  });

  it("every checkpoint appears once in the lesson, in the listed order", () => {
    const placed = introSections.flatMap((s) => (s.blocks as AnyBlock[]).filter((b) => b.type === "question").map((b) => b.id));
    expect(placed).toEqual(INTRO_CHECKPOINT_IDS);
    expect(introQuestions.map((q) => q.id)).toEqual(INTRO_CHECKPOINT_IDS);
  });

  it("has the interactive pieces in the sections that teach them", () => {
    const where = (type: string) => introSections.filter((s) => (s.blocks as AnyBlock[]).some((b) => b.type === type)).map((s) => s.id);
    expect(where("intro-process")).toEqual(["intro-process"]);
    expect(where("intro-commute")).toEqual(["intro-process"]);
    expect(where("intro-team")).toEqual(["intro-team"]);
    expect(where("intro-contest-flow")).toEqual(["intro-contest"]);
    expect(where("intro-map")).toEqual(["intro-map"]);
    expect(where("intro-umbrella")).toEqual(["intro-umbrella"]);
    expect(where("intro-cycle")).toEqual(["intro-review"]);
    expect(where("intro-tracks")).toEqual(["intro-next"]);
  });
});

describe("every number in the text is the verified one", () => {
  it("walking times (§1, §2)", () => {
    expect(introNumbers.walk).toEqual({ normal: verified.walk.normal, light: verified.walk.light, slow: verified.walk.slow });
    const s1 = textOf(blocksOf("intro-what"));
    expect(s1).toContain("900 ÷ 1.5 = 600 秒，也就是 10 分钟");
    for (const m of ["10 分钟", "11 分钟", "12.5 分钟"]) expect(s1).toContain(m);
    expect(textOf(blocksOf("intro-assume"))).toContain("10、11、12.5 分钟三个不同的时间");
  });

  it("commute (§3, §4)", () => {
    expect(introNumbers.commute.average).toBe(verified.commute.mean);
    expect(introNumbers.commute.sum).toBe(verified.commute.sum);
    const s3 = textOf(blocksOf("intro-process"));
    expect(s3).toContain(`平均用时 ${verified.commute.mean} 分钟算出 7:48 出门`);
    const at48 = verified.commute.departures.find((d) => d.depart === 48)!;
    expect(s3).toContain(`10 天里有 ${at48.late.length} 天会迟到`);
    expect(textOf(blocksOf("intro-team"))).toContain(`平均用时 ${verified.commute.sum} 分钟`);
  });

  it("the nine commute steps", () => {
    const at48 = verified.commute.departures.find((d) => d.depart === 48)!;
    const at45 = verified.commute.departures.find((d) => d.depart === 45)!;
    expect(COMMUTE_STEPS.map((s) => s.name)).toEqual(["发现问题", "明确目标", "选择变量", "提出假设", "收集数据", "建立关系", "求解", "检验", "解释与改进"]);
    expect(COMMUTE_STEPS[4].result).toContain(verified.inputs.commuteDays.join("、"));
    expect(COMMUTE_STEPS[6].result).toBe(`t = 8:00 − ${verified.commute.mean} 分钟 = 7:48。`);
    expect(COMMUTE_STEPS[7].result).toContain(`10 天里有 ${at48.late.length} 天迟到（第 ${at48.late.join("、")} 天）`);
    expect(at45.onTime).toBe(10);
    expect(COMMUTE_STEPS[7].next).toContain(`最长的 ${verified.commute.max} 分钟，7:45 出门，10 天都准时`);
    expect(COMMUTE_STEPS[8].result).toContain(`只看晴天，7:${60 - verified.commute.sunnyMax} 出门就够`);
    // Each step answers the five questions of the brief.
    for (const s of COMMUTE_STEPS) for (const f of [s.why, s.need, s.pitfall, s.result, s.next]) expect(f.length).toBeGreaterThanOrEqual(5);
    // Checking sends the work back (iteration), the last step loops to data again.
    expect(COMMUTE_STEPS[7].loopsTo).toEqual([2, 6]);
    expect(COMMUTE_STEPS[8].loopsTo).toEqual([5]);
  });

  it("umbrella (§7, §8)", () => {
    expect(introNumbers.umbrella.now.shortage).toBe(verified.umbrella.curve.find((p) => p.x === 0)!.shortage);
    expect(introNumbers.umbrella.best.low).toBe(verified.umbrella.scenarios[0].low);
    expect(textOf(blocksOf("intro-umbrella"))).toContain("一共 60 把伞");
    expect(textOf(blocksOf("intro-review"))).toContain("调 20 把的方案");
    expect(UMBRELLA_STEPS[6].did).toBe("把每一种调法都算一遍：x = 20 时缺口最小，为 0（不调配时是 20）。");
    expect(UMBRELLA_STEPS[4].did).toBe("A 点现有 20、需要 40；B 点现有 40、需要 20；共 60 把。");
  });
});

describe("checkpoints", () => {
  it("are single choice, with the answer among the options and a reason for every wrong option", () => {
    for (const q of introQuestions) {
      if (q.type !== "single") throw new Error(`${q.id} should be single choice`);
      const ids = q.options.map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).toContain(q.answer);
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      const meta = introExerciseMeta[q.id];
      expect(meta, q.id).toBeDefined();
      const diagnosed = meta.errors.map((e) => ("option" in e ? e.option : ""));
      expect([...diagnosed].sort(), q.id).toEqual(ids.filter((id) => id !== q.answer).sort());
      for (const e of meta.errors) expect(e.message.length, q.id).toBeGreaterThan(15);
      expect(q.explanation.length).toBeGreaterThan(40);
      expect(q.hints.length).toBeGreaterThan(0);
      expect(INTRO_SECTIONS.some((s) => s.id === meta.sectionId)).toBe(true);
    }
  });

  it("cover the six ideas of the brief", () => {
    expect(introQuestions.map((q) => q.knowledge)).toEqual([
      "现实问题与模型",
      "假设与数据",
      "检验与修改",
      "团队分工与合作",
      "按问题选思路",
      "识别优化目标",
    ]);
  });

  it("numbers inside questions are the verified ones", () => {
    const q3 = introQuestions.find((q) => q.id === "intro-think-3")!;
    expect(q3.prompt).toContain(`平均用时 ${verified.commute.mean} 分钟算出 7:48 出门`);
    expect(q3.explanation).toContain(`最长的 ${verified.commute.max} 分钟，7:45 出门`);
    const q4 = introQuestions.find((q) => q.id === "intro-think-4")!;
    expect(q4.prompt).toContain(`平均用时 ${verified.commute.sum} 分钟`);
    expect(q4.explanation).toContain(`正确的平均值是 ${verified.commute.mean} 分钟`);
    expect(introExerciseMeta["intro-think-3"].errors[0].message).toContain(`${verified.commute.sum} ÷ 10 = ${verified.commute.mean}`);
  });
});

describe("content rules", () => {
  it("does not reuse the 2004 article's bird-shooting example or its unhealthy advice", () => {
    for (const word of ["打鸟", "开枪", "枪声", "鸟"]) expect(allText).not.toContain(word);
    expect(allText).not.toMatch(/多熬夜|熬夜训练|通宵/);
    // Sleep is recommended, not cut.
    expect(textOf(blocksOf("intro-team"))).toContain("保证睡眠");
  });

  it("makes no award promise or fixed contest rule claims", () => {
    expect(allText).not.toMatch(/一等奖|特等奖|保证获奖|必须获奖|稳拿/);
    // Rules that vary by contest are only named as things to look up.
    expect(allText).not.toMatch(/三人一队|72 小时|每队 3 人|9 月\d+ 日/);
    const contest = textOf(blocksOf("intro-contest"));
    expect(contest).toContain("以当届主办方发布的通知和规则为准");
    expect(contest).toContain("比赛的价值不只是获奖");
    expect(contest).toMatch(/不编造数据.*不虚构实验.*不伪造结论.*不抄袭/);
    expect(contest).toContain("以当届赛事的规则为准");
  });

  it("never calls modelling formula plugging, and never sells one method as universal", () => {
    // The misconception is only ever quoted to be refuted.
    expect(allText.replaceAll("常有人说“数学建模就是套公式”，这是最常见的误解", "")).not.toMatch(/数学建模就是套用|建模就是套公式/);
    expect(textOf(blocksOf("intro-what"))).toContain("常有人说“数学建模就是套公式”，这是最常见的误解");
    expect(textOf(blocksOf("intro-map"))).toContain("没有万能的算法");
  });

  it("says that results hold under assumptions and that the data are invented", () => {
    expect(textOf(blocksOf("intro-what"))).toContain("在这些假设下，模型给出");
    expect(textOf(blocksOf("intro-umbrella"))).toContain("不是任何学校的真实调查");
    expect(textOf(blocksOf("intro-review"))).toContain("不是“现实中必然发生的结果”");
  });

  it("names its 2004 sources, what was kept, and that nothing was copied", () => {
    const sources = textOf(blocksOf("intro-next"));
    for (const s of ["《数模》2004 年第 1 卷第 1 期", "向为《数学建模竞赛新手教程》", "王瑛《数模之路》", "董乘宇《数学建模竞赛中应当掌握的十类算法》", "《参加数学建模竞赛的十大秘诀》"])
      expect(sources).toContain(s);
    expect(sources).toContain("未转载原文");
    expect(sources).toContain("本课没有沿用");
  });

  it("every team task needs at least two kinds of work", () => {
    for (const t of TEAM_TASKS) {
      expect(t.involves.length).toBeGreaterThanOrEqual(2);
      for (const u of t.usual) expect(t.involves).toContain(u);
    }
  });
});
