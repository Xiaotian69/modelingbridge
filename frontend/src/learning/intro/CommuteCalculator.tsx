import { useId, useState } from "react";
import { CLASS_MINUTE, COMMUTE_DAYS, DEPART_RANGE, RAIN_DAYS } from "./data";
import { clock, commuteCheck, latestSafeDeparture, mean } from "./math";

const AVERAGE_DEPART = CLASS_MINUTE - mean(COMMUTE_DAYS);
const SAFE_DEPART = latestSafeDeparture(COMMUTE_DAYS, CLASS_MINUTE);
/** Time axis of the bars: from the earliest departure to a few minutes after class starts. */
const AXIS = { from: DEPART_RANGE.min, to: CLASS_MINUTE + 8 };
const pct = (minute: number) => `${((minute - AXIS.from) / (AXIS.to - AXIS.from)) * 100}%`;

/** §3: pick a departure time and see, day by day, whether the 10 recorded walks arrive by 8:00. */
export function CommuteCalculator() {
  const id = useId();
  const [depart, setDepart] = useState(AVERAGE_DEPART);
  const { onTime, late } = commuteCheck(COMMUTE_DAYS, depart, CLASS_MINUTE);

  return (
    <figure className="lp-lab intro-commute" aria-labelledby={`${id}-title`}>
      <figcaption>
        <span className="eyebrow">动手算 / 出门时刻</span>
        <h3 id={`${id}-title`}>用两周的记录，检验一个出门时刻</h3>
      </figcaption>
      <label className="intro-range">
        <span>
          出门时刻 <output>{clock(depart)}</output>
        </span>
        <input
          type="range"
          min={DEPART_RANGE.min}
          max={DEPART_RANGE.max}
          step={1}
          value={depart}
          aria-valuetext={`${clock(depart)} 出门`}
          onChange={(e) => setDepart(Number(e.target.value))}
        />
      </label>
      <div className="segmented-buttons intro-presets" role="group" aria-label="常用出门时刻">
        <button type="button" aria-pressed={depart === AVERAGE_DEPART} onClick={() => setDepart(AVERAGE_DEPART)}>
          按平均用时（{clock(AVERAGE_DEPART)}）
        </button>
        <button type="button" aria-pressed={depart === SAFE_DEPART} onClick={() => setDepart(SAFE_DEPART)}>
          按最长用时（{clock(SAFE_DEPART)}）
        </button>
      </div>
      <p className="intro-result" role="status">
        {clock(depart)} 出门：记录的 {COMMUTE_DAYS.length} 天里 <b>{onTime} 天准时</b>
        {late.length ? `，${late.length} 天迟到（第 ${late.join("、")} 天）` : "，没有一天迟到"}。
      </p>
      <ol className="intro-days" aria-label="每天的到达时刻">
        {COMMUTE_DAYS.map((t, i) => {
          const arrive = depart + t;
          const isLate = arrive > CLASS_MINUTE;
          const rain = RAIN_DAYS.includes(i + 1);
          return (
            <li key={i} className={isLate ? "is-late" : "is-ok"}>
              <span className="intro-day-label">
                第 {i + 1} 天{rain && <span className="intro-rain">雨</span>}
              </span>
              <span className="intro-day-track" aria-hidden="true">
                <i style={{ left: pct(depart), width: pct(AXIS.from + t) }} />
                <span className="intro-deadline" style={{ left: pct(CLASS_MINUTE) }} />
              </span>
              <span className="intro-day-status">
                {t} 分钟 · {clock(arrive)} 到{isLate ? ` · 迟到 ${arrive - CLASS_MINUTE} 分钟` : " · 准时"}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="muted-note">竖线是 8:00 上课。用时是教学设定的数据，第 {RAIN_DAYS.join("、")} 天下雨。</p>
    </figure>
  );
}
