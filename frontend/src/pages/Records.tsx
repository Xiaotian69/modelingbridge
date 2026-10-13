import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PreferencesPanel } from "../app/PreferencesPanel";
import { Collapse } from "../components/motion/Collapse";
import { PageHead } from "../components/ui/PageHead";
import { getLocalCase } from "../data/localCases";
import { practiceBankOf } from "../learning/courseBanks";
import { COURSES, sectionIndex, sectionTitleIn } from "../learning/courses";
import { PRACTICE_KEY, READING_KEY } from "../learning/storage";
import { learning, useLearning } from "../state/learning";
import { LEARNING_KEY, type ExerciseRecord } from "../state/learningStore";
import {
  REPORTS_KEY,
  clearQuestDrafts,
  clearRecords,
  estimateBytes,
  listQuestDrafts,
  loadRecords,
  questHref,
  saveWorkbenchRecord,
  type StoredRecord,
} from "../state/localRecords";
import { recordToMarkdown, recordsToMarkdown } from "../utils/markdownBuilder";

export { saveWorkbenchRecord, type StoredRecord };

const QUEST_TOTAL = 7;

type Status = "correct" | "wrong" | "draft" | "new";
const statusOf = (r?: ExerciseRecord): Status => {
  if (!r) return "new";
  if (r.lastStatus === "correct") return "correct";
  if (r.lastStatus) return "wrong";
  return (Array.isArray(r.draft) ? r.draft.length > 0 : !!r.draft) ? "draft" : "new";
};
const STATUS: Record<Status, { mark: string; text: string }> = {
  correct: { mark: "✓", text: "最近一次正确" },
  wrong: { mark: "✕", text: "待重练" },
  draft: { mark: "◐", text: "有草稿未提交" },
  new: { mark: "○", text: "未做" },
};
const HELP = ["", "看过启发", "看过线索", "看过完整解析"];

function exerciseLabel(id: string) {
  const m = /^(?:ahp-)?(self|practice)-(\d+)$/.exec(id);
  return m ? `${m[1] === "self" ? "自测" : "练习"} ${m[2]}` : id;
}

function downloadText(filename: string, content: string, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
const today = () => new Date().toISOString().slice(0, 10);
const formatTime = (iso: string) => (iso ? new Date(iso).toLocaleString() : "");

export function RecordsPage() {
  const { state, persistent, readOnly, notice } = useLearning();
  const [reports, setReports] = useState<StoredRecord[]>(loadRecords);
  const [drafts, setDrafts] = useState(listQuestDrafts);
  const [onlyWrong, setOnlyWrong] = useState(false);
  const [status, setStatus] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [scope, setScope] = useState({ learning: true, quests: true, reports: true });

  const courses = COURSES.map((course) => {
    const statuses = practiceBankOf(course.id).map((q) => ({
      q,
      record: state.exercises[q.id],
      status: statusOf(state.exercises[q.id]),
    }));
    const counts = statuses.reduce<Record<Status, number>>(
      (acc, s) => ({ ...acc, [s.status]: acc[s.status] + 1 }),
      { correct: 0, wrong: 0, draft: 0, new: 0 },
    );
    return {
      course,
      reading: state.reading[course.id],
      tried: course.checkpointIds.filter((id) => state.checkpoints[id]?.tried).length,
      statuses,
      counts,
      shown: onlyWrong ? statuses.filter((s) => s.status === "wrong") : statuses,
    };
  });
  const totalWrong = courses.reduce((n, c) => n + c.counts.wrong, 0);
  const readingCount = courses.filter((c) => c.reading).length;
  const startedDrafts = drafts.filter((d) => d.started);
  const learningCount =
    readingCount + Object.keys(state.exercises).length + Object.keys(state.checkpoints).length;
  const hasAnything = learningCount > 0 || drafts.length > 0 || reports.length > 0;

  const size = useMemo(
    () => estimateBytes([LEARNING_KEY, PRACTICE_KEY, READING_KEY, REPORTS_KEY, ...drafts.map((d) => d.key)]),
    // Recomputed whenever the visible data changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, drafts, reports],
  );

  async function copy(content: string, ok: string) {
    try {
      await navigator.clipboard.writeText(content);
      setStatus(ok);
    } catch {
      setStatus("复制失败，请下载后查看。");
    }
  }

  function exportAll() {
    const data = {
      app: "ModelingBridge 模桥",
      exportedAt: new Date().toISOString(),
      note: "本文件只包含此浏览器中的学习数据；提示词变量与浏览偏好不在其中。",
      learning: state,
      questDrafts: Object.fromEntries(drafts.map((d) => [d.sourceId, d.raw])),
      reports,
    };
    downloadText(`modelingbridge-learning-${today()}.json`, JSON.stringify(data, null, 2), "application/json;charset=utf-8");
    setStatus("已导出学习数据 JSON。");
  }

  function clearSelected() {
    const done: string[] = [];
    if (scope.learning) {
      learning.clearAll();
      done.push("课程与练习进度");
    }
    if (scope.quests) {
      clearQuestDrafts();
      setDrafts([]);
      done.push("七关草稿");
    }
    if (scope.reports) {
      clearRecords();
      setReports([]);
      done.push("实战报告");
    }
    setConfirming(false);
    setStatus(done.length ? `已清空：${done.join("、")}。` : "没有选择要清空的内容。");
  }

  return (
    <div className="records-page">
      <PageHead
        title="学习记录"
        lead="你的阅读位置、练习、七关草稿和实战报告都只保存在这个浏览器里，不会上传。"
      />
      <div className="site-container records-body">
        {!persistent && (
          <p className="notice notice-warn" role="status">
            此浏览器当前不允许本地保存，本次学习在关闭页面后会丢失。可以先导出 JSON 留存。
          </p>
        )}
        {notice === "migrated" && <p className="notice notice-info">已自动迁移旧版学习记录，旧记录仍保留在本机。</p>}
        {notice === "recovered" && (
          <p className="notice notice-warn">本机学习数据曾经损坏，已备份原文并从旧版记录恢复。</p>
        )}
        {readOnly && (
          <p className="notice notice-warn">这些学习数据来自更新版本的模桥，当前页面只读显示，不会覆盖。</p>
        )}

        <section className="records-section" aria-labelledby="rec-course">
          <h2 id="rec-course">课程进度</h2>
          <div className="records-two">
            {courses.map(({ course, reading, tried }) => (
              <div className="records-card" key={course.id}>
                <div className="records-head">
                  <p className="records-title">{course.title}精讲</p>
                  <Link
                    className="btn btn-secondary"
                    to={reading ? `${course.lessonPath}#${reading.lastSectionId}` : course.lessonPath}
                  >
                    {reading ? "继续阅读" : "开始阅读"}
                  </Link>
                </div>
                {reading ? (
                  <>
                    <p>
                      上次读到第 {sectionIndex(course, reading.lastSectionId) + 1} 节「{sectionTitleIn(course, reading.lastSectionId)}」 ·
                      读过 {reading.visited.length}/{course.sections.length} 节
                    </p>
                    <progress max={course.sections.length} value={reading.visited.length} aria-label={`${course.title}已读小节`} />
                  </>
                ) : (
                  <p className="muted-note">还没有阅读记录。</p>
                )}
                <p className="muted-note">
                  章内检查点尝试过 {tried}/{course.checkpointIds.length}（检查点不计成绩）
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="records-section" aria-labelledby="rec-practice">
          <div className="records-head">
            <h2 id="rec-practice">专项练习</h2>
            <label className="switch-inline">
              <input type="checkbox" checked={onlyWrong} onChange={(e) => setOnlyWrong(e.target.checked)} />
              只看错题（{totalWrong}）
            </label>
          </div>
          {courses.map(({ course, statuses, counts, shown }) => (
            <div key={course.id} className="records-course">
              <p className="records-counts">
                {course.title} {statuses.length} 题：✓ {counts.correct} · ✕ {counts.wrong} 待重练 · ◐ {counts.draft} 有草稿 · ○ {counts.new} 未做
              </p>
              {shown.length === 0 ? (
                <p className="muted-note">没有待重练的题目。</p>
              ) : (
                <ul className="records-list">
                  {shown.map(({ q, record, status: s }) => (
                    <li key={q.id}>
                      <span className={`q-mark is-${s}`} aria-hidden="true">
                        {STATUS[s].mark}
                      </span>
                      <span className="records-item-main">
                        <strong>{exerciseLabel(q.id)}</strong>
                        <span className="muted-note">
                          {q.difficulty} · {STATUS[s].text}
                          {record?.attempts ? ` · 提交 ${record.attempts} 次` : ""}
                          {record?.helpLevel ? ` · ${HELP[record.helpLevel]}` : ""}
                          {record?.legacy ? " · 旧版记录" : ""}
                        </span>
                      </span>
                      <Link className="text-link" to={`${course.practicePath}/${q.id}`}>
                        {s === "wrong" ? "重练" : s === "draft" ? "继续作答" : s === "correct" ? "再看一遍" : "去做题"}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>

        <section className="records-section" aria-labelledby="rec-quest">
          <div className="records-head">
            <h2 id="rec-quest">七关实战</h2>
            <Link className="btn btn-secondary" to="/quest">
              进入七关实战
            </Link>
          </div>
          {startedDrafts.length === 0 ? (
            <p className="muted-note">还没有进行中的七关训练。</p>
          ) : (
            <ul className="records-list">
              {startedDrafts.map((d) => (
                <li key={d.key}>
                  <span className={`q-mark is-${d.completed === QUEST_TOTAL ? "correct" : "draft"}`} aria-hidden="true">
                    {d.completed === QUEST_TOTAL ? "✓" : "◐"}
                  </span>
                  <span className="records-item-main">
                    <strong>{d.caseSlug ? getLocalCase(d.caseSlug)?.title ?? d.caseSlug : "默认训练题：共享单车需求与调度"}</strong>
                    <span className="muted-note">
                      {d.completed}/{QUEST_TOTAL} 关已通关{d.updatedAt ? ` · ${formatTime(d.updatedAt)}` : ""}
                    </span>
                  </span>
                  <Link className="text-link" to={questHref(d.sourceId)}>
                    继续
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="records-section" aria-labelledby="rec-reports">
          <div className="records-head">
            <h2 id="rec-reports">实战报告（{reports.length}）</h2>
            <div className="records-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={reports.length === 0}
                onClick={() => downloadText(`learning-records-${today()}.md`, recordsToMarkdown(reports))}
              >
                导出 Markdown
              </button>
            </div>
          </div>
          {reports.length === 0 ? (
            <p className="muted-note">暂无报告。在七关实战中点“保存实战报告”后会出现在这里（最多保留最近 20 份）。</p>
          ) : (
            <ul className="report-list">
              {reports.map((r) => (
                <li key={r.id} className="records-card">
                  <p className="muted-note">{formatTime(r.savedAt)}</p>
                  <p className="records-title">{r.title || "未命名题目"}</p>
                  <p className="report-summary">{r.summary}</p>
                  <div className="records-actions">
                    <button type="button" className="link-button" onClick={() => copy(recordToMarkdown(r), "已复制该份报告摘要。")}>
                      复制本条 Markdown
                    </button>
                    {r.fullReport && (
                      <button type="button" className="link-button" onClick={() => downloadText(`quest-report-${r.id}.md`, r.fullReport!)}>
                        下载完整报告
                      </button>
                    )}
                    {r.usageLog && (
                      <button type="button" className="link-button" onClick={() => copy(r.usageLog || "", "已复制该份 AI 使用记录。")}>
                        复制 AI 使用记录
                      </button>
                    )}
                  </div>
                  {r.usageLog && (
                    <details>
                      <summary>查看 AI 使用记录</summary>
                      <p className="report-summary">{r.usageLog}</p>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="records-section" aria-labelledby="rec-data">
          <h2 id="rec-data">数据与隐私</h2>
          <div className="records-two">
            <div className="records-card">
              <p className="records-title">学习数据（保存在此设备）</p>
              <p className="muted-note">
                阅读位置、练习、七关草稿与实战报告 · 约 {Math.max(1, Math.round(size / 1024))} KB
              </p>
              <div className="records-actions">
                <button type="button" className="btn btn-secondary" onClick={exportAll}>
                  导出 JSON
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  aria-expanded={confirming}
                  aria-controls="clear-panel"
                  disabled={!hasAnything}
                  onClick={() => setConfirming(!confirming)}
                >
                  清空学习数据…
                </button>
              </div>
              <Collapse open={confirming}>
                <div id="clear-panel" className="clear-panel">
                  <p>选择要从此浏览器删除的内容（不可撤销，建议先导出 JSON）：</p>
                  <label>
                    <input type="checkbox" checked={scope.learning} onChange={(e) => setScope({ ...scope, learning: e.target.checked })} />
                    课程与练习进度：阅读位置 {readingCount} 条、练习记录 {Object.keys(state.exercises).length} 条、检查点{" "}
                    {Object.keys(state.checkpoints).length} 条（含旧版备份键）
                  </label>
                  <label>
                    <input type="checkbox" checked={scope.quests} onChange={(e) => setScope({ ...scope, quests: e.target.checked })} />
                    七关草稿 {drafts.length} 份
                  </label>
                  <label>
                    <input type="checkbox" checked={scope.reports} onChange={(e) => setScope({ ...scope, reports: e.target.checked })} />
                    实战报告 {reports.length} 份
                  </label>
                  <div className="records-actions">
                    <button type="button" className="btn btn-danger" onClick={clearSelected}>
                      确认清空所选内容
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setConfirming(false)}>
                      取消
                    </button>
                  </div>
                </div>
              </Collapse>
            </div>
            <div className="records-card">
              <p className="records-title">AI 对话</p>
              <p className="muted-note">AI 助教尚未开放，本站目前不保存、也不发送任何 AI 对话。提示词库的复制操作只写入你的剪贴板。</p>
            </div>
          </div>
          <p className="muted-note">无痕模式、清除浏览器站点数据或换设备都会丢失本地记录；跨设备同步将在以后提供。</p>
          <p className="records-status" role="status">
            {status}
          </p>
        </section>

        <PreferencesPanel />
      </div>
    </div>
  );
}
