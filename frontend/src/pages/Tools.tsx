import { codingTips, writingTips } from "../data/modelingContent";

const checks = [
  {
    title: "数据清洗",
    items: ["字段单位统一", "缺失处理有记录", "异常值不过度删除", "训练测试不泄露"],
  },
  {
    title: "模型检验",
    items: ["有 baseline", "有误差指标", "有约束核验", "有敏感性分析"],
  },
  {
    title: "图表表达",
    items: ["标题可读", "坐标有单位", "图后有结论", "不堆重复图"],
  },
  {
    title: "合规记录",
    items: ["保存 AI 输入", "记录模型建议", "标注人工修改", "不复制终稿"],
  },
];

export function ToolsPage() {
  return (
    <div className="hairline-grid">
      <section className="premium-shell">
        <div className="relative mx-auto max-w-7xl px-4 py-14 text-white">
          <p className="inline-flex rounded-md border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-100">
            Coding & Writing
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            编码和论文写作技巧
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
            建模不是只会一个模型名。真正能交付的队伍，需要代码可复现、图表能说明问题、论文能把假设和结果讲清楚。
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-10 lg:grid-cols-2">
        <TipColumn title="编码技巧" data={codingTips} />
        <TipColumn title="论文写作技巧" data={writingTips} />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="quiet-card rounded-3xl p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bridge-700">Checklist</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">交稿前四张检查卡</h2>
            </div>
            <p className="text-sm text-slate-500">适合最后 6 小时复盘</p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {checks.map((check) => (
              <article key={check.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-950">{check.title}</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  {check.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-bridge-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function TipColumn({ title, data }: { title: string; data: { title: string; items: string[] }[] }) {
  return (
    <section className="quiet-card rounded-3xl p-6">
      <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
      <div className="mt-5 grid gap-3">
        {data.map((tip) => (
          <article key={tip.title} className="interactive-card rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="font-semibold text-slate-950">{tip.title}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {tip.items.map((item) => (
                <span key={item} className="soft-badge rounded-full px-2.5 py-1 text-xs text-slate-600">
                  {item}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
