import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const FEEDBACK_KEY = "mb_trial_feedback";

type TrialFeedback = {
  id: string;
  savedAt: string;
  role: string;
  scene: string;
  usefulness: string;
  helpful: string;
  inaccurate: string;
  wanted: string;
  contact: string;
};

function loadFeedback(): TrialFeedback[] {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TrialFeedback[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFeedback(payload: Omit<TrialFeedback, "id" | "savedAt">) {
  const rows = loadFeedback();
  const item: TrialFeedback = {
    ...payload,
    id: `${Date.now()}`,
    savedAt: new Date().toISOString(),
  };
  rows.unshift(item);
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(rows.slice(0, 50)));
}

function downloadText(filename: string, content: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function feedbackToMarkdown(rows: TrialFeedback[]) {
  const lines = [
    "# 试运行反馈导出",
    "",
    `导出时间：${new Date().toLocaleString()}`,
    `反馈数量：${rows.length}`,
    "",
  ];

  rows.forEach((row, index) => {
    lines.push(
      `## ${index + 1}. ${row.role} / ${row.scene}`,
      "",
      `- 提交时间：${new Date(row.savedAt).toLocaleString()}`,
      `- 有用程度：${row.usefulness} 分`,
      "",
      "### 最有用的地方",
      row.helpful || "未填写",
      "",
      "### 不准确或不好用的地方",
      row.inaccurate || "未填写",
      "",
      "### 下一版想要什么",
      row.wanted || "未填写",
      "",
      "### 联系方式或备注",
      row.contact || "未填写",
      "",
    );
  });

  return lines.join("\n");
}

export function FeedbackPage() {
  const [rows, setRows] = useState<TrialFeedback[]>([]);
  const [role, setRole] = useState("第一次参赛的新手");
  const [scene, setScene] = useState("自己试用 AI 工作台");
  const [usefulness, setUsefulness] = useState("4");
  const [helpful, setHelpful] = useState("");
  const [inaccurate, setInaccurate] = useState("");
  const [wanted, setWanted] = useState("");
  const [contact, setContact] = useState("");

  useEffect(() => {
    setRows(loadFeedback());
  }, []);

  function submit() {
    saveFeedback({ role, scene, usefulness, helpful, inaccurate, wanted, contact });
    setRows(loadFeedback());
    setHelpful("");
    setInaccurate("");
    setWanted("");
    setContact("");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <p className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            试运行反馈
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950">这页用来决定下一版做什么</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            目前反馈只保存在本机浏览器，适合内部试用和协会试点课收集意见。后续如果要公开试运行，再接数据库或问卷系统。
          </p>
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-950">判断标准</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>是否让新手更清楚下一步该做什么。</li>
              <li>是否能支撑 90-120 分钟协会试点课。</li>
              <li>AI 输出是否贴题、可解释、可复盘。</li>
            </ul>
            <Link
              to="/workbench"
              className="mt-5 inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              先去工作台试用
            </Link>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">提交一条反馈</h2>
          <div className="mt-5 grid gap-4">
            <label className="text-sm font-medium text-slate-700">
              你的角色
              <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={role} onChange={(e) => setRole(e.target.value)}>
                <option>第一次参赛的新手</option>
                <option>会 Python 但建模弱</option>
                <option>有参赛经验的同学</option>
                <option>协会教学组</option>
                <option>项目团队内部</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              使用场景
              <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={scene} onChange={(e) => setScene(e.target.value)}>
                <option>自己试用 AI 工作台</option>
                <option>协会周末课演示</option>
                <option>赛前训练</option>
                <option>案例学习</option>
                <option>内部产品评审</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              有用程度
              <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={usefulness} onChange={(e) => setUsefulness(e.target.value)}>
                <option value="5">5 分，很有用</option>
                <option value="4">4 分，有帮助但还要改</option>
                <option value="3">3 分，价值一般</option>
                <option value="2">2 分，不太有用</option>
                <option value="1">1 分，方向不对</option>
              </select>
            </label>
            <TextArea label="最有用的地方" value={helpful} onChange={setHelpful} placeholder="例如：小问拆解清楚、模型解释能看懂。" />
            <TextArea label="不准确或不好用的地方" value={inaccurate} onChange={setInaccurate} placeholder="例如：模型太泛、页面太长、表格看不清。" />
            <TextArea label="下一版最希望增加什么" value={wanted} onChange={setWanted} placeholder="例如：AI 使用记录导出、更多案例、数据清洗模板。" />
            <label className="text-sm font-medium text-slate-700">
              联系方式或备注
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="可留空"
              />
            </label>
            <button
              type="button"
              onClick={submit}
              className="rounded-lg bg-bridge-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-bridge-600"
            >
              保存到本机反馈列表
            </button>
          </div>
        </section>
      </div>

      <section className="mt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-slate-950">本机反馈记录</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={rows.length === 0}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-bridge-400 disabled:opacity-50"
              onClick={() => downloadText(`trial-feedback-${new Date().toISOString().slice(0, 10)}.md`, feedbackToMarkdown(rows))}
            >
              导出 Markdown
            </button>
            <button
              type="button"
              disabled={rows.length === 0}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-bridge-400 disabled:opacity-50"
              onClick={() =>
                downloadText(
                  `trial-feedback-${new Date().toISOString().slice(0, 10)}.json`,
                  JSON.stringify(rows, null, 2),
                  "application/json;charset=utf-8",
                )
              }
            >
              导出 JSON
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-red-300 hover:text-red-700"
              onClick={() => {
                if (confirm("确定清空本机试运行反馈？")) {
                  localStorage.removeItem(FEEDBACK_KEY);
                  setRows([]);
                }
              }}
            >
              清空反馈
            </button>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {rows.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
              暂无反馈。完成一次工作台试用后，回来记录真实感受。
            </div>
          )}
          {rows.map((row) => (
            <article key={row.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                <span>{new Date(row.savedAt).toLocaleString()}</span>
                <span>{row.role}</span>
                <span>{row.scene}</span>
                <span>{row.usefulness} 分</span>
              </div>
              <div className="mt-3 grid gap-3 text-sm leading-6 text-slate-700 md:grid-cols-3">
                <FeedbackBlock label="有用" value={row.helpful} />
                <FeedbackBlock label="问题" value={row.inaccurate} />
                <FeedbackBlock label="想要" value={row.wanted} />
              </div>
              {row.contact && <p className="mt-3 text-xs text-slate-500">备注：{row.contact}</p>}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <textarea
        className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function FeedbackBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap">{value || "未填写"}</p>
    </div>
  );
}
