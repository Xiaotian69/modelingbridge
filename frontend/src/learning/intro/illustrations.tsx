/**
 * Scene illustrations of 第零课 (prompts and spec: docs/design/intro-illustrations.md).
 * Drop `intro-0X-name.webp` (or .png / .jpg) into ./img and it appears in its slot; a slot whose file
 * is missing renders nothing, so the lesson never shows a broken image or a placeholder.
 * Illustrations only set the scene: no numbers or text, every number on the page comes from code.
 */
const FILES = import.meta.glob("./img/*.{webp,png,jpg}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

export type IllustrationId =
  | "intro-01-rain-umbrellas"
  | "intro-02-walk-to-class"
  | "intro-03-map-vs-metro"
  | "intro-04-morning-rush"
  | "intro-05-team-table"
  | "intro-06-three-paths";

export const ILLUSTRATIONS: Record<IllustrationId, { alt: string; caption?: string }> = {
  "intro-01-rain-umbrellas": {
    alt: "下雨的校园：教学楼门口的伞架几乎空了，几名学生在屋檐下等；远处宿舍区的伞架却挂满了伞。",
  },
  "intro-02-walk-to-class": {
    alt: "从宿舍到教学楼的一条路：路口有红绿灯，有人背着重书包边走边看手机，半边天空飘着小雨。",
    caption: "同一段路，题目没说的条件很多。",
  },
  "intro-03-map-vs-metro": {
    alt: "左边是街道弯曲、房屋密集的真实城区俯视图，右边是同一片区域简化成的几条直线和站点的线路图。",
    caption: "线路图丢掉了与乘车无关的细节，所以才好用。",
  },
  "intro-04-morning-rush": {
    alt: "清晨，一名学生快步走向教学楼，手机上是计时的圆环，旁边浮着几天记录的长短条，其中一条带着小雨云。",
  },
  "intro-05-team-table": {
    alt: "三名学生围着一张桌子：一人在白板上画示意图，一人用笔记本电脑看图表，一人在平板上写文档，彼此指着对方的工作交流。",
  },
  "intro-06-three-paths": {
    alt: "草坪上的岔路口：一名学生站在三条小路的起点，分别通向齿轮工坊、画着上升曲线的观测台和放着天平的花园。",
  },
};

/** The URL of an illustration among the files found, or null when it has not been added yet. */
export function illustrationSrc(id: IllustrationId, files: Record<string, string> = FILES): string | null {
  const hit = Object.keys(files)
    .sort()
    .find((path) => path.slice(path.lastIndexOf("/") + 1).replace(/\.(webp|png|jpg)$/, "") === id);
  return hit ? files[hit] : null;
}

export function IntroFigure({ id, files }: { id: IllustrationId; files?: Record<string, string> }) {
  const src = illustrationSrc(id, files);
  if (!src) return null;
  const { alt, caption } = ILLUSTRATIONS[id];
  return (
    <figure className="intro-figure">
      <img src={src} alt={alt} width={1600} height={900} loading="lazy" decoding="async" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
