import { useEffect, useState } from "react";

/** 下一次整分钟的毫秒数（多等 50 ms，确保跨过分钟边界）。 */
export const msToNextMinute = (now = Date.now()) => 60_000 - (now % 60_000) + 50;

/**
 * 当前时间，供倒计时和赛事状态使用。
 * - 每到整分钟更新一次：赛事时间都精确到分钟，所以截止、开赛、结束会在对应的那一分钟切换；
 * - 标签页隐藏时暂停计时（浏览器本来也会限流后台定时器），重新可见、窗口获得焦点
 *   或页面从往返缓存恢复时立即校正，再重新对齐整分钟；
 * - 任何时刻最多只有一个定时器，卸载时清除定时器和全部监听。
 */
export function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: number | undefined;
    const stop = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = undefined;
    };
    const schedule = () => {
      stop();
      timer = window.setTimeout(() => {
        setNow(new Date());
        schedule();
      }, msToNextMinute());
    };
    const sync = () => {
      if (document.visibilityState === "hidden") {
        stop();
        return;
      }
      setNow(new Date());
      schedule();
    };
    schedule();
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("pageshow", sync);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("pageshow", sync);
    };
  }, []);
  return now;
}
