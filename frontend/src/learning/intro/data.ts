/**
 * Teaching data of 第零课. Every number here is invented for teaching (stated in the lesson);
 * verify_intro.py repeats these inputs and a test checks they are equal.
 */

/** §1: 宿舍到教学楼的一段路. */
export const WALK = {
  metres: 900,
  /** 平常的步行速度，米/秒. */
  speed: 1.5,
  /** 背着书包、边走边看手机，米/秒. */
  slowSpeed: 1.2,
  /** 一个红绿灯平均要等的分钟数. */
  lightWait: 1,
};

/** §3: 小周连续 10 个上学日的步行用时（分钟），第 7 天下雨. */
export const COMMUTE_DAYS = [11, 12, 10, 13, 11, 12, 15, 11, 12, 13];
export const RAIN_DAYS = [7];
/** 上课时刻 8:00，用“7 点后的第几分钟”表示. */
export const CLASS_MINUTE = 60;
/** The departure slider: 7:40–7:52. */
export const DEPART_RANGE = { min: 40, max: 52 };

/** §7: 两个共享雨伞点. A 在教学楼门口，B 在宿舍区. */
export type UmbrellaCase = {
  /** 下雨前每个点现有的伞. */
  stock: { a: number; b: number };
  /** 预计下雨时来借伞的人数（每人 1 把）. */
  demand: { a: number; b: number };
};
export const UMBRELLA: UmbrellaCase = { stock: { a: 20, b: 40 }, demand: { a: 40, b: 20 } };

/** “如果预测不准”: preset demand scenarios (stock stays as in UMBRELLA). */
export const SCENARIOS: { id: string; label: string; demand: { a: number; b: number } }[] = [
  { id: "forecast", label: "预测准确", demand: { a: 40, b: 20 } },
  { id: "more-a", label: "A 点多来 10 人", demand: { a: 50, b: 20 } },
  { id: "light", label: "雨下得小", demand: { a: 30, b: 15 } },
  { id: "event-b", label: "宿舍区有活动", demand: { a: 25, b: 35 } },
];
/** Range of the free demand sliders. */
export const DEMAND_MAX = 70;
