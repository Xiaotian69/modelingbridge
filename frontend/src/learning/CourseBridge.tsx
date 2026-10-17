import { Link } from "react-router-dom";

/** Lesson block that renders a CourseBridge (used by the AHP and TOPSIS lessons). */
export type BridgeBlock = { type: "course-bridge"; to: string; kicker: string; title: string; text: string };

/** 课程衔接卡: a link from one lesson to the section of another course it builds on. */
export function CourseBridge({ to, kicker, title, text }: { to: string; kicker: string; title: string; text: string }) {
  return (
    <aside className="course-bridge" aria-label={`${kicker}：${title}`}>
      <p className="kicker">{kicker}</p>
      <p className="course-bridge-title">{title}</p>
      <p>{text}</p>
      <Link className="btn btn-secondary" to={to}>
        打开 →
      </Link>
    </aside>
  );
}
