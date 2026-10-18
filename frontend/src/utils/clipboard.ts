/**
 * 复制文字到剪贴板。先用 Clipboard API；部分微信内置浏览器没有它或会拒绝，
 * 再退回到隐藏文本框 + execCommand("copy")。都不行时返回 false（从不抛错），由页面提示手动复制。
 */
export async function copyWithFallback(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* 继续尝试下面的退路 */
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = typeof document.execCommand === "function" && document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

/** 选中某个元素里的文字，方便复制失败后手动长按或 Ctrl+C。 */
export function selectText(el: HTMLElement | null) {
  if (!el) return;
  try {
    const range = document.createRange();
    range.selectNodeContents(el);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  } catch {
    /* ignore */
  }
}
