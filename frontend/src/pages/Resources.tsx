import { useEffect, useMemo, useState } from "react";
import { listResources } from "../api/client";
import { withTrialAccessCode } from "../trial/access";
import type { ResourceFile, ResourceListResponse } from "../types";

const kinds = ["全部", "赛题", "优秀论文", "综合资料", "提示词/模板"];

export function ResourcesPage() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("全部");
  const [data, setData] = useState<ResourceListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      listResources({ q: query, kind, limit: 180 })
        .then(setData)
        .catch((e) => setError(e instanceof Error ? e.message : "资源列表加载失败"))
        .finally(() => setLoading(false));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query, kind]);

  const grouped = useMemo(() => {
    const rows = data?.items ?? [];
    return rows.reduce<Record<string, ResourceFile[]>>((acc, item) => {
      const key = `${item.kind} · ${item.year}`;
      acc[key] = acc[key] ? [...acc[key], item] : [item];
      return acc;
    }, {});
  }, [data]);

  return (
    <div className="hairline-grid">
      <section className="premium-shell">
        <div className="relative mx-auto max-w-7xl px-4 py-14 text-white">
          <p className="inline-flex rounded-md border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-100">
            Resource Vault
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            赛题资源下载窗口
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
            先把本地上传的美赛真题、中文翻译、优秀论文、赛题解析和提示词模板统一索引起来。后续你和我继续找题、上传资料，只要放进白名单资料夹，刷新页面就能下载。
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 lg:grid-cols-[20rem_1fr]">
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="quiet-card rounded-3xl p-5">
            <h2 className="text-xl font-semibold text-slate-950">检索</h2>
            <label className="mt-5 block text-sm font-semibold text-slate-700">
              关键词
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="年份、MCM、ICM、题号、论文..."
              />
            </label>
            <div className="mt-5">
              <p className="text-sm font-semibold text-slate-700">类型</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {kinds.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setKind(item)}
                    className={[
                      "rounded-full border px-3 py-1.5 text-sm font-semibold transition",
                      kind === item ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-bridge-400",
                    ].join(" ")}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-950">当前结果</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{data?.summary.total ?? 0}</p>
              <p className="text-xs text-slate-500">{loading ? "扫描中..." : "最多展示前 180 个，可用关键词继续缩小范围"}</p>
            </div>
          </div>

          <div className="quiet-card rounded-3xl p-5">
            <h2 className="text-base font-semibold text-slate-950">资料夹状态</h2>
            <div className="mt-3 space-y-3">
              {data?.summary.groups.map((group) => (
                <div key={group.key} className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">{group.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${group.exists ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>
                      {group.exists ? "已连接" : "未找到"}
                    </span>
                  </div>
                  <p className="mt-2 break-all text-xs leading-5 text-slate-500">{group.path}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="space-y-5">
          {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
          {!error && Object.keys(grouped).length === 0 && (
            <div className="quiet-card rounded-3xl p-8 text-sm text-slate-600">暂无匹配资源。可以换个关键词，或把新资料放进资料包目录后刷新。</div>
          )}
          {Object.entries(grouped).map(([group, rows]) => (
            <section key={group} className="quiet-card rounded-3xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-slate-950">{group}</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{rows.length} 个文件</span>
              </div>
              <div className="mt-4 grid gap-3">
                {rows.map((item) => (
                  <ResourceRow key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
        </main>
      </section>
    </div>
  );
}

function ResourceRow({ item }: { item: ResourceFile }) {
  return (
    <article className="interactive-card rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-bridge-50 px-2 py-0.5 font-semibold text-bridge-800">{item.kind}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{item.year}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{item.extension || "file"}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{formatBytes(item.size)}</span>
          </div>
          <h3 className="mt-2 truncate text-base font-semibold text-slate-950" title={item.name}>
            {item.title}
          </h3>
          <p className="mt-1 break-all text-xs leading-5 text-slate-500">{item.relative_path}</p>
        </div>
        <a
          href={withTrialAccessCode(item.download_url)}
          className="shrink-0 rounded-lg bg-slate-950 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
        >
          下载
        </a>
      </div>
    </article>
  );
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  return `${(value / 1024 / 1024 / 1024).toFixed(1)} GB`;
}
