/**
 * 赛事日历数据模型（维护说明见 docs/calendar-maintenance.md）。
 *
 * 时间写法：按官方原文所在时区的“当地时间”记录，不做换算。
 * - "2026-09-10T18:00"：精确到分钟；
 * - "2026-11-25"：只到日期（开始取当天 00:00，结束取当天 24:00）；
 * - "2026-08"：只到月份（官方原文只写了月份时使用）。
 * 结束时间写 "T24:00" 表示官方原文就是“24 时”。
 */
/**
 * 时区：北京时间写 "+08:00"（可省略）；美国东部时间写 "America/New_York"，
 * 程序按美国夏令时规则自动区分 EST（-05:00）和 EDT（-04:00），不要手写固定偏移。
 */
export type TzOffset = "+08:00" | "America/New_York";

export type ContestCategory = "核心赛" | "综合训练赛" | "行业专项赛" | "研究生赛";

export type EventKind = "registration" | "contest" | "stage" | "submission" | "results";

/** official：有主办方或其官方报名平台的原文；unverified：只有转载或无法再次核对。predicted 由程序推算，不写进数据文件。 */
export type Certainty = "official" | "unverified";

export type ContestEvent = {
  kind: EventKind;
  /** 默认按 kind 显示“报名 / 比赛 / 提交截止 / 成绩公布”，阶段赛事可以自定义。 */
  label?: string;
  /** 报名开始未知（如“即日起”）时可以省略，只显示截止。 */
  start?: string;
  end: string;
  tz?: TzOffset;
  certainty: Certainty;
  note?: string;
};

export type SourceType = "organizer" | "platform" | "repost";
export type ContestSource = {
  title: string;
  url: string;
  /** 发布者：主办方 / 官方报名平台 / 转载网站，以及原文发布方。 */
  publisher: string;
  type: SourceType;
  /** 我们最后一次打开并核对的日期。 */
  checkedAt: string;
};

export type EditionStatus = "scheduled" | "suspended" | "cancelled" | "postponed";

/** 已知存在、但没能核实日期的节点：页面显示“待核实”，不画在时间轴上。 */
export type PendingEvent = { kind: EventKind; label?: string; note: string };

export type ContestEdition = {
  contestId: string;
  year: number;
  /** 第几届等官方名称，可选。 */
  title?: string;
  status: EditionStatus;
  events: ContestEvent[];
  sources: ContestSource[];
  pending?: PendingEvent[];
  notes?: string[];
};

export type ContestInfo = {
  id: string;
  name: string;
  short: string;
  organizer: string;
  website?: string;
  category: ContestCategory;
  /** 适合谁、练什么：跨年不变的介绍。 */
  fit: string;
  prepFocus: string[];
  /**
   * 推算下一届日期的方式：默认 "weekday"（对齐到相同星期几，多数赛事固定在周四/周五开赛）；
   * 固定在节假日前后的赛事（如五一）用 "date"（保持相同月日）。
   */
  predictAnchor?: "weekday" | "date";
};

/** 页面使用的一届赛事（官方数据，或由程序按往年推算）。 */
export type ResolvedEvent = ContestEvent & {
  startAt?: Date;
  endAt: Date;
  predicted: boolean;
  basedOn?: number;
};
export type ResolvedEdition = {
  info: ContestInfo;
  year: number;
  status: EditionStatus | "tba";
  predicted: boolean;
  basedOn?: number;
  title?: string;
  events: ResolvedEvent[];
  sources: ContestSource[];
  pending: PendingEvent[];
  notes: string[];
};
