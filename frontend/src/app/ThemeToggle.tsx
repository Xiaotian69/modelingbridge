import { Icon } from "../components/ui/Icon";
import { usePrefs } from "./PrefsContext";
import { nextTheme, type ThemePref } from "./prefsStore";

const labels: Record<ThemePref, string> = { system: "跟随系统", light: "浅色", dark: "深色" };
const icons = { system: "contrast", light: "sun", dark: "moon" } as const;

/** Cycles 跟随系统 → 浅色 → 深色. */
export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { prefs, update } = usePrefs();
  const next = nextTheme(prefs.theme);
  return (
    <button
      type="button"
      className="icon-button theme-toggle"
      onClick={() => update({ theme: next })}
      aria-label={`主题：${labels[prefs.theme]}。点击切换为${labels[next]}`}
      title={`主题：${labels[prefs.theme]}`}
    >
      <Icon name={icons[prefs.theme]} size={18} />
      {showLabel && <span>主题：{labels[prefs.theme]}</span>}
    </button>
  );
}
