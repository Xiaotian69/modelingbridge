import { useEffect, useMemo, useRef, useState } from "react";
import { fillTemplate, type PromptTemplate } from "../../content/prompts";
import { questStages } from "../../quest/stages";
import { copyText } from "./copyText";

/** Variable values live only in this tab (03 §3.6): never in learning data or exports. */
const varsKey = (id: string) => `mb.v2.promptVars.${id}`;
type Stored = { values: Record<string, string>; examples: string[]; prefilled: string[] };

export function readPromptVars(id: string): Stored {
  try {
    const raw = sessionStorage.getItem(varsKey(id));
    const parsed = raw ? (JSON.parse(raw) as Partial<Stored>) : null;
    if (parsed && typeof parsed.values === "object" && parsed.values)
      return { values: parsed.values, examples: parsed.examples ?? [], prefilled: parsed.prefilled ?? [] };
  } catch {
    /* unavailable or malformed: start empty */
  }
  return { values: {}, examples: [], prefilled: [] };
}

function writePromptVars(id: string, stored: Stored) {
  try {
    sessionStorage.setItem(varsKey(id), JSON.stringify(stored));
  } catch {
    /* session storage blocked: values stay in memory */
  }
}

/** Pre-fill public training-problem fields (never the student's own answers) if still empty. */
export function prefillPromptVars(prompt: PromptTemplate, source: { problemText: string }) {
  const stored = readPromptVars(prompt.id);
  let changed = false;
  for (const v of prompt.variables) {
    if (v.prefillFrom === "quest.problemText" && !stored.values[v.key]?.trim() && source.problemText) {
      stored.values[v.key] = source.problemText;
      stored.prefilled = [...new Set([...stored.prefilled, v.key])];
      changed = true;
    }
  }
  if (changed) writePromptVars(prompt.id, stored);
}

const stageNames = (prompt: PromptTemplate) =>
  prompt.stage
    .map((id) => questStages.find((s) => s.id === id))
    .filter(Boolean)
    .map((s) => `第 ${s!.order} 关 ${s!.title}`)
    .join("、");

type CopyResult = { kind: "ok" | "partial" | "fail"; message: string } | null;

export function PromptDetail({ prompt, headingLevel = 2 }: { prompt: PromptTemplate; headingLevel?: 1 | 2 }) {
  const [stored, setStored] = useState<Stored>(() => readPromptVars(prompt.id));
  const [result, setResult] = useState<CopyResult>(null);
  const [expanded, setExpanded] = useState(false);
  const fallback = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setStored(readPromptVars(prompt.id));
    setResult(null);
  }, [prompt.id]);
  useEffect(() => {
    if (result?.kind === "fail") {
      fallback.current?.focus();
      fallback.current?.select();
    }
    if (!result || result.kind === "fail") return;
    const timer = window.setTimeout(() => setResult(null), 4000);
    return () => window.clearTimeout(timer);
  }, [result]);

  const filled = useMemo(() => fillTemplate(prompt.templateText, stored.values), [prompt.templateText, stored.values]);
  const save = (next: Stored) => {
    setStored(next);
    writePromptVars(prompt.id, next);
  };
  const setValue = (key: string, value: string) =>
    save({
      values: { ...stored.values, [key]: value },
      examples: stored.examples.filter((k) => k !== key),
      prefilled: stored.prefilled.filter((k) => k !== key),
    });
  const fillExamples = () =>
    save({
      values: Object.fromEntries(prompt.variables.map((v) => [v.key, v.example])),
      examples: prompt.variables.map((v) => v.key),
      prefilled: [],
    });

  async function copy() {
    const ok = await copyText(filled.output);
    const missing = filled.missing;
    setResult(
      !ok
        ? { kind: "fail", message: "复制失败：浏览器不允许写入剪贴板。下面的文本已全选，请按 Ctrl+C（手机长按）手动复制。" }
        : missing.length
          ? { kind: "partial", message: `已复制。仍有 ${missing.length} 个占位符未填写：${missing.map((m) => `{${m}}`).join("、")}` }
          : { kind: "ok", message: "✓ 已复制完整提示词" },
    );
  }

  const Heading = headingLevel === 1 ? "h1" : "h2";
  const requiredMissing = prompt.variables.filter((v) => v.required && !stored.values[v.key]?.trim()).length;

  return (
    <article className="prompt-detail" aria-labelledby={`prompt-${prompt.id}`}>
      <div className="badge-row">
        <span className="badge">{prompt.taskType}</span>
        <span className="badge badge-license is-original">原创</span>
        <span className="badge">演示模板</span>
      </div>
      <Heading id={`prompt-${prompt.id}`} className="prompt-title">
        {prompt.title}
      </Heading>
      <p className="prompt-summary">{prompt.summary}</p>
      <dl className="prompt-meta">
        <div>
          <dt>适用关卡</dt>
          <dd>{stageNames(prompt) || "通用"}</dd>
        </div>
        <div>
          <dt>适用比赛</dt>
          <dd>通用</dd>
        </div>
        <div>
          <dt>来源 · 授权</dt>
          <dd>{prompt.source.author}</dd>
        </div>
        <div>
          <dt>版本</dt>
          <dd>
            v{prompt.version} · {prompt.updatedAt} · 已自查，待负责人复核
          </dd>
        </div>
      </dl>
      <p className="notice notice-warn">比赛是否允许使用 AI、如何披露，以当届官方规则为准。</p>
      <p className="prompt-before">
        <strong>使用前：</strong>
        {prompt.before}
      </p>

      <section className="prompt-vars" aria-label="填写变量">
        <div className="prompt-vars-head">
          <h3>填写变量</h3>
          <div>
            <button type="button" className="link-button" onClick={fillExamples}>
              填入示例
            </button>
            <button type="button" className="link-button" onClick={() => save({ values: {}, examples: [], prefilled: [] })}>
              清空填写
            </button>
          </div>
        </div>
        {prompt.variables.map((v) => {
          const id = `var-${prompt.id}-${v.key}`;
          const tag = stored.examples.includes(v.key) ? "示例，请替换" : stored.prefilled.includes(v.key) ? "已预填，可修改" : "";
          return (
            <div key={v.key} className="prompt-field">
              <label htmlFor={id}>
                {v.label}
                {v.required ? <span className="req"> *必填</span> : <span className="opt">（可选）</span>}
                {tag && <span className="field-tag">{tag}</span>}
              </label>
              {v.multiline ? (
                <textarea
                  id={id}
                  rows={3}
                  value={stored.values[v.key] ?? ""}
                  placeholder={`例如：${v.example}`}
                  onChange={(e) => setValue(v.key, e.target.value)}
                />
              ) : (
                <input
                  id={id}
                  value={stored.values[v.key] ?? ""}
                  placeholder={`例如：${v.example}`}
                  onChange={(e) => setValue(v.key, e.target.value)}
                />
              )}
            </div>
          );
        })}
        <p className="muted-note">填写内容只保存在当前标签页，关闭后消失；不会进入学习记录。</p>
      </section>

      <section className="prompt-preview" aria-label="提示词预览">
        <div className="prompt-vars-head">
          <h3>预览</h3>
          <span className="muted-note">
            {filled.output.length} 字{filled.missing.length ? ` · ${filled.missing.length} 处未填写` : ""}
          </span>
        </div>
        <pre className={expanded ? "is-expanded" : undefined}>
          {filled.parts.map((part, i) =>
            part.kind === "text" ? (
              <span key={i}>{part.text}</span>
            ) : (
              <mark key={i} className={part.kind === "filled" ? "is-filled" : "is-missing"}>
                {part.text}
              </mark>
            ),
          )}
        </pre>
        <button type="button" className="link-button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          {expanded ? "收起" : "展开全文"}
        </button>
      </section>

      <div className="prompt-actions">
        <button type="button" className="btn btn-primary" onClick={copy}>
          复制完整提示词
        </button>
        {requiredMissing > 0 && <span className="muted-note">还有 {requiredMissing} 个必填项未填写，也可以先复制再在外部补充。</span>}
      </div>
      <p className={`copy-result${result ? ` is-${result.kind}` : ""}`} role="status" aria-live="polite">
        {result?.message ?? ""}
      </p>
      {result?.kind === "fail" && (
        <textarea ref={fallback} className="copy-fallback" readOnly value={filled.output} aria-label="提示词全文，请手动复制" rows={8} />
      )}
      <p className="muted-note">复制只会写入你的剪贴板，不会发送给任何 AI 服务，也不做任何记录。</p>
      <p className="prompt-limits">
        <strong>限制：</strong>
        {prompt.limits}
      </p>
    </article>
  );
}
