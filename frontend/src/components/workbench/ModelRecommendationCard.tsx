import { Link } from "react-router-dom";
import { findModelMethod } from "../../data/modelingContent";
import { Button } from "../ui/Button";
import type { WorkbenchAnalysis } from "../../types";

export function ModelRecommendationCard({
  model,
  onCopyPrompt,
}: {
  model: WorkbenchAnalysis["models"][number];
  onCopyPrompt: () => void;
}) {
  const method = findModelMethod(model.name);
  return (
    <article className="interactive-card rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-bridge-700">
            {model.tier} · {model.model_type}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">{model.name}</h3>
        </div>
        {method && (
          <Link
            to={`/learn#model-${method.slug}`}
            className="rounded-full bg-bridge-50 px-3 py-1 text-xs font-semibold text-bridge-800 hover:bg-bridge-100"
          >
            学方法
          </Link>
        )}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{model.reason}</p>
      <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
        <p className="rounded-xl bg-slate-50 p-3">输入：{model.inputs}</p>
        <p className="rounded-xl bg-slate-50 p-3">输出：{model.outputs}</p>
        <p className="rounded-xl bg-amber-50 p-3 text-amber-900">局限：{model.cons}</p>
        <p className="rounded-xl bg-emerald-50 p-3 text-emerald-900">检验：{model.validation}</p>
      </div>
      <Button variant="secondary" size="sm" className="mt-4" onClick={onCopyPrompt}>
        复制问答式学习提示
      </Button>
    </article>
  );
}
