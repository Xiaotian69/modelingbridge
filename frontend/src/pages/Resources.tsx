import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  LICENSE_LABEL,
  RESOURCE_KINDS,
  buildResourceIndex,
  type ResourceItem,
} from "../content/resources";

const ALL = "全部";

/** 资料索引: original material and official links only (Q6). No file downloads. */
export function ResourcesPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const kindParam = params.get("kind");
  const kind = kindParam && (RESOURCE_KINDS as readonly string[]).includes(kindParam) ? kindParam : ALL;
  const items = useMemo(buildResourceIndex, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (item) =>
        (kind === ALL || item.kind === kind) &&
        (!q || [item.title, item.summary, ...item.meta].join(" ").toLowerCase().includes(q)),
    );
  }, [items, kind, query]);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (!value || value === ALL) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  return (
    <div className="site-container library-page">
      <div className="library-intro">
        <h1>资料索引</h1>
        <p className="page-lead">
          收录模桥原创的课程、教学案例与练习，以及各赛事的官方公开页面。
        </p>
        <p className="notice notice-info">
          第三方整理的赛题、优秀论文合集在授权核验前不提供下载，也不在此列出；赛题原文请到官方页面获取。
        </p>
      </div>

      <div className="filter-bar">
        <label className="field-inline">
          <span className="sr-only">搜索资料</span>
          <input
            type="search"
            value={query}
            placeholder="搜索标题、年份、方法…"
            onChange={(e) => update("q", e.target.value)}
          />
        </label>
        <div className="chip-group" role="group" aria-label="资料类型">
          {[ALL, ...RESOURCE_KINDS].map((item) => (
            <button
              key={item}
              type="button"
              className="chip"
              aria-pressed={kind === item}
              onClick={() => update("kind", item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <p className="result-count" role="status">
        共 {filtered.length} 条
      </p>
      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>没有找到匹配的资料。</p>
          <button type="button" className="btn btn-secondary" onClick={() => setParams({}, { replace: true })}>
            查看全部
          </button>
        </div>
      ) : (
        <ul className="resource-list">
          {filtered.map((item) => (
            <ResourceRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ResourceRow({ item }: { item: ResourceItem }) {
  return (
    <li className="resource-row">
      <div className="resource-main">
        <div className="badge-row">
          <span className="badge">{item.kind}</span>
          <span className={`badge badge-license is-${item.licenseStatus}`}>{LICENSE_LABEL[item.licenseStatus]}</span>
        </div>
        <h2>{item.title}</h2>
        <p>{item.summary}</p>
        {item.meta.length > 0 && <p className="resource-meta">{item.meta.join(" · ")}</p>}
      </div>
      <div className="resource-actions">
        {item.to && (
          <Link className="btn btn-secondary" to={item.to}>
            {item.kind === "官方赛事与规则" ? "看日历" : "打开"}
          </Link>
        )}
        {item.officialUrl && (
          <a className="text-link" href={item.officialUrl} target="_blank" rel="noreferrer">
            {item.officialLabel ?? "官方页面"} ↗
          </a>
        )}
      </div>
    </li>
  );
}
