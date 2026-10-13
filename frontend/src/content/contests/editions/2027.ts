import type { ContestEdition } from "../types";

/**
 * 2027 年：只写已经公布的届次。没有写进来的赛事，页面会按最近一届的官方日期推算，
 * 并显示为“预计（参考某年）”。官方公布后，在这里补一条即可覆盖推算。
 */
export const editions2027: ContestEdition[] = [
  {
    contestId: "mcm",
    year: 2027,
    status: "scheduled",
    events: [
      { kind: "registration", end: "2027-01-28T15:00", tz: "America/New_York", certainty: "official", note: "由指导教师在线注册，截止后不再接受报名" },
      { kind: "contest", start: "2027-01-28T17:00", end: "2027-02-01T20:00", tz: "America/New_York", certainty: "official" },
      { kind: "submission", end: "2027-02-01T21:00", tz: "America/New_York", certainty: "official", note: "论文 PDF 提交截止" },
      { kind: "results", end: "2027-05-08", tz: "America/New_York", certainty: "official" },
    ],
    sources: [
      {
        title: "MCM/ICM Contest Rules, Registration and Instructions（2027）",
        url: "https://www.contest.comap.com/undergraduate/contests/mcm/instructions.php",
        publisher: "COMAP",
        type: "organizer",
        checkedAt: "2026-10-13",
      },
    ],
  },
];
