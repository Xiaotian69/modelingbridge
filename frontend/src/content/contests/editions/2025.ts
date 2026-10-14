import type { ContestEdition } from "../types";

/** 2025 年（历史）：只收录已从主办方原文核对过的届次；其余赛事显示“未收录”。 */
export const editions2025: ContestEdition[] = [
  {
    contestId: "cumcm",
    year: 2025,
    status: "scheduled",
    events: [
      { kind: "registration", end: "2025-09-01T20:00", label: "向全国组委会报名截止", certainty: "official", note: "学校和赛区的截止时间更早" },
      { kind: "contest", start: "2025-09-04T18:00", end: "2025-09-07T20:00", certainty: "official" },
    ],
    sources: [
      {
        title: "2025 高教社杯全国大学生数学建模竞赛第一次通知（数模竞赛[2025-01]号）",
        url: "https://www.mcm.edu.cn/html_cn/node/26a645851659040725c2892fb1935f95.html",
        publisher: "中国工业与应用数学学会",
        type: "organizer",
        checkedAt: "2026-10-13",
      },
    ],
  },
];
