import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  CONTEST_ORDER,
  MODE_LABEL,
  buildSkill,
  buildWorkflowPack,
  contestProfiles,
  findSkill,
  isContestId,
  skills,
  type ContestId,
  type SkillMode,
} from "../content/skills";
import { copyText } from "./library/copyText";
import { DEFAULT_PREFS, readLastContest, readPrefs, readQuestCase, writeLastContest, writePrefs, type SkillPrefs } from "./library/skillSession";
import "./library/skills.css";

/** Only same-site 七关 paths are accepted as the "back" target. */
const safeBack = (value: string | null) => (value && /^\/quest(\?[^\s]*)?$/.test(value) ? value : null);
const MODES: SkillMode[] = ["fresh", "continue", "review"];
const CONTEST_SHORT: Record<ContestId, string> = { cumcm: "国赛", mcm: "美赛 MCM/ICM", apmcm: "APMCM", general: "其他赛事" };

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

type Feedback = { kind: "ok" | "fail"; text: string } | null;

/** 资料 › AI 技能包：选赛事和步骤，得到给自己 AI 用的完整任务说明书。 */
export function SkillsPage() {
  const { skillId } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const skill = findSkill(skillId ?? "analysis");
  const requestedContest = params.get("contest");
  const contest: ContestId = isContestId(requestedContest) ? requestedContest : (() => {
    const last = readLastContest();
    return isContestId(last) ? last : "cumcm";
  })();
  const requestedMode = params.get("mode") as SkillMode | null;
  const mode: SkillMode = skill && requestedMode && skill.modes.includes(requestedMode) ? requestedMode : "fresh";
  const back = safeBack(params.get("back"));
  const fromQuest = params.get("from") === "quest";
  const fromLegacyAi = params.get("from") === "legacy-ai";
  const questCase = useMemo(() => (fromQuest ? readQuestCase() : null), [fromQuest]);
  const [prefs, setPrefs] = useState<SkillPrefs>(() => {
    const p = readPrefs();
    const part = params.get("part");
    const section = params.get("section");
    if (part === "section" && section) return { ...p, paperPart: part, sectionName: section.slice(0, 60) };
    return part === "abstract" || part === "section" || part === "outline" ? { ...p, paperPart: part } : p;
  });
  const [attachCase, setAttachCase] = useState(true);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const output = useRef<HTMLTextAreaElement>(null);

  useEffect(() => writePrefs(prefs), [prefs]);
  useEffect(() => writeLastContest(contest), [contest]);
  useEffect(() => setFeedback(null), [skillId, contest, mode, prefs]);

  const built = useMemo(
    () =>
      skill
        ? buildSkill({
            skill: skill.id,
            contest,
            mode,
            ...prefs,
            caseTitle: attachCase && questCase ? questCase.title : undefined,
            caseText: attachCase && questCase ? questCase.text : undefined,
          })
        : null,
    [skill, contest, mode, prefs, attachCase, questCase],
  );

  if (!skill || !built) {
    return (
      <div className="site-container library-page">
        <div className="empty-state" role="alert">
          <p>没有找到这个技能。</p>
          <Link className="btn btn-secondary" to="/library/skills">查看全部技能</Link>
        </div>
      </div>
    );
  }

  const set = <K extends keyof SkillPrefs>(key: K, value: SkillPrefs[K]) => setPrefs((p) => ({ ...p, [key]: value }));
  const query = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v === null ? next.delete(k) : next.set(k, v)));
    next.delete("part");
    next.delete("section");
    return next;
  };
  const goSkill = (id: string) => {
    const next = query({ mode: null });
    if (next.get("from") === "legacy-ai") next.delete("from");
    navigate(`/library/skills/${id}${next.toString() ? `?${next}` : ""}`);
  };
  const usesDepth = skill.id === "analysis" || skill.id === "model";
  const has = (opt: (typeof skill.extraOptions)[number]) => skill.extraOptions.includes(opt);
  const advancedCount = [prefs.problemLabel, prefs.hoursLeft, has("question") ? prefs.question : "", has("teamProfile") ? prefs.teamProfile : ""].filter((v) => v.trim()).length
    + (usesDepth && prefs.depth !== "both" ? 1 : 0) + (has("codeLanguage") && prefs.codeLanguage !== "Python" ? 1 : 0);

  async function copy() {
    const ok = await copyText(built!.markdown);
    if (ok) setFeedback({ kind: "ok", text: "已复制。打开你常用的 AI，上传赛题和附件，粘贴并发送。" });
    else {
      setFeedback({ kind: "fail", text: "浏览器不允许写入剪贴板。下面的全文已选中，请按 Ctrl+C（Mac 按 ⌘C，手机长按）手动复制，或者下载 .md 文件。" });
      output.current?.focus();
      output.current?.select();
    }
  }

  return (
    <div className="site-container library-page skills-page">
      <div className="library-intro">
        <h1>AI 建模技能包</h1>
        <p className="page-lead">
          选好赛事和步骤，得到一份完整的任务说明书。把它和赛题文件一起发给你常用的 AI（ChatGPT、Claude、Kimi、DeepSeek 等都可以），AI 会按竞赛要求输出分析、表格和交接包。模桥不调用任何 AI，也不上传你的内容。
        </p>
        {back && (
          <p>
            <Link className="text-link" to={back}>← 回到七关实战</Link>
          </p>
        )}
      </div>

      {fromLegacyAi && (
        <p className="notice notice-warn" role="note">
          你打开的是旧版“AI 使用说明 / AI 规则核对”模板的链接，这两个模板已经下线。这里改为用“论文写作 · 指定章节”起草论文中的 AI 工具使用说明：只如实记录你们用了什么工具、用在哪些环节、人工如何核对，不要编造。是否允许使用 AI、声明放在哪里、写什么格式，以当届官方规则为准（
          <a className="text-link" href="https://www.mcm.edu.cn/" target="_blank" rel="noreferrer">国赛官网 ↗</a>、
          <a className="text-link" href="https://www.contest.comap.com/undergraduate/contests/mcm/instructions.php" target="_blank" rel="noreferrer">COMAP 美赛说明 ↗</a>
          ）；本站不判断是否合规。
        </p>
      )}

      <ol className="skills-howto" aria-label="使用方法">
        <li><span><strong>选择</strong>赛事、步骤和模式</span></li>
        <li><span><strong>复制或下载</strong>生成的技能文本</span></li>
        <li><span><strong>发给 AI：</strong>附上赛题和数据；结束时保存它输出的交接包，下一步选“接着上一步”</span></li>
      </ol>

      <div className="skills-layout">
        <section className="skills-config" aria-label="技能设置">
          <fieldset className="skills-field">
            <legend>① 赛事</legend>
            <div className="segmented skills-segmented">
              {CONTEST_ORDER.map((c) => (
                <label key={c}>
                  <input type="radio" name="skill-contest" checked={contest === c} onChange={() => setParams(query({ contest: c }), { replace: true })} />
                  <span>{CONTEST_SHORT[c]}</span>
                </label>
              ))}
            </div>
            <p className="muted-note">{contestProfiles[contest].name}。{contest === "general" ? "格式要求请把本届通知一起发给 AI。" : `赛事规范核验于 ${contestProfiles[contest].checkedAt}，以官方最新文件为准。`}</p>
          </fieldset>

          <fieldset className="skills-field">
            <legend>② 步骤</legend>
            <ol className="skills-steps">
              {skills.map((s) => (
                <li key={s.id}>
                  <button type="button" aria-pressed={s.id === skill.id} onClick={() => goSkill(s.id)}>
                    <span className="skills-step-no">{s.order}</span>
                    <strong>{s.title}</strong>
                    <span>{s.yields}</span>
                  </button>
                </li>
              ))}
            </ol>
          </fieldset>

          <fieldset className="skills-field">
            <legend>③ 模式</legend>
            {skill.modes.length > 1 ? (
              <div className="segmented skills-segmented">
                {MODES.filter((m) => skill.modes.includes(m)).map((m) => (
                  <label key={m}>
                    <input type="radio" name="skill-mode" checked={mode === m} onChange={() => setParams(query({ mode: m === "fresh" ? null : m }), { replace: true })} />
                    <span>{MODE_LABEL[m]}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="muted-note">选题评估是第一步，只有“从头开始”。</p>
            )}
            {mode === "continue" && (
              <label className="skills-input">
                <span>上一步的交接包（可选：也可以发给 AI 时再附上）</span>
                <textarea rows={5} value={prefs.handoffText} onChange={(e) => set("handoffText", e.target.value)} />
              </label>
            )}
            {mode === "review" && (
              <label className="skills-input">
                <span>审阅对象（可选）</span>
                <input type="text" value={prefs.reviewTarget} placeholder={`例如：${skill.id === "paper" ? "论文全文初稿" : `我们的${skill.title}`}`} onChange={(e) => set("reviewTarget", e.target.value)} />
              </label>
            )}
          </fieldset>

          {has("paperPart") && mode !== "review" && (
            <fieldset className="skills-field">
              <legend>④ 写哪一部分</legend>
              <div className="segmented skills-segmented">
                {([["outline", "全文提纲"], ["abstract", "摘要"], ["section", "指定章节"]] as const).map(([v, label]) => (
                  <label key={v}>
                    <input type="radio" name="paper-part" checked={prefs.paperPart === v} onChange={() => set("paperPart", v)} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              {prefs.paperPart === "section" && (
                <label className="skills-input">
                  <span>章节名称（可选）</span>
                  <input type="text" value={prefs.sectionName} placeholder="例如：5.2 问题二的模型建立与求解" onChange={(e) => set("sectionName", e.target.value)} />
                </label>
              )}
            </fieldset>
          )}

          {questCase && (
            <label className="skills-case">
              <input type="checkbox" checked={attachCase} onChange={(e) => setAttachCase(e.target.checked)} />
              <span>附上七关训练题「{questCase.title}」的题面（不含你的作答）</span>
            </label>
          )}

          <details className="skills-advanced">
            <summary>更多选项{advancedCount ? `（已设置 ${advancedCount} 项）` : "（可选）"}</summary>
            <div className="skills-advanced-body">
              {skill.id !== "choose" && (
                <label className="skills-input">
                  <span>选做的题目</span>
                  <input type="text" value={prefs.problemLabel} placeholder="例如：B 题" onChange={(e) => set("problemLabel", e.target.value)} />
                </label>
              )}
              <label className="skills-input">
                <span>距提交截止还有（小时）</span>
                <input type="number" min={1} max={200} inputMode="numeric" value={prefs.hoursLeft} onChange={(e) => set("hoursLeft", e.target.value.replace(/[^\d.]/g, ""))} />
              </label>
              {usesDepth && (
                <div className="skills-input">
                  <span>方案深度</span>
                  <div className="segmented skills-segmented">
                    {([["both", "稳妥 + 进阶"], ["stable", "只要稳妥方案"]] as const).map(([v, label]) => (
                      <label key={v}>
                        <input type="radio" name="skill-depth" checked={prefs.depth === v} onChange={() => set("depth", v)} />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {has("codeLanguage") && (
                <label className="skills-input">
                  <span>代码语言</span>
                  <select value={prefs.codeLanguage} onChange={(e) => set("codeLanguage", e.target.value as SkillPrefs["codeLanguage"])}>
                    <option value="Python">Python</option>
                    <option value="MATLAB">MATLAB</option>
                    <option value="R">R</option>
                    <option value="none">不需要代码</option>
                  </select>
                </label>
              )}
              {has("question") && (
                <label className="skills-input">
                  <span>只处理某一问（可选）</span>
                  <input type="text" value={prefs.question} placeholder="例如：问题二" onChange={(e) => set("question", e.target.value)} />
                </label>
              )}
              {has("teamProfile") && (
                <label className="skills-input">
                  <span>队伍情况（可选）</span>
                  <input type="text" value={prefs.teamProfile} placeholder="例如：数学强，编程一般，没人懂电力" onChange={(e) => set("teamProfile", e.target.value)} />
                </label>
              )}
              <button type="button" className="link-button" onClick={() => setPrefs({ ...DEFAULT_PREFS })}>恢复默认</button>
            </div>
          </details>
        </section>

        <section className="skills-output" aria-label="生成的技能">
          <div className="skills-output-head">
            <div>
              <h2>{built.title}</h2>
              <p className="muted-note">{MODE_LABEL[mode]} · 约 {built.markdown.length.toLocaleString("zh-CN")} 字 · 已包含赛事规范、输出格式、自检和交接包</p>
            </div>
            <div className="skills-actions">
              <button type="button" className="btn btn-primary" onClick={copy}>复制全文</button>
              <button type="button" className="btn btn-secondary" onClick={() => download(built.fileName, built.markdown)}>下载本步 .md</button>
              <button type="button" className="btn btn-quiet" onClick={() => { const p = buildWorkflowPack(contest); download(p.fileName, p.markdown); }}>
                下载全流程技能包
              </button>
            </div>
          </div>
          <p className={`skills-feedback${feedback ? ` is-${feedback.kind}` : ""}`} role="status" aria-live="polite">{feedback?.text ?? ""}</p>
          <label className="sr-only" htmlFor="skill-output">生成的技能全文</label>
          <textarea id="skill-output" ref={output} className="skills-preview" readOnly value={built.markdown} spellCheck={false} />
          <p className="notice notice-warn">
            技能内容目前为作者自查版本（2026-10），尚待负责人审核。AI 仍然可能算错、读错题或编造内容。技能文本已要求它标注来源和“待运行”，但请全队核对每个数值、公式和引用。是否允许使用 AI、如何声明，以当届官方规则为准。
          </p>
        </section>
      </div>
    </div>
  );
}
