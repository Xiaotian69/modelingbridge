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
  upcomingMilestones,
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
    expect(cumcm.events.find((e) => e.kind === "contest")!.start).toBe("2027-09-10T18:00");
    expect(cumcm.notes[0]).toMatch(/不是官方安排/);
    const huashu = y.find((e) => e.info.id === "huashu-intl")!;
    expect(huashu.events[0].start).toBe("2026-11-27");
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
    expect(phase("apmcm").detail).toBe("截止 11 月 25 日");
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
