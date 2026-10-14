/**
 * The lesson's data (original teaching example, not a real shop's records): a campus milk-tea
 * shop's two weeks of daily cups sold, the day's highest temperature and whether it was a weekend.
 * Day 1 is a Monday. verify_regression.py holds the same numbers; a test keeps them equal.
 */
export const DAYS = 14;
/** Highest temperature of the day, ℃. */
export const TEMPERATURE = [26, 28, 31, 33, 29, 25, 27, 30, 34, 35, 32, 28, 24, 30];
/** 1 = Saturday or Sunday. */
export const WEEKEND = [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1];
/** Cups sold. */
export const SALES = [174, 199, 208, 229, 195, 197, 224, 195, 227, 239, 218, 191, 191, 235];
export const WEEKDAY_NAMES = ["一", "二", "三", "四", "五", "六", "日"];

/** Tomorrow (§7): a Saturday with a forecast high of 32 ℃. */
export const TOMORROW = { temperature: 32, weekend: 1 };
/** A day far outside the data (§7, §9): early spring, 12 ℃. */
export const COLD_DAY = 12;
/** A campus event day added in the lab and §9: 25 ℃ on a weekday, 300 cups. */
export const EVENT_DAY = { temperature: 25, weekend: 0, sales: 300 };

/** Small hand-calculation example (§4, practice). */
export const HAND_X = [1, 2, 3, 4, 5];
export const HAND_Y = [2, 4, 5, 4, 5];
