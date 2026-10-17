import { useId, useState } from "react";
import { COMMUTE_DAYS, CLASS_MINUTE } from "./data";
import { clock, latestSafeDeparture, mean } from "./math";

export type Role = "model" | "code" | "write";
export const ROLES: { id: Role; name: string }[] = [
  { id: "model", name: "模型分析" },
  { id: "code", name: "计算与编程" },
  { id: "write", name: "论文与表达" },
];
const roleName = (r: Role) => ROLES.find((x) => x.id === r)!.name;

export type TeamTask = {
  id: string;
  task: string;
  /** Who usually leads it; several when either is common. */
  usual: Role[];
  why: string;
  /** Everyone who has to take part (always at least two roles). */
  involves: Role[];
  together: string;
};

const average = mean(COMMUTE_DAYS);
const safe = latestSafeDeparture(COMMUTE_DAYS, CLASS_MINUTE);

/** Five real jobs from the commute case (§3). There is no single right assignment. */
export const TEAM_TASKS: TeamTask[] = [
  {
    id: "choose",
    task: "决定用平均用时还是最长用时来定出门时刻",
    usual: ["model"],
    why: "这是在把目标翻译成要计算的量，属于模型分析。",
    involves: ["model", "code", "write"],
    together: "编程的同学把两种结果都算出来做对比；写论文的同学要能说清为什么这样选。",
  },
  {
    id: "table",
    task: `整理 ${COMMUTE_DAYS.length} 天的记录，算出平均值和最大值`,
    usual: ["code"],
    why: "整理数据、计算统计量，是计算与编程的日常工作。",
    involves: ["code", "model"],
    together: `负责模型的同学要看一眼结果是否合理：平均 ${average} 分钟可信，算出 120 分钟就一定是哪里错了。`,
  },
  {
    id: "chart",
    task: "画一张每天用时的图，标出下雨的那一天",
    usual: ["code", "write"],
    why: "画图常由编程的同学完成，也常由写论文的同学按全文需要来做。",
    involves: ["code", "write", "model"],
    together: "图要回答模型关心的问题：哪几天会迟到、雨天慢多少。先想清楚要说明什么，再决定画什么图。",
  },
  {
    id: "assumption",
    task: "写清“最近两周能代表接下来几周”这条假设，以及它可能不成立的情况",
    usual: ["write", "model"],
    why: "假设在模型分析时提出，在论文里写清楚；两边都有人牵头很常见。",
    involves: ["write", "model"],
    together: "写的人要真正理解这条假设为什么必要、什么时候会失效（比如考试周、道路施工），而不只是照抄一句话。",
  },
  {
    id: "explain",
    task: `向别人解释：为什么最后选 ${clock(safe)}，而不是 ${clock(CLASS_MINUTE - average)}`,
    usual: ["write"],
    why: "把结论讲清楚、讲得让人信服，是论文与表达的核心工作。",
    involves: ["write", "model", "code"],
    together: "模型分析提供理由（目标是每天准时），计算提供证据（10 天的检验结果）。三样缺一样，解释就站不住。",
  },
];

/** §4: choose who leads each job, then see who else has to be involved. Nothing is marked wrong. */
export function TeamBoard() {
  const id = useId();
  const [picks, setPicks] = useState<Record<string, Role>>({});
  const answered = TEAM_TASKS.filter((t) => picks[t.id]).length;
  const shared = TEAM_TASKS.filter((t) => t.involves.length >= 2).length;

  return (
    <figure className="lp-lab intro-team" aria-labelledby={`${id}-title`}>
      <figcaption>
        <span className="eyebrow">动手试 / 分配任务</span>
        <h3 id={`${id}-title`}>五项工作，谁来牵头？</h3>
      </figcaption>
      <ol className="intro-tasks">
        {TEAM_TASKS.map((t) => {
          const pick = picks[t.id];
          return (
            <li key={t.id}>
              <p className="intro-task-name" id={`${id}-${t.id}`}>
                {t.task}
              </p>
              <div className="segmented-buttons" role="group" aria-labelledby={`${id}-${t.id}`}>
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    aria-pressed={pick === r.id}
                    onClick={() => setPicks((prev) => ({ ...prev, [t.id]: r.id }))}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
              {pick && (
                <div className="intro-task-feedback" role="status">
                  <p>
                    {t.usual.includes(pick) ? (
                      <>
                        <b>✓ 常见的分工。</b>
                        {t.why}
                      </>
                    ) : (
                      <>
                        <b>◐ 也可以。</b>不过这项工作通常由「{t.usual.map(roleName).join("」或「")}」牵头：{t.why}
                      </>
                    )}
                  </p>
                  <p>
                    <b>还需要谁：</b>
                    {t.involves.map(roleName).join("、")}。{t.together}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {answered === TEAM_TASKS.length ? (
        <div className="intro-result" role="status">
          <p>
            {TEAM_TASKS.length} 项工作里，<b>{shared} 项都至少需要两类同学参与</b>。分工决定的是谁牵头，而不是谁可以不管。
          </p>
          <button type="button" className="link-button" onClick={() => setPicks({})}>
            重新分配
          </button>
        </div>
      ) : (
        <p className="muted-note">
          已选 {answered}/{TEAM_TASKS.length} 项。选完五项会看到一个小结。
        </p>
      )}
    </figure>
  );
}
