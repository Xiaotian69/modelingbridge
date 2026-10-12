import { useId } from "react";
import { usePrefs } from "./PrefsContext";
import type { ThemePref } from "./prefsStore";

const themes: { value: ThemePref; label: string }[] = [
  { value: "system", label: "跟随系统" },
  { value: "light", label: "浅色" },
  { value: "dark", label: "深色" },
];

/** 学习记录 › 偏好: display settings stored only in this browser. */
export function PreferencesPanel() {
  const { prefs, update, saved } = usePrefs();
  const splashId = useId();
  return (
    <section className="prefs-panel" aria-labelledby={`${splashId}-title`}>
      <h2 id={`${splashId}-title`}>偏好</h2>
      <fieldset>
        <legend>主题</legend>
        <div className="segmented">
          {themes.map((t) => (
            <label key={t.value}>
              <input
                type="radio"
                name="theme"
                value={t.value}
                checked={prefs.theme === t.value}
                onChange={() => update({ theme: t.value })}
              />
              <span>{t.label}</span>
            </label>
          ))}
        </div>
        <p className="prefs-note">
          深色主题已用于首页、线性规划精讲与专项练习；其余页面在后续批次迁移前保持浅色显示。
        </p>
      </fieldset>
      <label className="switch-row" htmlFor={splashId}>
        <input
          id={splashId}
          type="checkbox"
          role="switch"
          checked={prefs.splash}
          onChange={(event) => update({ splash: event.target.checked })}
        />
        <span>
          <b>开屏动画</b>
          打开或刷新首页时播放约 2 秒的粒子动画。系统开启“减少动态效果”时始终不播放。
        </span>
      </label>
      <label className="switch-row" htmlFor={`${splashId}-nudges`}>
        <input
          id={`${splashId}-nudges`}
          type="checkbox"
          role="switch"
          checked={prefs.nudges}
          onChange={(event) => update({ nudges: event.target.checked })}
        />
        <span>
          <b>帮助建议</b>
          同一道题连续答错时，在反馈下方出现一次“卡住了？”提示。关闭后不再出现，帮助按钮仍然可用。
        </span>
      </label>
      {!saved && (
        <p role="alert" className="prefs-warning">
          此浏览器不允许本地保存，偏好只在本次访问中生效。
        </p>
      )}
    </section>
  );
}
