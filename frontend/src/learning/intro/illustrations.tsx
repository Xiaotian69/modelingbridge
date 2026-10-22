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
    alt: "下雨的校园：左边教学楼的雨棚下站着两名学生，伞架里只剩一把伞；右边宿舍区的伞架里放着好几把伞，两边之间是雨。",
  },
  "intro-02-walk-to-class": {
    alt: "从宿舍到教学楼的一条弯路：一名学生背着书包边走边看手机，另一名学生快步走着，前方路口有红绿灯和斑马线，宿舍上空飘着小雨。",
    caption: "同一段路，题目没说的条件很多。",
  },
  "intro-03-map-vs-metro": {
    alt: "左边是弯曲的河流、道路和几栋房子，一个箭头指向右边：同一片区域被简化成几条横平竖直的线路、站点和两个换乘站。",
    caption: "线路图丢掉了与乘车无关的细节，所以才好用。",
  },
  "intro-04-morning-rush": {
    alt: "一名背书包的学生边走边看手机，手机旁是几条长短不一的竖条，头顶有一朵小雨云，前方是教学楼。",
  },
  "intro-05-team-table": {
    caption: "分工各有侧重，但工作连在一起。",
    alt: "两名学生坐在桌旁，一人看着显示柱状图的笔记本电脑，一人拿着平板；第三人站在白板前，指着两个圆和一个箭头的示意图；一条虚线把电脑和白板连在一起。",
  },
  "intro-06-three-paths": {
    caption: "从左到右：优化、预测、评价。",
    alt: "一名背书包的学生站在三岔路口：左边的路通向带齿轮的工坊，中间通向圆顶观测台，右边通向一架天平。",
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
