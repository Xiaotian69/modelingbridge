import type { ContestEdition, ContestSource } from "../types";

const C = "2026-10-13";
const cmathc = (id: number, title: string, publisher: string): ContestSource => ({
  title,
  url: `https://www.cmathc.org.cn/mcm/tz/${id}.html`,
  publisher: `大学生数学竞赛网（转载自：${publisher}）`,
  type: "repost",
  checkedAt: C,
});

/** 2026 年各赛事：全部时间来自主办方原文、官方报名平台或注明原发布方的转载，核验日期 2026-10-13。 */
export const editions2026: ContestEdition[] = [
  {
    contestId: "mcm",
    year: 2026,
    status: "scheduled",
    events: [
      { kind: "registration", end: "2026-01-29T15:00", tz: "America/New_York", certainty: "official", note: "由指导教师在线注册，截止后不再接受报名" },
      { kind: "contest", start: "2026-01-29T17:00", end: "2026-02-02T20:00", tz: "America/New_York", certainty: "official" },
      { kind: "submission", end: "2026-02-02T21:00", tz: "America/New_York", certainty: "official", note: "论文 PDF 提交截止" },
      { kind: "results", end: "2026-05-08", tz: "America/New_York", certainty: "official" },
    ],
    sources: [
      {
        title: "MCM/ICM Rules, Registration and Instructions（2026 版，网页存档）",
        url: "https://web.archive.org/web/2026/https://www.contest.comap.com/undergraduate/contests/mcm/instructions.php",
        publisher: "COMAP",
        type: "organizer",
        checkedAt: C,
      },
    ],
  },
  {
    contestId: "huashu-intl",
    year: 2026,
    title: "第四届",
    status: "scheduled",
    events: [
      { kind: "registration", start: "2025-11-27", end: "2026-01-16T23:59", certainty: "official" },
      { kind: "contest", start: "2026-01-17T06:00", end: "2026-01-21T09:00", certainty: "official" },
    ],
    sources: [{ title: "2026 年第四届“华数杯”国际大学生数学建模竞赛（报名页）", url: "https://m.saikr.com/mcmicm2026", publisher: "赛氪（官方报名平台）", type: "platform", checkedAt: C }],
  },
  {
    contestId: "huazhong",
    year: 2026,
    title: "第十八届",
    status: "scheduled",
    events: [
      { kind: "registration", start: "2026-03-10T12:00", end: "2026-04-23T12:00", certainty: "official" },
      { kind: "contest", start: "2026-04-23T18:00", end: "2026-04-26T20:00", certainty: "official" },
    ],
    sources: [cmathc(405, "第十八届“华中杯”大学生数学建模挑战赛竞赛通知（第一轮）", "华中杯数学建模挑战赛")],
    notes: ["原通知中评阅和成绩公示的年份写作 2025，疑为笔误，未收录这两项。"],
  },
  {
    contestId: "mathorcup",
    year: 2026,
    title: "第十六届",
    status: "scheduled",
    events: [
      { kind: "registration", end: "2026-04-16T12:00", certainty: "official", note: "通知写“即日起至 4 月 16 日中午 12 时止”" },
      { kind: "contest", start: "2026-04-17T08:00", end: "2026-04-21T09:00", certainty: "official" },
    ],
    sources: [cmathc(399, "2026 年第十六届 MathorCup 数学应用挑战赛报名通知", "MathorCup 数学应用挑战赛组委会")],
  },
  {
    contestId: "huadong",
    year: 2026,
    title: "第二十八届",
    status: "scheduled",
    events: [
      { kind: "registration", start: "2026-04-19T09:00", end: "2026-04-30T18:00", certainty: "official" },
      { kind: "contest", start: "2026-04-30T20:00", end: "2026-05-04T20:00", certainty: "official", note: "赛题 4 月 30 日 18:00 发布" },
    ],
    sources: [cmathc(435, "2026 年第二十八届华东杯大学生数学建模邀请赛通知", "华东杯大学生数学建模邀请赛")],
  },
  {
    contestId: "wuyi",
    year: 2026,
    title: "第二十三届",
    status: "scheduled",
    events: [
      { kind: "registration", start: "2026-04-02T08:00", end: "2026-04-30T24:00", certainty: "official" },
      { kind: "contest", start: "2026-05-01T10:00", end: "2026-05-04T12:00", certainty: "official" },
    ],
    sources: [cmathc(424, "2026 年第二十三届五一数学建模竞赛参赛通知", "五一数学建模竞赛组委会")],
  },
  {
    contestId: "shuwei-spring",
    year: 2026,
    title: "第十一届",
    status: "scheduled",
    events: [
      { kind: "contest", start: "2026-05-08T09:00", end: "2026-05-11T09:00", certainty: "official" },
      { kind: "submission", end: "2026-05-11T10:00", certainty: "official" },
    ],
    sources: [{ title: "2026 年第十一届数维杯大学生数学建模挑战赛（春季赛）题目", url: "https://www.nmmcm.org.cn/Awards/185.html", publisher: "数维杯组委会", type: "organizer", checkedAt: C }],
    pending: [{ kind: "registration", note: "报名截止时间未能在官网再次核对" }],
  },
  {
    contestId: "tzmcm",
    year: 2026,
    title: "第十九届",
    status: "scheduled",
    events: [{ kind: "stage", label: "第二阶段", start: "2026-05-14T20:00", end: "2026-05-17T20:00", certainty: "official" }],
    sources: [{ title: "数学中国数学建模网络挑战赛（第二阶段参赛须知）", url: "http://www.tzmcm.cn/", publisher: "数学中国", type: "organizer", checkedAt: C }],
    pending: [{ kind: "stage", label: "第一阶段", note: "第一阶段时间未能在官网首页再次核对" }],
  },
  {
    contestId: "eecmcm",
    year: 2026,
    title: "第十八届",
    status: "scheduled",
    events: [
      { kind: "registration", start: "2026-04-10", end: "2026-05-20T23:59", certainty: "official", note: "校内选拔时间各校不同" },
      { kind: "contest", start: "2026-05-22T08:00", end: "2026-05-25T08:00", certainty: "official", note: "赛题文件 5 月 22 日 6:00 发布，8:00 公布密码" },
    ],
    sources: [cmathc(480, "第十八届“中国电机工程学会杯”全国大学生电工数学建模竞赛报名通知（最后一轮）", "全国大学生电工数学建模竞赛")],
  },
  {
    contestId: "zhongqing",
    year: 2026,
    title: "第八届",
    status: "scheduled",
    events: [
      { kind: "registration", start: "2026-01-22", end: "2026-06-04T12:00", certainty: "official", note: "通知落款 2026 年 1 月 22 日，写“即日起”报名，以落款日作为开始" },
      { kind: "contest", start: "2026-06-04T17:00", end: "2026-06-07T17:00", certainty: "official" },
    ],
    sources: [cmathc(401, "关于举办 2026 年第八届中青杯全国大学生数学建模竞赛的通知", "中青杯官网")],
  },
  {
    contestId: "apmcm-cn",
    year: 2026,
    title: "第十六届",
    status: "scheduled",
    events: [
      { kind: "registration", start: "2026-04-11", end: "2026-06-12T12:00", certainty: "unverified", note: "来自赛氪报名页的检索摘要，未直接打开核对" },
      { kind: "contest", start: "2026-06-12T18:00", end: "2026-06-15T20:00", certainty: "official" },
    ],
    sources: [{ title: "2026 年第十六届 APMCM 亚太地区大学生数学建模竞赛（中文赛项）", url: "https://www.apmcm.org/detail/2510", publisher: "亚太地区大学生数学建模竞赛组委会", type: "organizer", checkedAt: C }],
  },
  {
    contestId: "shenzhen",
    year: 2026,
    status: "suspended",
    events: [],
    sources: [cmathc(488, "关于暂停举办 2026 年“深圳杯”数学建模挑战赛的通知", "深圳杯数学建模挑战赛")],
    notes: ["2026-05-21 公告：受不可抗力影响，2026 年度赛事暂停举办。"],
  },
  {
    contestId: "cumcm",
    year: 2026,
    status: "scheduled",
    events: [
      { kind: "registration", end: "2026-09-07T20:00", label: "向全国组委会报名截止", certainty: "official", note: "由学校统一报名；学校和赛区的截止时间更早，以本校通知为准" },
      { kind: "contest", start: "2026-09-10T18:00", end: "2026-09-13T20:00", certainty: "official" },
    ],
    sources: [{ title: "2026 高教社杯全国大学生数学建模竞赛第一次通知（数模竞赛[2026-01]号）", url: "https://www.mcm.edu.cn/html_cn/node/d6fd7a0ee8f3a3d525e30af1c365fcec.html", publisher: "中国工业与应用数学学会", type: "organizer", checkedAt: C }],
  },
  {
    contestId: "cpgmcm",
    year: 2026,
    title: "第二十三届",
    status: "scheduled",
    events: [
      { kind: "registration", start: "2026-06-01T08:00", end: "2026-09-19T17:00", certainty: "official" },
      { kind: "contest", start: "2026-09-23T08:00", end: "2026-09-27T12:00", certainty: "official" },
      { kind: "submission", label: "上传论文", start: "2026-09-27T14:00", end: "2026-09-28T24:00", certainty: "official" },
    ],
    sources: [cmathc(465, "2026 年“华为杯”第二十三届中国研究生数学建模竞赛参赛通知", "中国研究生数学建模竞赛")],
  },
  {
    contestId: "mathorcup-bigdata",
    year: 2026,
    title: "第七届",
    status: "scheduled",
    events: [
      { kind: "registration", start: "2026-08-10", end: "2026-10-23T12:00", certainty: "official", note: "通知落款 2026 年 8 月 10 日，写“即日起”报名，以落款日作为开始" },
      { kind: "contest", label: "初赛", start: "2026-10-23T18:00", end: "2026-10-30T20:00", certainty: "official" },
      { kind: "stage", label: "复赛", start: "2026-12-04T18:00", end: "2026-12-11T20:00", certainty: "official", note: "初赛成绩前 10% 的队伍进入复赛" },
    ],
    sources: [cmathc(612, "2026 年第七届 MathorCup 数学应用挑战赛—大数据竞赛报名通知", "MathorCup 数学应用挑战赛")],
  },
  {
    contestId: "apmcm",
    year: 2026,
    title: "第十六届",
    status: "scheduled",
    events: [
      { kind: "registration", start: "2026-09-01", end: "2026-11-25", certainty: "official", note: "报名截止后不能更改报名信息" },
      { kind: "contest", start: "2026-11-26T06:00", end: "2026-11-30T09:00", certainty: "official" },
      { kind: "results", end: "2027-01-15", certainty: "official", note: "官方写“2027 年 1 月 15 日前”公布" },
    ],
    sources: [
      { title: "2026 年 APMCM 亚太地区大学生数学建模竞赛报名通知（亚太赛[2026]04 号）", url: "https://www.apmcm.org/detail/2512", publisher: "亚太地区大学生数学建模竞赛组委会", type: "organizer", checkedAt: C },
      { title: "2026 年第十六届 APMCM 报名页", url: "https://www.saikr.com/vse/apmcm26", publisher: "赛氪（官方报名平台）", type: "platform", checkedAt: C },
    ],
  },
  {
    contestId: "shuwei-autumn",
    year: 2026,
    title: "第十二届",
    status: "scheduled",
    events: [
      { kind: "registration", start: "2026-08", end: "2026-11-20T06:00", certainty: "official", note: "官网写“2026 年 8 月至 11 月 20 日 06:00”" },
      { kind: "contest", start: "2026-11-20T09:00", end: "2026-11-24T09:00", certainty: "official" },
      { kind: "submission", end: "2026-11-24T10:00", certainty: "official" },
    ],
    sources: [{ title: "数维杯官网“赛事流程”（2026 秋季赛）", url: "https://www.nmmcm.org.cn/", publisher: "数维杯组委会", type: "organizer", checkedAt: C }],
  },
];
