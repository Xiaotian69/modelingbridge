import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { recordToMarkdown, recordsToMarkdown } from "../utils/markdownBuilder";

const STORAGE_KEY = "mb_records";

export type StoredRecord = {
  id: string;
  savedAt: string;
  title: string;
  summary: string;
  usageLog?: string;
};

function loadRecords(): StoredRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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


export function saveWorkbenchRecord(payload: { title: string; summary: string; usageLog?: string }) {
  const list = loadRecords();
  const rec: StoredRecord = {
    id: `${Date.now()}`,
    savedAt: new Date().toISOString(),
    title: payload.title.slice(0, 80),
    summary: payload.summary.slice(0, 2000),
    usageLog: payload.usageLog?.slice(0, 5000),
  };
  list.unshift(rec);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 20)));
}

export function RecordsPage() {
  const [rows, setRows] = useState<StoredRecord[]>([]);
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    setRows(loadRecords());
  }, []);

  async function copyText(content: string, successText: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopyStatus(successText);
    } catch {
      setCopyStatus("复制失败，请展开记录后手动复制。");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">学习记录 / 项目空间</h1>
      <p className="mt-2 text-slate-600 max-w-3xl leading-relaxed text-sm">
        试运行阶段先沉淀题目、输出卡片、AI 使用记录与人工确认节点。当前版本仅在
        <strong>本机浏览器</strong>
        中保存你在工作台点击「保存学习记录」的内容，便于复盘；后续可接账号与数据库。
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/workbench"
          className="inline-flex rounded-xl bg-bridge-700 px-4 py-2 text-sm font-semibold text-white hover:bg-bridge-600"
        >
          去 AI 引导工作台
        </Link>
        <button
          type="button"
          disabled={rows.length === 0}
          className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-bridge-400 disabled:opacity-50"
          onClick={() => downloadText(`learning-records-${new Date().toISOString().slice(0, 10)}.md`, recordsToMarkdown(rows))}
        >
          导出 Markdown
        </button>
        <button
          type="button"
          disabled={rows.length === 0}
          className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-bridge-400 disabled:opacity-50"
          onClick={() =>
            downloadText(
              `learning-records-${new Date().toISOString().slice(0, 10)}.json`,
              JSON.stringify(rows, null, 2),
              "application/json;charset=utf-8",
            )
          }
        >
          导出 JSON
        </button>
        <button
          type="button"
          className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-red-300 hover:text-red-700"
          onClick={() => {
            if (confirm("确定清空本机全部学习记录？")) {
              localStorage.removeItem(STORAGE_KEY);
              setRows([]);
            }
          }}
        >
          清空本机记录
        </button>
      </div>
      {copyStatus && <p className="mt-3 text-sm text-slate-500">{copyStatus}</p>}

      <div className="mt-10 space-y-4">
        {rows.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-600">
            暂无记录。请在工作台完成分析后，在最后一步点击「保存学习记录」。
          </div>
        )}
        {rows.map((r) => (
          <article key={r.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500">{new Date(r.savedAt).toLocaleString()}</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">{r.title || "未命名题目"}</h2>
            <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{r.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-bridge-400"
                onClick={() => copyText(recordToMarkdown(r), "已复制该条学习记录。")}
              >
                复制本条 Markdown
              </button>
              {r.usageLog && (
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-bridge-400"
                  onClick={() => copyText(r.usageLog || "", "已复制该条 AI 使用记录。")}
                >
                  复制 AI 使用记录
                </button>
              )}
            </div>
            {r.usageLog && (
              <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">查看 AI 使用记录</summary>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{r.usageLog}</p>
              </details>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
