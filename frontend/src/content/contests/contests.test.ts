import { describe, expect, it } from "vitest";
import {
  ALL_EDITIONS,
  CALENDAR_YEARS,
  buildIcs,
  contestCatalog,
  daysUntil,
  describeEvent,
  editionPhase,
  editionsForYear,
  findEdition,
  parseLocal,
  predictionShiftDays,
  remainingText,
  upcomingMilestones,
  milestoneWhen,
  usEasternOffset,
  yearFraction,
} from ".";

const NOW = new Date("2026-10-13T04:00:00Z"); // 北京时间 2026-10-13 12:00

describe("数据完整性（每次改年份文件都会检查）", () => {
  it("每届赛事都属于档案中的赛事，且一项赛事一年只有一条", () => {
    const ids = new Set(contestCatalog.map((c) => c.id));
    const keys = ALL_EDITIONS.map((e) => `${e.contestId}@${e.year}`);
    ALL_EDITIONS.forEach((e) => expect(ids.has(e.contestId)).toBe(true));
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(contestCatalog.map((c) => c.id)).size).toBe(contestCatalog.length);
  });

  it("每届都有可追溯的来源和核验日期", () => {
    for (const e of ALL_EDITIONS) {
      expect(e.sources.length, `${e.contestId} ${e.year}`).toBeGreaterThan(0);
      for (const s of e.sources) {
        expect(s.url).toMatch(/^https?:\/\/[^\s]+$/);
        expect(s.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(s.publisher.length).toBeGreaterThan(1);
      }
    }
  });

  it("时间格式合法，结束不早于开始", () => {
    for (const e of ALL_EDITIONS)
      for (const ev of e.events) {
        const end = parseLocal(ev.end, ev.tz, "end");
        if (ev.start) expect(parseLocal(ev.start, ev.tz, "start").getTime(), `${e.contestId} ${ev.kind}`).toBeLessThanOrEqual(end.getTime());
      }
  });

  it("比赛日期落在所属年份；暂停的届次没有日期", () => {
    for (const e of ALL_EDITIONS) {
      if (e.status === "suspended") expect(e.events).toHaveLength(0);
      const contest = e.events.find((ev) => ev.kind === "contest" || ev.kind === "stage");
      if (contest) expect(Number((contest.start ?? contest.end).slice(0, 4)), e.contestId).toBe(e.year);
    }
  });

  it("报名和比赛是分开的事件，报名不会晚于比赛开始", () => {
    for (const e of ALL_EDITIONS) {
      const reg = e.events.find((ev) => ev.kind === "registration");
      const contest = e.events.find((ev) => ev.kind === "contest");
      if (reg && contest?.start)
        expect(parseLocal(reg.end, reg.tz, "end").getTime(), e.contestId).toBeLessThanOrEqual(parseLocal(contest.start, contest.tz).getTime());
    }
  });
});

describe("时间解析与时区", () => {
  it("北京时间按 UTC+8 解析", () => {
    expect(parseLocal("2026-09-10T18:00").toISOString()).toBe("2026-09-10T10:00:00.000Z");
  });
  it("“24 时”等于次日 0 点，只写日期的截止取当天结束", () => {
    expect(parseLocal("2026-04-30T24:00", "+08:00", "end").toISOString()).toBe("2026-04-30T16:00:00.000Z");
    expect(parseLocal("2026-11-25", "+08:00", "end").toISOString()).toBe("2026-11-25T16:00:00.000Z");
    expect(parseLocal("2026-11-25", "+08:00", "start").toISOString()).toBe("2026-11-24T16:00:00.000Z");
  });
  it("只写月份时，开始取月初", () => {
    expect(parseLocal("2026-08", "+08:00", "start").toISOString()).toBe("2026-07-31T16:00:00.000Z");
  });
  it("美赛按美东时间换算为北京时间，并保留官方原文时间", () => {
    const mcm = findEdition("mcm", 2027)!;
    const contest = mcm.events.find((e) => e.kind === "contest")!;
    expect(contest.startAt!.toISOString()).toBe("2027-01-28T22:00:00.000Z");
    const d = describeEvent(contest, 2027);
    expect(d.beijing).toBe("1 月 29 日 06:00 – 2 月 2 日 09:00");
    expect(d.official).toBe("美东时间（EST） 1 月 28 日 17:00 – 2 月 1 日 20:00");
  });
  it("跨年的时间显示年份", () => {
    const huashu = findEdition("huashu-intl", 2026)!;
    expect(describeEvent(huashu.events[0], 2026).beijing).toBe("2025 年 11 月 27 日 – 1 月 16 日 23:59");
    const apmcm = findEdition("apmcm", 2026)!;
    expect(describeEvent(apmcm.events.find((e) => e.kind === "results")!, 2026).beijing).toBe("2027 年 1 月 15 日");
  });
  it("天数按北京时间日历计算", () => {
    expect(daysUntil(new Date("2026-10-13T16:30:00Z"), NOW)).toBe(1); // 北京 10-14 00:30
    expect(daysUntil(new Date("2026-10-13T15:59:00Z"), NOW)).toBe(0);
  });
  it("年度时间轴位置按北京时间计算", () => {
    expect(yearFraction(parseLocal("2026-01-01T00:00"), 2026)).toBe(0);
    expect(yearFraction(parseLocal("2027-01-01T00:00"), 2026)).toBe(1);
  });
});

describe("年份与预测", () => {
  it("2027 年已公布的美赛用官方日期，其余按 2026 年推算并标明", () => {
    const y = editionsForYear(2027);
    const mcm = y.find((e) => e.info.id === "mcm")!;
    expect(mcm.predicted).toBe(false);
    const cumcm = y.find((e) => e.info.id === "cumcm")!;
    expect(cumcm.predicted).toBe(true);
    expect(cumcm.basedOn).toBe(2026);
    // 2026-09-10 是周四，推算到 2027 年最近的周四 9 月 9 日，而不是同月同日的周五
    expect(cumcm.events.find((e) => e.kind === "contest")!.start).toBe("2027-09-09T18:00");
    expect(cumcm.events.find((e) => e.kind === "contest")!.end).toBe("2027-09-12T20:00");
    expect(cumcm.notes[0]).toMatch(/不是官方安排/);
    const huashu = y.find((e) => e.info.id === "huashu-intl")!;
    expect(huashu.events[0].start).toBe("2026-11-26");
  });
  it("暂停的届次不用来推算；没有可参考数据时显示待公布", () => {
    const sz = editionsForYear(2027).find((e) => e.info.id === "shenzhen")!;
    expect(sz.status).toBe("tba");
    expect(sz.events).toHaveLength(0);
  });
  it("历史年份只显示有记录的赛事", () => {
    const y = editionsForYear(2025);
    expect(y.map((e) => e.info.id)).toEqual(["cumcm"]);
  });
  it("提供三个年份", () => {
    expect(CALENDAR_YEARS).toEqual([2025, 2026, 2027]);
  });
});

describe("状态（以 2026-10-13 为“今天”）", () => {
  const phase = (id: string, year = 2026, now = NOW) => editionPhase(findEdition(id, year)!, now);
  it("区分报名中、已结束、暂停、预计", () => {
    expect(phase("apmcm")).toMatchObject({ key: "registering", label: "报名中" });
    expect(phase("apmcm").detail).toBe("截止 11 月 25 日，还有 43 天");
    expect(phase("mathorcup-bigdata").key).toBe("registering");
    expect(phase("cumcm")).toMatchObject({ key: "finished" });
    expect(phase("shenzhen")).toMatchObject({ key: "suspended" });
    expect(phase("cumcm", 2027).key).toBe("predicted");
    expect(phase("mcm", 2027)).toMatchObject({ key: "registering", label: "报名截止前" });
  });
  it("比赛进行中与即将开始", () => {
    expect(phase("apmcm", 2026, new Date("2026-11-27T00:00:00Z")).key).toBe("running");
    expect(phase("cumcm", 2026, new Date("2026-09-08T00:00:00Z"))).toMatchObject({ key: "soon", label: "报名已截止 · 即将开赛", detail: "比赛开始还有 2 天" });
    expect(phase("cumcm", 2026, new Date("2026-08-01T00:00:00Z"))).toMatchObject({ key: "registering", label: "报名截止前" });
    expect(phase("mathorcup-bigdata", 2026, new Date("2026-11-10T00:00:00Z"))).toMatchObject({ key: "waiting", label: "待复赛" });
  });
  it("比赛结束、成绩未公布时显示等待成绩", () => {
    expect(phase("apmcm", 2026, new Date("2026-12-10T00:00:00Z")).label).toBe("等待成绩");
  });
  it("“接下来”只含官方节点，按时间排序", () => {
    const list = upcomingMilestones(NOW, 6);
    expect(list[0]).toMatchObject({ contest: "MathorCup 大数据", text: "报名截止", days: 10 });
    for (let i = 1; i < list.length; i++) expect(list[i].at.getTime()).toBeGreaterThanOrEqual(list[i - 1].at.getTime());
    expect(list.every((m) => m.year !== 2027 || m.contestId === "mcm")).toBe(true);
  });
  it("“接下来”每个赛事只列最近的一个节点，并写出非整日的时刻", () => {
    const list = upcomingMilestones(new Date("2026-10-14T02:00:00Z"), 5);
    expect(new Set(list.map((m) => m.contestId)).size).toBe(list.length);
    expect(list.map((m) => `${m.contest}:${m.text}`)).toEqual([
      "MathorCup 大数据:报名截止",
      "数维杯秋季:报名截止",
      "亚太赛:报名截止",
      "美赛:报名截止",
    ]);
    expect(milestoneWhen(list[0].at)).toBe("10 月 23 日 12:00");
    expect(milestoneWhen(list[2].at)).toBe("11 月 25 日"); // 只写日期的截止（当天 24:00）
    expect(milestoneWhen(list[3].at)).toBe("1 月 29 日 04:00"); // 美东 1 月 28 日 15:00
  });
});

describe(".ics 导出", () => {
  it("只包含官方节点，时间为 UTC", () => {
    const ics = buildIcs(findEdition("apmcm-cn", 2026)!, NOW);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1); // 报名为待核实，不导出
    expect(ics).toContain("DTSTART:20260612T100000Z");
    expect(ics).toContain("\r\n");
  });
  it("推算的届次不导出任何事件", () => {
    expect(buildIcs(findEdition("cumcm", 2027)!, NOW)).not.toContain("BEGIN:VEVENT");
  });
});


describe("夏令时与时区（复查）", () => {
  it("美国东部时间按夏令时规则区分 EST / EDT", () => {
    expect(usEasternOffset(2027, 1, 28, 17)).toBe(-300);
    expect(usEasternOffset(2027, 3, 14, 1, 59)).toBe(-300); // 2027 年 3 月 14 日 2:00 开始夏令时
    expect(usEasternOffset(2027, 3, 14, 3)).toBe(-240);
    expect(usEasternOffset(2027, 11, 7, 1)).toBe(-240); // 11 月 7 日 2:00 结束
    expect(usEasternOffset(2027, 11, 7, 2)).toBe(-300);
  });
  it("美赛 5 月的成绩公布按 EDT 换算，1 月的比赛按 EST 换算", () => {
    const mcm = findEdition("mcm", 2027)!;
    const results = mcm.events.find((e) => e.kind === "results")!;
    expect(results.endAt.toISOString()).toBe("2027-05-09T04:00:00.000Z"); // 当地 5 月 8 日 24:00 EDT
    expect(describeEvent(results, 2027).official).toBe("美东夏令时（EDT） 5 月 8 日");
    expect(describeEvent(mcm.events.find((e) => e.kind === "contest")!, 2027).official).toMatch(/^美东时间（EST）/);
  });
  it("中国赛事按北京时间，结果与运行环境的时区无关", () => {
    const d = parseLocal("2026-11-26T06:00");
    expect(d.toISOString()).toBe("2026-11-25T22:00:00.000Z");
    expect(describeEvent(findEdition("apmcm", 2026)!.events.find((e) => e.kind === "contest")!, 2026).official).toBeNull();
  });
});

describe("预测规则（复查）", () => {
  it("默认对齐星期几，固定节假日的赛事保持月日", () => {
    expect(predictionShiftDays("2026-09-10T18:00", 2027)).toBe(364);
    expect(predictionShiftDays("2026-05-01T10:00", 2027, "date")).toBe(365);
    expect(predictionShiftDays("2028-02-29", 2029, "date")).toBe(365); // 落到平年取 2 月 28 日
    const y = editionsForYear(2027);
    const wuyi = y.find((e) => e.info.id === "wuyi")!;
    expect(wuyi.events.find((e) => e.kind === "contest")!.start).toBe("2027-05-01T10:00");
    expect(wuyi.notes.join("")).toMatch(/固定在节假日/);
  });
  it("按星期几推算的赛事，开赛日与参考年份是同一个星期几", () => {
    const day = (ev: { startAt?: Date }) => new Date(ev.startAt!.getTime() + 8 * 3_600_000).getUTCDay();
    for (const ed of editionsForYear(2027).filter((e) => e.predicted && (e.info.predictAnchor ?? "weekday") === "weekday")) {
      const base = findEdition(ed.info.id, ed.basedOn!)!;
      const a = ed.events.find((e) => (e.kind === "contest" || e.kind === "stage") && e.startAt);
      const b = base.events.find((e) => (e.kind === "contest" || e.kind === "stage") && e.startAt);
      if (a && b) expect(day(a), ed.info.id).toBe(day(b));
    }
  });
  it("推算的届次：全部事件标为预计、时间带“约”、不带往届备注", () => {
    for (const ed of editionsForYear(2027).filter((e) => e.predicted)) {
      expect(ed.notes[0]).toMatch(/不是官方安排/);
      for (const ev of ed.events) {
        expect(ev.predicted).toBe(true);
        expect(ev.note).toBeUndefined();
        expect(describeEvent(ev, 2027).beijing).toMatch(/^(约 |截止 约 )/);
      }
    }
    expect(describeEvent(findEdition("mcm", 2027)!.events[1], 2027).beijing.startsWith("约")).toBe(false);
    const cumcmReg = editionsForYear(2027).find((e) => e.info.id === "cumcm")!.events[0];
    expect(describeEvent(cumcmReg, 2027).beijing).toBe("截止 约 9 月 6 日 20:00");
  });
});

describe("待核实与倒计时（复查）", () => {
  it("没能核实的节点作为“待核实”保留，不画成日期", () => {
    expect(findEdition("shuwei-spring", 2026)!.pending).toEqual([{ kind: "registration", note: "报名截止时间未能在官网再次核对" }]);
    expect(findEdition("tzmcm", 2026)!.pending[0]).toMatchObject({ label: "第一阶段" });
  });
  it("由待核实日期决定的状态会标明“日期待核实”", () => {
    const p = editionPhase(findEdition("apmcm-cn", 2026)!, new Date("2026-05-01T00:00:00Z"));
    expect(p.label).toBe("报名中（日期待核实）");
    expect(upcomingMilestones(new Date("2026-04-01T00:00:00Z"), 50).some((m) => m.contestId === "apmcm-cn" && m.text.startsWith("报名"))).toBe(false);
  });
  it("剩余时间：分钟、小时、天", () => {
    const now = new Date("2026-10-23T03:30:00Z");
    expect(remainingText(new Date("2026-10-23T04:00:00Z"), now)).toBe("30 分钟");
    expect(remainingText(new Date("2026-10-23T08:33:00Z"), now)).toBe("5 小时 3 分钟");
    expect(remainingText(new Date("2026-10-23T09:30:00Z"), now)).toBe("6 小时");
    expect(remainingText(new Date("2026-10-25T03:30:00Z"), now)).toBe("2 天");
    expect(remainingText(now, now)).toBe("0 分钟");
  });
  it("比赛进行中时，“接下来”给出距比赛结束的时间", () => {
    const list = upcomingMilestones(new Date("2026-11-27T00:00:00Z"), 3);
    expect(list[0]).toMatchObject({ contest: "亚太赛", text: "比赛结束", remaining: "3 天" });
  });
  it("截止时刻前后状态自动切换", () => {
    const ed = findEdition("mathorcup-bigdata", 2026)!;
    expect(editionPhase(ed, new Date("2026-10-23T03:59:00Z")).label).toBe("报名中");
    expect(editionPhase(ed, new Date("2026-10-23T04:00:30Z")).label).toBe("报名已截止 · 即将开赛");
    expect(editionPhase(ed, new Date("2026-10-23T10:00:30Z")).label).toBe("初赛进行中");
    expect(editionPhase(ed, new Date("2026-10-30T12:00:30Z")).label).toBe("待复赛");
  });
});
