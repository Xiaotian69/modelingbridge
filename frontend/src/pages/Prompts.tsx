import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { PROMPT_TASK_TYPES, REVIEW_LABEL, findPrompt, placeholdersOf, publishedPrompts, type PromptTemplate } from "../content/prompts";
import { questStages } from "../quest/stages";
import { copyText } from "./library/copyText";
import { PromptDetail } from "./library/PromptDetail";

const ALL = "全部用途";
const stageOrder = (p: PromptTemplate) =>
  Math.min(...p.stage.map((id) => questStages.find((s) => s.id === id)?.order ?? 99));

/** Only same-site 七关 paths are accepted as the "back" target. */
const safeBack = (value: string | null) => (value && /^\/quest(\?[^\s]*)?$/.test(value) ? value : null);

/** 资料 › 提示词库: list + detail (desktop side by side, phone one at a time). */
export function PromptsPage() {
  const { promptId } = useParams();
  const [params, setParams] = useSearchParams();
  const [announce, setAnnounce] = useState("");
  const task = params.get("task") ?? ALL;
  const query = params.get("q") ?? "";
  const back = safeBack(params.get("back"));
  const selected = promptId ? findPrompt(promptId) : null;

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return publishedPrompts
      .filter((p) => task === ALL || p.taskType === task)
      .filter((p) => !q || [p.title, p.summary, p.taskType].join(" ").toLowerCase().includes(q))
      .sort((a, b) => stageOrder(a) - stageOrder(b) || a.title.localeCompare(b.title, "zh"));
  }, [task, query]);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (!value || value === ALL) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };
  const keepQuery = params.toString() ? `?${params.toString()}` : "";

  async function quickCopy(p: PromptTemplate) {
    const ok = await copyText(p.templateText);
    const count = placeholdersOf(p.templateText).length;
    setAnnounce(
      ok
        ? `已复制「${p.title}」模板原文，其中有 ${count} 个占位符未填写。`
        : `复制失败，请打开「${p.title}」的详情页手动复制。`,
    );
  }

  return (
    <div className={`site-container library-page prompts-page${selected ? " has-detail" : ""}`}>
      <div className="library-intro">
        <h1>提示词库</h1>
        <p className="page-lead">
          {publishedPrompts.length} 条模桥原创演示模板（标“待复核”的尚未经负责人审核）。先自己思考，再填写变量、复制到你使用的 AI 工具中；本页不会调用任何 AI。
        </p>
        {back && (
          <p>
            <Link className="text-link" to={back}>
              ← 回到七关实战
            </Link>
          </p>
        )}
      </div>

      {promptId && !selected && (
        <div className="empty-state" role="alert">
          <p>没有找到这条提示词，它可能已下线或尚未审核。</p>
          <Link className="btn btn-secondary" to="/library/prompts">
            查看全部提示词
          </Link>
        </div>
      )}

      <div className="prompts-layout">
        <aside className="prompts-filter">
          <fieldset>
            <legend>用途</legend>
            {[ALL, ...PROMPT_TASK_TYPES].map((item) => (
              <label key={item} className="radio-row">
                <input type="radio" name="prompt-task" checked={task === item} onChange={() => update("task", item)} />
                <span>{item === "AI使用说明" ? "AI 使用说明" : item}</span>
              </label>
            ))}
          </fieldset>
        </aside>

        <section className="prompts-list" aria-label="提示词列表">
          <label className="field-inline">
            <span className="sr-only">搜索提示词</span>
            <input type="search" value={query} placeholder="搜索提示词…" onChange={(e) => update("q", e.target.value)} />
          </label>
          {list.length === 0 ? (
            <div className="empty-state">
              <p>这个用途下还没有模板。</p>
              <button type="button" className="btn btn-secondary" onClick={() => setParams({}, { replace: true })}>
                查看全部
              </button>
            </div>
          ) : (
            <ul>
              {list.map((p) => (
                <li key={p.id} className={`prompt-row${selected?.id === p.id ? " is-current" : ""}`}>
                  <Link
                    to={`/library/prompts/${p.id}${keepQuery}`}
                    aria-current={selected?.id === p.id ? "true" : undefined}
                    className="prompt-row-link"
                  >
                    <strong>{p.title}</strong>
                    <span>{p.summary}</span>
                    <span className="badge-row">
                      <span className="badge">{p.taskType === "AI使用说明" ? "AI 使用说明" : p.taskType}</span>
                      <span className="badge">通用</span>
                      <span className="badge">演示模板</span>
                      {p.reviewStatus !== "draft" && (
                        <span className={`badge badge-review is-${p.reviewStatus}`}>{REVIEW_LABEL[p.reviewStatus].short}</span>
                      )}
                    </span>
                  </Link>
                  <button type="button" className="link-button" aria-label={`复制：${p.title}`} onClick={() => quickCopy(p)}>
                    复制
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="copy-result" role="status" aria-live="polite">
            {announce}
          </p>
        </section>

        <section className="prompts-detail" aria-label="提示词详情">
          {selected ? (
            <>
              <Link className="text-link prompts-back" to={`/library/prompts${keepQuery}`}>
                ← 返回列表
              </Link>
              <PromptDetail prompt={selected} />
            </>
          ) : (
            <div className="prompts-placeholder">
              <p>从左侧选择一条提示词，查看用途、填写变量并复制。</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
