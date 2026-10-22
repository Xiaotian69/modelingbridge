/**
 * 匿名事件：进入、开始、完成、点群号、点课程、展开协会介绍。不带任何个人信息，只带扫码渠道和结果类型。
 * provider = "none" 时不发网络请求，只派发一个页面内事件（方便测试和以后接入）。
 */
import { analytics, SOURCES } from "./config";

export type ChallengeEvent = "challenge_enter" | "challenge_start" | "challenge_complete" | "challenge_copy_group" | "challenge_course_click" | "challenge_society_open";

type Umami = { track: (name: string, data?: Record<string, string>) => void };

export function sourceFrom(search: string) {
  const src = new URLSearchParams(search).get("src") ?? "";
  return (SOURCES as readonly string[]).includes(src) ? src : "direct";
}

let loaded = false;
/** 只在配置了统计服务时才加载它的脚本。 */
export function loadAnalytics() {
  if (loaded || analytics.provider !== "umami" || !analytics.scriptSrc || !analytics.websiteId) return;
  loaded = true;
  const script = document.createElement("script");
  script.defer = true;
  script.src = analytics.scriptSrc;
  script.dataset.websiteId = analytics.websiteId;
  script.dataset.autoTrack = "true";
  document.head.appendChild(script);
}

export function track(name: ChallengeEvent, data: Record<string, string> = {}) {
  try {
    window.dispatchEvent(new CustomEvent("mb:challenge", { detail: { name, ...data } }));
    if (analytics.provider === "umami") (window as unknown as { umami?: Umami }).umami?.track(name, data);
  } catch {
    /* 统计失败绝不影响游戏 */
  }
}
