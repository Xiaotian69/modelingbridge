/**
 * The nine steps of §3 (早八几点出门) and the same steps filled in for the umbrella case (§8).
 * Numbers are computed from data.ts; content.test.ts checks them.
 */
import { CLASS_MINUTE, COMMUTE_DAYS, RAIN_DAYS, UMBRELLA } from "./data";
import { clock, commuteCheck, latestSafeDeparture, mean, optimum, plan, total } from "./math";

export type ProcessStep = {
  id: string;
  name: string;
  why: string;
  need: string;
  pitfall: string;
  result: string;
  next: string;
  /** Steps that send the work back to an earlier one. */
  loopsTo?: number[];
};

const average = mean(COMMUTE_DAYS);
const byAverage = CLASS_MINUTE - average;
const late = commuteCheck(COMMUTE_DAYS, byAverage, CLASS_MINUTE).late;
const longest = Math.max(...COMMUTE_DAYS);
const safe = latestSafeDeparture(COMMUTE_DAYS, CLASS_MINUTE);
const sunny = COMMUTE_DAYS.filter((_, i) => !RAIN_DAYS.includes(i + 1));
const sunnySafe = latestSafeDeparture(sunny, CLASS_MINUTE);

export const STEP_NAMES = ["发现问题", "明确目标", "选择变量", "提出假设", "收集数据", "建立关系", "求解", "检验", "解释与改进"];

export const COMMUTE_STEPS: ProcessStep[] = [
  {
    id: "problem",
    name: STEP_NAMES[0],
    why: "先确认问题真的存在，并且说得出具体情况。",
    need: "现象：这学期早八已经迟到了 3 次。",
    pitfall: "把“我总是迟到”这种感受当成问题，没说清是什么事、发生了多少次。",
    result: "问题陈述：早八经常迟到，想找到合适的出门时刻。",
    next: "“合适”是什么意思还不清楚，交给下一步。",
  },
  {
    id: "goal",
    name: STEP_NAMES[1],
    why: "目标决定要算什么。“平均能到”和“几乎不迟到”是两个问题，答案不同。",
    need: "自己真正在意什么，愿意承担多大的迟到风险。",
    pitfall: "目标太模糊（“更好一点”），或者几个目标互相冲突（不迟到、又想多睡）却不排先后。",
    result: "目标：在最近两周的记录里每天都准时；满足这一点的前提下，出门尽量晚。",
    next: "知道了要决定出门时刻，要比较的是准时的天数。",
  },
  {
    id: "variables",
    name: STEP_NAMES[2],
    why: "分清哪些量由我们决定，哪些量只能观察，哪些是结果。",
    need: "问题里出现的所有量。",
    pitfall: "把结果当成可以直接选择的量，比如“我决定 7:59 到”。",
    result: "决策变量：出门时刻 t。会变化、只能观察的量：路上用时 T。结果：到达时刻 t + T。",
    next: "知道了要收集 T 的数据。",
  },
  {
    id: "assumptions",
    name: STEP_NAMES[3],
    why: "影响通勤的因素太多，要先决定哪些暂时不管，并写下来。",
    need: "对情况的了解和常识。",
    pitfall: "假设太多，模型脱离实际；太少，问题算不下去；更常见的是想了却没写下来。",
    result: "假设：走同一条路线；只算从宿舍门口到教学楼的步行时间，不含买早饭；最近两周的情况能代表接下来几周。",
    next: "决定了数据怎么收集：同一条路线、同样的起点和终点。",
  },
  {
    id: "data",
    name: STEP_NAMES[4],
    why: "光靠猜，不知道 T 有多大、每天差多少。",
    need: "用手机计时，连续记录 10 个上学日，并备注天气。",
    pitfall: "数据太少、记录方法前后不一致、漏记下雨这类特殊情况。",
    result: `10 天的用时（分钟）：${COMMUTE_DAYS.join("、")}，第 ${RAIN_DAYS.join("、")} 天下雨。（教学设定的数据）`,
    next: "给出求解要用的数。",
  },
  {
    id: "relation",
    name: STEP_NAMES[5],
    why: "把目标、变量和数据连起来，变成能计算的式子。",
    need: "第 2–5 步的结果。",
    pitfall: "写出的关系和目标对不上。",
    result: `到达时刻 = t + T；某天准时，就是 t + T 不晚于 8:00。第一版用平均用时 ${average} 分钟代表 T。`,
    next: "可以算出 t 了。",
  },
  {
    id: "solve",
    name: STEP_NAMES[6],
    why: "得到一个具体方案。",
    need: "关系式和数据。",
    pitfall: "算错，或者把“分钟数”和“时刻”混在一起。",
    result: `t = 8:00 − ${average} 分钟 = ${clock(byAverage)}。`,
    next: "拿去检验。",
  },
  {
    id: "check",
    name: STEP_NAMES[7],
    why: "算对了不等于方案能用，要回到目标和数据看结果是否合理。",
    need: "原始记录和目标。",
    pitfall: "只检查计算有没有错，不检查是否满足目标。",
    result: `${clock(byAverage)} 出门，10 天里有 ${late.length} 天迟到（第 ${late.join("、")} 天），不满足“每天准时”。`,
    next: `回到第 2 步和第 6 步：平均值回答的是“一般要多久”，改用 10 天里最长的 ${longest} 分钟，${clock(safe)} 出门，10 天都准时。`,
    loopsTo: [2, 6],
  },
  {
    id: "improve",
    name: STEP_NAMES[8],
    why: "说明结论在什么条件下成立，并找出可以改进的地方。",
    need: "检验结果和假设清单。",
    pitfall: "把在记录里成立的结论，说成“以后一定不会迟到”。",
    result: `按最近两周的记录，${clock(safe)} 出门每天都能准时，最慢的一天是雨天。只看晴天，${clock(sunnySafe)} 出门就够；但雨天只有一次记录，还不能下结论。`,
    next: "继续记录，尤其是雨天；数据多了，可以晴天、雨天分开定出门时刻。这又回到了第 5 步。",
    loopsTo: [5],
  },
];

const best = optimum(UMBRELLA);
const now = plan(UMBRELLA, 0);
/** §8: what the learner did in the umbrella case, step by step. */
export const UMBRELLA_STEPS: { name: string; did: string }[] = [
  { name: STEP_NAMES[0], did: "下雨时，有的点伞不够，有的点伞用不完。" },
  { name: STEP_NAMES[1], did: "借不到伞的人数尽量少（A、B 两点的缺口相加）。" },
  { name: STEP_NAMES[2], did: "x = 从 B 点调到 A 点的伞数。" },
  { name: STEP_NAMES[3], did: "需求预测准确；下雨前调完，不计搬运成本；雨中不归还；学生只在本点借伞。" },
  { name: STEP_NAMES[4], did: `A 点现有 ${UMBRELLA.stock.a}、需要 ${UMBRELLA.demand.a}；B 点现有 ${UMBRELLA.stock.b}、需要 ${UMBRELLA.demand.b}；共 ${total(UMBRELLA)} 把。` },
  { name: STEP_NAMES[5], did: "缺口 = A 点缺的 + B 点缺的，缺的伞数不会小于 0。" },
  { name: STEP_NAMES[6], did: `把每一种调法都算一遍：x = ${best.low} 时缺口最小，为 ${best.shortage}（不调配时是 ${now.shortage}）。` },
  { name: STEP_NAMES[7], did: "改变需求再算：原方案不一定还是最好的。" },
  { name: STEP_NAMES[8], did: "说明方案依赖预测；需求超过总数时，要靠增加雨伞或分配规则。" },
];
