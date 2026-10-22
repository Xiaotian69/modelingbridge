import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { event } from "../../challenge/event";
import { copyWithFallback, selectText } from "../../utils/clipboard";

/** 首页招新公告进入小游戏时带的渠道值（在 challenge/event.ts 的 SOURCES 白名单里）。 */
export const NOTICE_SOURCE = "site";

/**
 * 首页顶部的招新公告：协会名、QQ 招新群号（可复制）和 3 分钟小游戏入口。
 * 内容全部来自小游戏共用的 event 配置；event.active 为 false 时整条不显示。
 */
export function RecruitNotice() {
  const [copied, setCopied] = useState<"" | "ok" | "fail">("");
  const number = useRef<HTMLElement>(null);
  if (!event.active) return null;

  const copy = async () => {
    const ok = await copyWithFallback(event.qqGroup);
    setCopied(ok ? "ok" : "fail");
    if (!ok) selectText(number.current);
  };

  return (
    <section className="site-container recruit-notice" aria-labelledby="recruit-title">
      <div className="recruit-head">
        <span className="recruit-tag">招新中</span>
        <h2 id="recruit-title">{event.societyName}正在招新</h2>
        <p className="recruit-note">{event.joinNote}</p>
      </div>
      <div className="recruit-group">
        <span className="recruit-label">{event.groupName}</span>
        <strong ref={number} className="recruit-qq" aria-label={`${event.groupName}群号 ${event.qqGroup.split("").join(" ")}`}>
          {event.qqGroup}
        </strong>
        <button type="button" className="recruit-copy" onClick={copy}>
          复制群号
        </button>
        {copied === "ok" && (
          <p className="recruit-status" role="status">
            已复制群号，打开 QQ 搜索即可加群。
          </p>
        )}
        {copied === "fail" && (
          <p className="recruit-status is-fail" role="status">
            没能自动复制，已帮你选中群号：长按或按 Ctrl+C 手动复制。
          </p>
        )}
      </div>
      <Link className="recruit-game" to={`/challenge?src=${NOTICE_SOURCE}`}>
        <span>趣味小游戏 · 约 3 分钟</span>
        <b>测测你是建模队里的哪种人 →</b>
      </Link>
    </section>
  );
}
