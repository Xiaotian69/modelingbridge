import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CALENDAR_YEARS,
  CONTEST_CATEGORIES,
  KIND_LABEL,
  bjParts,
  buildIcs,
  describeEvent,
  editionPhase,
  editionsForYear,
  eventLabel,
  upcomingMilestones,
  yearFraction,
  type Phase,
  type ResolvedEdition,
  type ResolvedEvent,
} from "../content/contests";
import "./library/calendar.css";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const SOURCE_TYPE = { organizer: "主办方", platform: "官方报名平台", repost: "转载（注明原发布方）" } as const;
type View = "timeline" | "list";

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

function firstAt(ed: ResolvedEdition) {
  const contest = ed.events.find((e) => e.kind === "contest" || e.kind === "stage");
  const e = contest ?? ed.events[0];
  return e ? (e.startAt ?? e.endAt).getTime() : Number.POSITIVE_INFINITY;
}

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const certaintyText = (ev: ResolvedEvent) =>
  ev.predicted ? `预计（参考 ${ev.basedOn} 年）` : ev.certainty === "official" ? "官方已公布" : "待核实";

function PhaseChip({ phase }: { phase: Phase }) {
  return <span className={`cal-phase is-${phase.key}`}>{phase.label}</span>;
}

/** 资料 › 赛事日历：全年时间轴（桌面）/ 按月议程（手机），报名与比赛分开，官方与预计分开。 */
export function CalendarPage() {
  const now = useNow();
  const thisYear = bjParts(now).y;
  const [params, setParams] = useSearchParams();
  const requestedYear = Number(params.get("year"));
  const year = CALENDAR_YEARS.includes(requestedYear) ? requestedYear : CALENDAR_YEARS.includes(thisYear) ? thisYear : CALENDAR_YEARS[CALENDAR_YEARS.length - 1];
  const [category, setCategory] = useState<string>("全部");
  const [hideFinished, setHideFinished] = useState(false);
  const [view, setView] = useState<View>(() => (typeof window !== "undefined" && window.matchMedia?.("(max-width: 899px)").matches ? "list" : "timeline"));
  const selectedId = params.get("c");

  const all = useMemo(() => editionsForYear(year), [year]);
  const withPhase = useMemo(() => all.map((ed) => ({ ed, phase: editionPhase(ed, now) })).sort((a, b) => firstAt(a.ed) - firstAt(b.ed)), [all, now]);
  const visible = withPhase.filter(({ ed, phase }) => (category === "全部" || ed.info.category === category) && !(hideFinished && phase.key === "finished"));
  const milestones = useMemo(() => upcomingMilestones(now, 5), [now]);
  const selected = selectedId ? withPhase.find((x) => x.ed.info.id === selectedId) : undefined;
  const missing = editionsForYear(Math.max(...CALENDAR_YEARS)).length - all.length;

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v === null) next.delete(k);
    else next.set(k, v);
    setParams(next, { replace: k !== "c" });
  };

  return (
    <div className="site-container library-page calendar-page">
      <div className="library-intro">
        <h1>赛事日历</h1>
        <p className="page-lead">
          全年主要数学建模赛事的报名、比赛和成绩时间。时间统一显示为北京时间，官方用其他时区时同时标出原文时间。数据来自主办方通知或官方报名平台，每条都附来源和核验日期；尚未公布的年份按往年日期推算，并明确标为“预计”。
        </p>
      </div>

      <section className="cal-next" aria-label="接下来">
        <h2>接下来</h2>
        {milestones.length ? (
          <ol>
            {milestones.map((m) => (
              <li key={`${m.contestId}-${m.year}-${m.text}-${m.at.getTime()}`}>
                <button type="button" onClick={() => setParams(new URLSearchParams({ ...Object.fromEntries(params), year: String(m.year), c: m.contestId }))}>
                  <span className="cal-next-days">{m.days <= 0 ? "今天" : `${m.days} 天后`}</span>
                  <strong>{m.contest}</strong>
                  <span>{m.text}</span>
                  <span className="cal-next-date">{bjParts(m.at).m} 月 {bjParts(m.at).d} 日</span>
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted-note">暂无已公布的后续节点。</p>
        )}
        <p className="muted-note">只列官方已公布的节点；学校和赛区的校内截止通常更早。</p>
      </section>

      <div className="cal-toolbar">
        <div className="segmented" role="radiogroup" aria-label="年份">
          {CALENDAR_YEARS.map((y) => (
            <label key={y}>
              <input type="radio" name="cal-year" checked={y === year} onChange={() => setParam("year", String(y))} />
              <span>{y}{y < thisYear ? " · 历史" : y > thisYear ? " · 预计为主" : ""}</span>
            </label>
          ))}
        </div>
        <div className="segmented" role="radiogroup" aria-label="视图">
          {([["timeline", "时间轴"], ["list", "按月列表"]] as const).map(([v, label]) => (
            <label key={v}>
              <input type="radio" name="cal-view" checked={view === v} onChange={() => setView(v)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <label className="cal-select">
          <span>类别</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {["全部", ...CONTEST_CATEGORIES].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="cal-check">
          <input type="checkbox" checked={hideFinished} onChange={(e) => setHideFinished(e.target.checked)} />
          <span>隐藏已结束</span>
        </label>
      </div>

      <ul className="cal-legend" aria-label="图例">
        <li><i className="lg-reg" />报名</li>
        <li><i className="lg-contest" />比赛 / 阶段</li>
        <li><i className="lg-point" />截止 / 成绩公布</li>
        <li><i className="lg-predicted" />预计（往年推算）</li>
        <li><i className="lg-unverified" />待核实</li>
      </ul>

      {year < thisYear && missing > 0 && <p className="notice">{year} 年只收录了已从主办方原文核对过的赛事，另有 {missing} 项赛事未收录。</p>}
      {year > thisYear && <p className="notice notice-warn">{year} 年大多数赛事尚未发布通知。斜纹条按最近一届官方日期推算，只用于提前规划，不是官方安排。</p>}

      {visible.length === 0 ? (
        <div className="empty-state"><p>没有符合筛选条件的赛事。</p></div>
      ) : view === "timeline" ? (
        <Timeline rows={visible} year={year} now={now} thisYear={thisYear} onOpen={(id) => setParam("c", id)} />
      ) : (
        <AgendaList rows={visible} year={year} onOpen={(id) => setParam("c", id)} />
      )}

      {selected && <DetailPanel ed={selected.ed} phase={selected.phase} onClose={() => setParam("c", null)} />}
    </div>
  );
}

function Timeline({ rows, year, now, thisYear, onOpen }: { rows: { ed: ResolvedEdition; phase: Phase }[]; year: number; now: Date; thisYear: number; onOpen: (id: string) => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const todayPos = year === thisYear ? yearFraction(now, year) : null;
  const currentMonth = year === thisYear ? bjParts(now).m : null;
  useEffect(() => {
    const el = scroller.current;
    if (!el || todayPos === null || el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft = Math.max(0, todayPos * el.scrollWidth - el.clientWidth / 2);
  }, [todayPos, year]);
  return (
    <div className="cal-timeline" ref={scroller}>
      <div className="cal-grid" role="table" aria-label={`${year} 年赛事时间轴`}>
        <div className="cal-row cal-head" role="row">
          <div className="cal-name" role="columnheader">赛事</div>
          <div className="cal-track cal-months" role="columnheader">
            {MONTHS.map((m) => (
              <span key={m} className={m === currentMonth ? "is-current" : undefined} aria-current={m === currentMonth ? "date" : undefined}>{m} 月</span>
            ))}
          </div>
        </div>
        {rows.map(({ ed, phase }) => (
          <div className="cal-row" role="row" key={ed.info.id}>
            <div className="cal-name" role="rowheader">
              <button type="button" onClick={() => onOpen(ed.info.id)}>
                <strong>{ed.info.short}</strong>
                <PhaseChip phase={phase} />
              </button>
            </div>
            <div className="cal-track" role="cell">
              {MONTHS.map((m) => <span key={m} className={`cal-col${m === currentMonth ? " is-current" : ""}`} aria-hidden="true" />)}
              {todayPos !== null && <span className="cal-today" style={{ left: `${todayPos * 100}%` }} aria-hidden="true" />}
              {ed.events.map((ev, i) => {
                // 紧接着还有比赛阶段时（如初赛后的复赛），把日期标签放到条形左侧，避免重叠
                const crowded = ed.events.some((o) => o !== ev && (o.kind === "contest" || o.kind === "stage") && o.startAt && o.startAt > ev.endAt && yearFraction(o.startAt, year) - yearFraction(ev.endAt, year) < 0.12);
                return <Bar key={i} ev={ev} ed={ed} year={year} labelLeft={crowded} onOpen={() => onOpen(ed.info.id)} />;
              })}
              {!ed.events.length && <span className="cal-empty">{phase.label}</span>}
            </div>
          </div>
        ))}
      </div>
      {todayPos !== null && <p className="muted-note cal-today-note">竖线为今天（北京时间 {bjParts(now).m} 月 {bjParts(now).d} 日）</p>}
    </div>
  );
}

function Bar({ ev, ed, year, labelLeft = false, onOpen }: { ev: ResolvedEvent; ed: ResolvedEdition; year: number; labelLeft?: boolean; onOpen: () => void }) {
  const from = ev.startAt ? yearFraction(ev.startAt, year) : null;
  const to = yearFraction(ev.endAt, year);
  if (to < 0 || (from ?? to) > 1) return null;
  const desc = describeEvent(ev, year);
  const label = `${ed.info.short} ${eventLabel(ev)}：${desc.beijing}（${certaintyText(ev)}）`;
  const cls = [`cal-bar`, `k-${ev.kind}`, ev.predicted ? "is-predicted" : "", ev.certainty === "unverified" ? "is-unverified" : ""].join(" ");
  if (from === null || ev.kind === "results") {
    return <button type="button" className={`${cls} is-point`} style={{ left: `${Math.min(Math.max(to, 0), 1) * 100}%` }} title={label} aria-label={label} onClick={onOpen} />;
  }
  const left = Math.max(from, 0);
  const right = Math.min(to, 1);
  const s = bjParts(ev.startAt!);
  // 结束于 0 点（如“24 时”）时按前一天显示
  const e = bjParts(new Date(ev.endAt.getTime() - 1));
  const short = `${ev.predicted ? "约 " : ""}${s.m}/${s.d}–${e.m === s.m ? e.d : `${e.m}/${e.d}`}`;
  const showLabel = ev.kind === "contest" || ev.kind === "stage";
  const labelStyle = labelLeft || right > 0.86 ? { right: `calc(${(1 - left) * 100}% + 6px)` } : { left: `calc(${right * 100}% + 6px)` };
  return (
    <>
    {showLabel && <span className={`cal-bar-label k-${ev.kind}`} style={labelStyle} aria-hidden="true">{short}</span>}
    <button
      type="button"
      className={`${cls}${from < 0 ? " clip-left" : ""}${to > 1 ? " clip-right" : ""}`}
      style={{ left: `${left * 100}%`, width: `max(4px, ${(right - left) * 100}%)` }}
      title={label}
      aria-label={label}
      onClick={onOpen}
    />
    </>
  );
}

function AgendaList({ rows, year, onOpen }: { rows: { ed: ResolvedEdition; phase: Phase }[]; year: number; onOpen: (id: string) => void }) {
  const byMonth = new Map<number, { at: number; ed: ResolvedEdition; ev: ResolvedEvent; phase: Phase }[]>();
  const undated: { ed: ResolvedEdition; phase: Phase }[] = [];
  for (const { ed, phase } of rows) {
    if (!ed.events.length) undated.push({ ed, phase });
    for (const ev of ed.events) {
      const at = ev.startAt ?? ev.endAt;
      const p = bjParts(at);
      const key = p.y < year ? 0 : p.y > year ? 13 : p.m;
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key)!.push({ at: at.getTime(), ed, ev, phase });
    }
  }
  const keys = [...byMonth.keys()].sort((a, b) => a - b);
  return (
    <div className="cal-agenda">
      {keys.map((k) => (
        <section key={k} aria-label={k === 0 ? `${year - 1} 年` : k === 13 ? `${year + 1} 年` : `${k} 月`}>
          <h3>{k === 0 ? `${year - 1} 年（跨年）` : k === 13 ? `${year + 1} 年（跨年）` : `${k} 月`}</h3>
          <ul>
            {byMonth.get(k)!.sort((a, b) => a.at - b.at).map(({ ed, ev, phase }, i) => (
              <li key={`${ed.info.id}-${i}`} className={`cal-item k-${ev.kind}${ev.predicted ? " is-predicted" : ""}${ev.certainty === "unverified" ? " is-unverified" : ""}`}>
                <button type="button" onClick={() => onOpen(ed.info.id)}>
                  <span className="cal-item-kind">{eventLabel(ev)}</span>
                  <strong>{ed.info.short}</strong>
                  <span className="cal-item-time">{describeEvent(ev, year).beijing}</span>
                  <span className="cal-item-meta">{certaintyText(ev)} · <PhaseChip phase={phase} /></span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {undated.length > 0 && (
        <section aria-label="暂无日期">
          <h3>暂无日期</h3>
          <ul>
            {undated.map(({ ed, phase }) => (
              <li key={ed.info.id} className="cal-item">
                <button type="button" onClick={() => onOpen(ed.info.id)}>
                  <strong>{ed.info.short}</strong>
                  <span className="cal-item-meta"><PhaseChip phase={phase} /></span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function DetailPanel({ ed, phase, onClose }: { ed: ResolvedEdition; phase: Phase; onClose: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, ed.info.id]);
  const exportable = !ed.predicted && ed.events.some((e) => e.certainty === "official");
  return (
    <div className="cal-detail-layer">
      <button type="button" className="cal-detail-backdrop" aria-label="关闭详情" onClick={onClose} />
      <aside className="cal-detail" role="dialog" aria-modal="true" aria-labelledby="cal-detail-title">
        <div className="cal-detail-head">
          <div>
            <p className="page-kicker">{ed.year} 年{ed.title ? ` · ${ed.title}` : ""} · {ed.info.category}</p>
            <h2 id="cal-detail-title" ref={heading} tabIndex={-1}>{ed.info.name}</h2>
            <p className="cal-detail-phase"><PhaseChip phase={phase} />{phase.detail && <span>{phase.detail}</span>}</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭">✕</button>
        </div>

        {ed.notes.map((n) => <p key={n} className={`notice${ed.predicted || ed.status !== "scheduled" ? " notice-warn" : ""}`}>{n}</p>)}

        {ed.events.length > 0 && (
          <table className="cal-detail-table">
            <thead>
              <tr><th scope="col">阶段</th><th scope="col">北京时间</th><th scope="col">状态</th></tr>
            </thead>
            <tbody>
              {ed.events.map((ev, i) => {
                const d = describeEvent(ev, ed.year);
                return (
                  <tr key={i}>
                    <th scope="row">{eventLabel(ev)}{ev.label && ev.kind !== "stage" ? <span className="muted-note">（{KIND_LABEL[ev.kind]}）</span> : null}</th>
                    <td>
                      {d.beijing}
                      {d.official && <span className="cal-detail-official">官方原文：{d.official}</span>}
                      {ev.note && <span className="cal-detail-note">{ev.note}</span>}
                    </td>
                    <td><span className={`cal-cert ${ev.predicted ? "is-predicted" : `is-${ev.certainty}`}`}>{certaintyText(ev)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div className="cal-detail-actions">
          {exportable && (
            <button type="button" className="btn btn-secondary" onClick={() => download(`${ed.info.short}-${ed.year}.ics`, buildIcs(ed), "text/calendar;charset=utf-8")}>
              添加到日历（.ics，仅官方节点）
            </button>
          )}
          {ed.info.website && <a className="btn btn-quiet" href={ed.info.website} target="_blank" rel="noreferrer">赛事官网 ↗</a>}
        </div>

        <h3>适合谁</h3>
        <p>{ed.info.fit}</p>
        <p className="badge-row">{ed.info.prepFocus.map((f) => <span key={f} className="badge">{f}</span>)}</p>

        <h3>来源{ed.predicted ? `（${ed.basedOn} 年）` : ""}</h3>
        {ed.sources.length ? (
          <ul className="cal-sources">
            {ed.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a>
                <span>{s.publisher} · {SOURCE_TYPE[s.type]} · 核验于 {s.checkedAt}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted-note">暂无来源。</p>
        )}
        <p className="muted-note">报名一般由学校或赛区统一组织，校内截止时间更早；一切以主办方和本校最新通知为准。</p>
      </aside>
    </div>
  );
}
