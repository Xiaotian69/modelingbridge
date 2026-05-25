export function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
        关于试运行
      </p>
      <h1 className="mt-4 text-3xl font-semibold text-slate-950">模桥的边界要先讲清楚</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
        模桥（ModelingBridge）当前处在免费试运行阶段。我们想验证它能不能帮助同学理解数学建模流程，而不是把它包装成收费工具或一键论文服务。
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-950">我们做什么</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
            <li>帮助你拆解题目、小问、目标、约束和输出形式。</li>
            <li>给出数据需求、模型候选、代码框架和检验清单。</li>
            <li>提醒你在关键节点做人工确认与修改。</li>
            <li>保存学习记录和 AI 使用记录，方便复盘。</li>
          </ul>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-950">我们不做什么</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
            <li>不生成可直接提交的论文终稿。</li>
            <li>不提供代写、代赛或自动参赛服务。</li>
            <li>不承诺比赛结果、奖项等级或保奖效果。</li>
            <li>不替你核验外部数据、文献和结果真实性。</li>
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-lg font-semibold text-amber-950">AI 使用记录为什么重要</h2>
        <p className="mt-3 text-sm leading-7 text-amber-900">
          AI 输出可能不完整，也可能偏离题意。工作台记录输入摘要、提示词版本、AI 输出摘要、人工确认节点和人工补充内容，是为了让使用过程透明可复盘。涉及竞赛或课程提交时，请按老师、学校或赛规要求自行补充披露。
        </p>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-950">给协会或老师的说明</h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          试运行建议用于周末教学、入门训练或赛前流程演示。请把它作为“讲解和检查工具”，而不是作业替代工具。每次试用后，建议收集学生反馈：哪里更清楚、哪里不准确、下一版最需要什么。
        </p>
      </section>
    </div>
  );
}
