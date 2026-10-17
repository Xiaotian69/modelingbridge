import { contestCatalog } from "./catalog";
import { editions2025 } from "./editions/2025";
import { editions2026 } from "./editions/2026";
import { editions2027 } from "./editions/2027";
import type { ContestEdition, ContestEvent, EventKind, ResolvedEdition, ResolvedEvent, TzOffset } from "./types";

export * from "./types";
export { contestCatalog, findContest, CONTEST_CATEGORIES } from "./catalog";

/** 新增年份：写好 editions/YYYY.ts 后加到这里。 */
export const ALL_EDITIONS: ContestEdition[] = [...editions2025, ...editions2026, ...editions2027];
export const CALENDAR_YEARS = [2025, 2026, 2027];

const BJ: TzOffset = "+08:00";
const DAY = 86_400_000;
const NY: TzOffset = "America/New_York";
const pad = (n: number) => String(n).padStart(2, "0");

/** 某年某月第 n 个星期日是几号。 */
function nthSunday(y: number, month: number, n: number) {
  const first = new Date(Date.UTC(y, month - 1, 1)).getUTCDay();
  return 1 + ((7 - first) % 7) + (n - 1) * 7;
}

/**
 * 美国东部时间相对 UTC 的分钟数：3 月第二个星期日 2:00 至 11 月第一个星期日 2:00 为 EDT（-240），
 * 其余为 EST（-300）。参数是当地钟面时间。
 */
export function usEasternOffset(y: number, m: number, d: number, h = 0, min = 0) {
  const local = Date.UTC(y, m - 1, d, h, min);
  const dstStart = Date.UTC(y, 2, nthSunday(y, 3, 2), 2);
  const dstEnd = Date.UTC(y, 10, nthSunday(y, 11, 1), 2);
  return local >= dstStart && local < dstEnd ? -240 : -300;
}

/** 当地钟面时间（以 UTC 毫秒表示）→ 相对 UTC 的分钟数。 */
function offsetAt(tz: TzOffset, localMs: number) {
  if (tz === NY) {
    const d = new Date(localMs);
    return usEasternOffset(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes());
  }
  return 480;
}

/** 把官方原文的当地时间解析成绝对时间。见 types.ts 中的写法约定。 */
export function parseLocal(raw: string, tz: TzOffset = BJ, edge: "start" | "end" = "start"): Date {
  const m = raw.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?(?:T(\d{2}):(\d{2}))?$/);
  if (!m) throw new Error(`bad contest date: ${raw}`);
  const [, y, mo, d, h, mi] = m;
  let ms: number;
  if (!d) ms = edge === "start" ? Date.UTC(+y, +mo - 1, 1) : Date.UTC(+y, +mo, 1);
  else if (h === undefined) ms = Date.UTC(+y, +mo - 1, +d) + (edge === "end" ? DAY : 0);
  else ms = Date.UTC(+y, +mo - 1, +d, +h, +mi);
  return new Date(ms - offsetAt(tz, ms) * 60_000);
}

const precision = (raw: string) => (/T/.test(raw) ? "minute" : raw.length === 7 ? "month" : "day");

/** 北京时间的年月日时分。 */
export function bjParts(date: Date) {
  const d = new Date(date.getTime() + 8 * 3_600_000);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), min: d.getUTCMinutes() };
}

/** 原文写法 → 展示文字（不换算）。 */
function rawText(raw: string, edge: "start" | "end", withYear: boolean) {
  const m = raw.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?(?:T(\d{2}:\d{2}))?$/)!;
  const [, y, mo, d, hm] = m;
  const ys = withYear ? `${y} 年 ` : "";
  if (!d) return `${ys}${+mo} 月${edge === "start" ? "起" : "底"}`;
  return `${ys}${+mo} 月 ${+d} 日${hm ? ` ${hm}` : ""}`;
}

function bjText(date: Date, raw: string, edge: "start" | "end", withYear: boolean) {
  if (precision(raw) !== "minute") return rawText(raw, edge, withYear);
  const p = bjParts(date);
  return `${withYear ? `${p.y} 年 ` : ""}${p.m} 月 ${p.d} 日 ${pad(p.h)}:${pad(p.min)}`;
}

/** 官方时区名称，美东按当天是否夏令时显示 EST / EDT。 */
function tzName(tz: TzOffset, raw: string) {
  if (tz !== NY) return "北京时间";
  const [y, m, d] = raw.slice(0, 10).split("-").map(Number);
  return usEasternOffset(y, m, d || 1, 12) === -240 ? "美东夏令时（EDT）" : "美东时间（EST）";
}

/** 一个事件的时间描述：北京时间为主；官方时区不同时附原文时间。 */
export function describeEvent(ev: ResolvedEvent, editionYear: number) {
  const tz = ev.tz ?? BJ;
  const crossYear = (d: Date) => bjParts(d).y !== editionYear;
  const endText = bjText(ev.endAt, ev.end, "end", crossYear(ev.endAt));
  const startText = ev.start && ev.startAt ? bjText(ev.startAt, ev.start, "start", crossYear(ev.startAt)) : null;
  const range = startText ? `${startText} – ${endText}` : ev.kind === "registration" ? `截止 ${endText}` : endText;
  // 推算出来的时间一律带“约”，避免看起来像官方安排
  const beijing = !ev.predicted ? range : range.startsWith("截止 ") ? `截止 约 ${range.slice(3)}` : `约 ${range}`;
  let official: string | null = null;
  if (tz !== BJ) {
    const e = rawText(ev.end, "end", false);
    official = `${tzName(tz, ev.start ?? ev.end)} ${ev.start ? `${rawText(ev.start, "start", false)} – ${e}` : e}`;
  }
  return { beijing, official };
}

export const KIND_LABEL: Record<EventKind, string> = {
  registration: "报名",
  contest: "比赛",
  stage: "阶段",
  submission: "提交截止",
  results: "成绩公布",
};
export const eventLabel = (ev: ContestEvent) => ev.label ?? KIND_LABEL[ev.kind];

function resolveEvent(ev: ContestEvent, predicted: boolean, basedOn?: number): ResolvedEvent {
  const tz = ev.tz ?? BJ;
  return { ...ev, startAt: ev.start ? parseLocal(ev.start, tz, "start") : undefined, endAt: parseLocal(ev.end, tz, "end"), predicted, basedOn };
}

const isLeap = (y: number) => y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);

/**
 * 推算偏移天数。以本届比赛（或第一个事件）的开始日为锚点，换到目标年份：
 * - weekday：先取目标年的同月同日，再移到最近的同一个星期几（前后最多 3 天），
 *   例如 2026-09-10（周四）→ 2027-09-09（周四）；
 * - date：保持同月同日（固定在节假日的赛事）。
 * 2 月 29 日落到平年时取 2 月 28 日。
 */
export function predictionShiftDays(anchorRaw: string, targetYear: number, anchor: "weekday" | "date" = "weekday") {
  const [y, m, d0] = anchorRaw.slice(0, 10).split("-").map(Number);
  const d = d0 || 1;
  const base = Date.UTC(y, m - 1, d);
  const target = Date.UTC(targetYear, m - 1, m === 2 && d === 29 && !isLeap(targetYear) ? 28 : d);
  let shift = Math.round((target - base) / DAY);
  if (anchor === "weekday") {
    const diff = (new Date(base).getUTCDay() - new Date(target).getUTCDay() + 7) % 7; // 0–6
    shift += diff > 3 ? diff - 7 : diff;
  }
  return shift;
}

/** 把一个原文时间整体平移若干天（只写到月份的按年份平移）。 */
function shiftRaw(raw: string, days: number, years: number) {
  if (raw.length === 7) return `${Number(raw.slice(0, 4)) + years}${raw.slice(4)}`;
  const [y, m, d] = raw.slice(0, 10).split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) + days * DAY);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}${raw.slice(10)}`;
}

/** 某年的全部赛事：有官方数据用官方；没有时按最近一届举办过的官方数据推算；都没有就是“待公布”。 */
export function editionsForYear(year: number, editions = ALL_EDITIONS): ResolvedEdition[] {
  const out: ResolvedEdition[] = [];
  for (const info of contestCatalog) {
    const own = editions.find((e) => e.contestId === info.id && e.year === year);
    if (own) {
      out.push({
        info,
        year,
        status: own.status,
        predicted: false,
        title: own.title,
        events: own.events.map((ev) => resolveEvent(ev, false)),
        sources: own.sources,
        pending: own.pending ?? [],
        notes: own.notes ?? [],
      });
      continue;
    }
    const base = editions
      .filter((e) => e.contestId === info.id && e.year < year && e.status === "scheduled" && e.events.length)
      .sort((a, b) => b.year - a.year)[0];
    if (!base) {
      const earlier = editions.some((e) => e.contestId === info.id && e.year < year);
      if (earlier) out.push({ info, year, status: "tba", predicted: false, events: [], sources: [], pending: [], notes: ["尚未公布，也没有可参考的往届日期。"] });
      continue;
    }
    const years = year - base.year;
    const anchorEvent = base.events.find((e) => (e.kind === "contest" || e.kind === "stage") && e.start) ?? base.events[0];
    const anchorRaw = anchorEvent.start ?? anchorEvent.end;
    const mode = info.predictAnchor ?? "weekday";
    const days = predictionShiftDays(anchorRaw, Number(anchorRaw.slice(0, 4)) + years, mode);
    out.push({
      info,
      year,
      status: "tba",
      predicted: true,
      basedOn: base.year,
      events: base.events.map((ev) =>
        // 往届的备注（如“通知落款 2026 年……”）不适用于推算的届次，不带过来
        resolveEvent({ ...ev, note: undefined, start: ev.start && shiftRaw(ev.start, days, years), end: shiftRaw(ev.end, days, years) }, true, base.year),
      ),
      sources: base.sources,
      pending: [],
      notes: [
        `${year} 年的通知尚未发布。以下日期按 ${base.year} 年官方日期推算，只用于提前规划，不是官方安排。`,
        mode === "weekday"
          ? `推算方法：比赛开始日对齐到与 ${base.year} 年相同的星期几，其余节点与比赛保持相同间隔；实际日期可能相差一周或更多。`
          : `推算方法：本赛事固定在节假日前后，保持 ${base.year} 年的月日；实际日期以通知为准。`,
      ],
    });
  }
  return out;
}

export type PhaseKey = "suspended" | "tba" | "predicted" | "registering" | "running" | "soon" | "upcoming" | "waiting" | "finished";
export type Phase = { key: PhaseKey; label: string; detail?: string };

/**
 * 剩余时间文字：不足 1 小时按分钟，不足 24 小时按“小时 + 分钟”，否则按北京时间的日历天数。
 * 页面在每个整分钟刷新，所以分钟数和状态切换都能及时更新。
 */
export function remainingText(target: Date, now: Date) {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return "0 分钟";
  const minutes = Math.ceil(ms / 60_000);
  if (minutes < 60) return `${minutes} 分钟`;
  if (ms < DAY) return `${Math.floor(minutes / 60)} 小时${minutes % 60 ? ` ${minutes % 60} 分钟` : ""}`;
  return `${daysUntil(endDay(target), now)} 天`;
}

/** 截止在 24:00（即次日 0:00）时算作当天：用于按天计数和显示日期。 */
export const endDay = (d: Date) => new Date(d.getTime() - 1);

/** 北京时间的日历天数差（今天 = 0）。 */
export function daysUntil(target: Date, now: Date) {
  const a = bjParts(now);
  const b = bjParts(target);
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / DAY);
}

export function editionPhase(ed: ResolvedEdition, now: Date): Phase {
  if (ed.status === "suspended") return { key: "suspended", label: "本年暂停" };
  if (ed.status === "cancelled") return { key: "suspended", label: "已取消" };
  if (ed.predicted) return { key: "predicted", label: `预计 · 参考 ${ed.basedOn} 年` };
  if (!ed.events.length) return { key: "tba", label: "待公布" };
  const t = now.getTime();
  const active = ed.events.find((e) => e.startAt && e.startAt.getTime() <= t && t <= e.endAt.getTime());
  // 只有截止时间的报名（原文多为“即日起至……”或由学校统一报名）：截止前都算可报名。
  const openDeadline = ed.events.find((e) => e.kind === "registration" && !e.startAt && t <= e.endAt.getTime());
  if (!active && openDeadline && !ed.events.some((e) => e !== openDeadline && e.endAt.getTime() < t))
    return { key: "registering", label: "报名截止前", detail: `截止 ${describeEvent(openDeadline, ed.year).beijing.replace(/^截止 /, "")}` };
  const flag = (e: ResolvedEvent) => (e.certainty === "unverified" ? "（日期待核实）" : "");
  if (active) {
    const until = describeEvent(active, ed.year).beijing.split(" – ").pop();
    return active.kind === "registration"
      ? { key: "registering", label: `报名中${flag(active)}`, detail: `截止 ${until}，还有 ${remainingText(active.endAt, now)}` }
      : { key: "running", label: `${eventLabel(active)}进行中${flag(active)}`, detail: `至 ${until}，还有 ${remainingText(active.endAt, now)}` };
  }
  const future = ed.events
    .map((e) => ({ e, at: e.startAt && e.startAt.getTime() > t ? e.startAt : e.endAt }))
    .filter((x) => x.at.getTime() > t)
    .sort((a, b) => a.at.getTime() - b.at.getTime());
  if (!future.length) return { key: "finished", label: "已结束" };
  const next = future[0];
  const days = daysUntil(next.at, now);
  const what = next.e.kind === "registration" && !(next.e.startAt && next.e.startAt.getTime() > t) ? "报名截止" : `${eventLabel(next.e)}${next.e.kind === "results" ? "" : "开始"}`;
  const detail = `${what}还有 ${remainingText(next.at, now)}${flag(next.e)}`;
  const contestDone = ed.events.some((e) => (e.kind === "contest" || e.kind === "stage") && e.endAt.getTime() < t);
  if (contestDone) return { key: "waiting", label: next.e.kind === "results" ? "等待成绩" : `待${eventLabel(next.e)}`, detail };
  const regClosed = ed.events.some((e) => e.kind === "registration" && e.endAt.getTime() < t);
  if (days <= 30) return { key: "soon", label: regClosed ? "报名已截止 · 即将开赛" : "即将开始", detail };
  return { key: "upcoming", label: regClosed ? "报名已截止" : "未开始", detail };
}

export type Milestone = { at: Date; contest: string; contestId: string; year: number; text: string; days: number; remaining: string };

/**
 * 跨年份的“接下来”节点：只用官方数据，不含推算。每个赛事只取最近的一个节点，
 * 避免同一赛事的报名、开赛、提交挤满列表，把其他赛事挤出去。
 */
export function upcomingMilestones(now: Date, limit = 5, editions = ALL_EDITIONS): Milestone[] {
  const t = now.getTime();
  const out: Milestone[] = [];
  for (const year of CALENDAR_YEARS) {
    for (const ed of editionsForYear(year, editions)) {
      if (ed.predicted || ed.status !== "scheduled") continue;
      for (const ev of ed.events) {
        if (ev.certainty !== "official") continue;
        const label = eventLabel(ev);
        const base = { contest: ed.info.short, contestId: ed.info.id, year, days: 0, remaining: "" };
        if (ev.startAt && ev.startAt.getTime() > t && ev.kind !== "submission") out.push({ ...base, at: ev.startAt, text: `${label}开始` });
        if (ev.endAt.getTime() > t && (ev.kind === "registration" || ev.kind === "submission" || ev.kind === "results"))
          out.push({ ...base, at: ev.endAt, text: ev.kind === "registration" ? (label.endsWith("截止") ? label : `${label}截止`) : label });
        // 正在进行的比赛 / 阶段：显示距结束还有多久
        if ((ev.kind === "contest" || ev.kind === "stage") && ev.startAt && ev.startAt.getTime() <= t && ev.endAt.getTime() > t)
          out.push({ ...base, at: ev.endAt, text: `${label}结束` });
      }
    }
  }
  const seen = new Set<string>();
  return out
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .filter((m) => !seen.has(m.contestId) && !!seen.add(m.contestId))
    .slice(0, limit)
    .map((m) => ({ ...m, days: daysUntil(endDay(m.at), now), remaining: remainingText(m.at, now) }));
}

/** 节点的北京时间：整点 0:00（含 24:00 截止）只写日期，否则带上时刻，例如“10 月 23 日 12:00”。 */
export function milestoneWhen(at: Date) {
  const p = bjParts(at);
  if (p.h === 0 && p.min === 0) {
    const d = bjParts(endDay(at));
    return `${d.m} 月 ${d.d} 日`;
  }
  return `${p.m} 月 ${p.d} 日 ${pad(p.h)}:${pad(p.min)}`;
}

/** 在年度时间轴上的位置（0–1，按北京时间）。 */
export function yearFraction(date: Date, year: number) {
  const start = Date.UTC(year, 0, 1) - 8 * 3_600_000;
  const end = Date.UTC(year + 1, 0, 1) - 8 * 3_600_000;
  return (date.getTime() - start) / (end - start);
}

const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
const icsTime = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** 生成 .ics：只包含官方已确认的节点（推算和待核实的不进日历）。 */
export function buildIcs(ed: ResolvedEdition, now = new Date()) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ModelingBridge//Contest Calendar//ZH", "CALSCALE:GREGORIAN"];
  ed.events.forEach((ev, i) => {
    if (ev.predicted || ev.certainty !== "official") return;
    const start = ev.startAt ?? new Date(ev.endAt.getTime() - 3_600_000);
    const what = ev.startAt ? eventLabel(ev) : `${eventLabel(ev)}${ev.kind === "registration" ? "截止" : ""}`;
    const desc = [ev.note, `来源：${ed.sources.map((s) => `${s.title} ${s.url}`).join("；")}`, `核验日期：${ed.sources[0]?.checkedAt ?? ""}`, "以主办方最新通知为准。"]
      .filter(Boolean)
      .join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${ed.info.id}-${ed.year}-${ev.kind}-${i}@modelingbridge.cc`,
      `DTSTAMP:${icsTime(now)}`,
      `DTSTART:${icsTime(start)}`,
      `DTEND:${icsTime(ev.endAt)}`,
      `SUMMARY:${icsEscape(`${ed.info.short} ${ed.year}：${what}`)}`,
      `DESCRIPTION:${icsEscape(desc)}`,
      ...(ed.sources[0] ? [`URL:${ed.sources[0].url}`] : []),
      "END:VEVENT",
    );
  });
  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

export const findEdition = (contestId: string, year: number) => editionsForYear(year).find((e) => e.info.id === contestId);
