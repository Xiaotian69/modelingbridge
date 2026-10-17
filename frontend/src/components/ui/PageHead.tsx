import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export type Crumb = { label: string; to?: string };

/** Standard V2 page heading: breadcrumb, title, one-line lead and optional actions. */
export function PageHead({
  crumbs,
  title,
  lead,
  children,
}: {
  crumbs?: Crumb[];
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="page-head site-container">
      {crumbs && crumbs.length > 0 && (
        <nav className="crumbs" aria-label="当前位置">
          {crumbs.map((crumb, i) => (
            <span key={`${crumb.label}-${i}`}>
              {i > 0 && <span aria-hidden="true"> / </span>}
              {crumb.to ? (
                <Link to={crumb.to}>{crumb.label}</Link>
              ) : (
                <span aria-current="page">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <h1>{title}</h1>
      {lead && <p className="page-lead">{lead}</p>}
      {children && <div className="page-head-actions">{children}</div>}
    </header>
  );
}
