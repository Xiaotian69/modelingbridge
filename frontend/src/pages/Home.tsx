import { Link } from "react-router-dom";
import {
  classicProblems,
  learningTracks,
  modelMethods,
  getClassicProblemPracticeLink,
} from "../data/modelingContent";
import { questStages } from "../quest/stages";
import { MathNetwork } from "../components/motion/MathNetwork";
import { Reveal } from "../components/motion/Reveal";
import { Icon, type IconName } from "../components/ui/Icon";

const entries: { title: string; text: string; to: string; icon: IconName }[] = [
  {
    title: "数学建模知识库",
    text: "读懂原理，找到合适的模型",
    to: "/learn",
    icon: "book",
  },
  {
    title: "竞赛与经典案例",
    text: "从真实问题理解建模方法",
    to: "/cases",
    icon: "flag",
  },
  {
    title: "数模七关训练",
    text: "动手实践，走完建模全流程",
    to: "/quest",
    icon: "grid",
  },
  {
    title: "建模工具箱",
    text: "编码、检验与论文表达",
    to: "/tools",
    icon: "code",
  },
];
const formulas = [
  "ŷ = β₀ + β₁x",
  "min cᵀx",
  "Aw = λw",
  "Cᵢ = Dᵢ⁻ / (Dᵢ⁺ + Dᵢ⁻)",
];

function SectionHeading({
  index,
  eyebrow,
  title,
  text,
  to,
  label,
}: {
  index: string;
  eyebrow: string;
  title: string;
  text?: string;
  to?: string;
  label?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">
          <span>{index}</span> {eyebrow}
        </p>
        <h2>{title}</h2>
        {text && <p className="section-description">{text}</p>}
      </div>
      {to && (
        <Link className="text-link" to={to}>
          {label || "探索更多"}
          <Icon name="arrow" size={17} />
        </Link>
      )}
    </div>
  );
}

export function HomePage() {
  const featured = [
    "regression-tree",
    "linear-programming",
    "ahp",
    "entropy-topsis",
  ]
    .map((slug) => modelMethods.find((m) => m.slug === slug))
    .filter((m): m is (typeof modelMethods)[number] => !!m);
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="site-container hero-main">
          <div className="hero-copy">
            <p className="hero-kicker">
              <span /> 连接数学与现实的每一种可能{" "}
              <span className="kicker-version">MODELINGBRIDGE 2.0</span>
            </p>
            <h1>
              模桥，让数学建模
              <br />
              从入门<span className="hero-highlight">走向实践。</span>
            </h1>
            <p className="hero-description">
              聚合数学建模知识、竞赛资料、学习工具与互动训练，
              <br className="desktop-break" />
              让复杂问题变得更容易理解、学习和探索。
            </p>
            <div className="hero-actions">
              <Link to="/learn" className="mb-button button-mint">
                开始学习
                <Icon name="arrow" size={18} />
              </Link>
              <Link
                to="/learn#methods"
                className="mb-button button-outline-light"
              >
                <Icon name="book" size={18} />
                探索知识库
              </Link>
            </div>
            <div className="hero-shortcuts">
              <Link to="/quest">数模闯关 ↗</Link>
              <span />
              <Link to="/learn#problem-traffic-police-platform">
                历年经典题型 ↗
              </Link>
              <span />
              <Link to="/workbench">AI 数模助手 ↗</Link>
            </div>
            <p className="hero-footnote">
              <span className="tiny-plus">+</span> 免费开放 · 自主学习 ·
              从一道题开始
            </p>
          </div>
          <div
            className="hero-visual"
            role="img"
            aria-label="数学知识网络：从问题、数据与模型连接到洞察的球面节点图"
          >
            <MathNetwork />
            <div className="graph-heading">
              <span>THE LANGUAGE OF CONNECTIONS</span>
              <span>FIG. 01</span>
            </div>
            <span className="graph-label graph-problem">
              <i />
              问题 <small>PROBLEM</small>
            </span>
            <span className="graph-label graph-model">
              <i />
              模型 <small>MODEL</small>
            </span>
            <span className="graph-label graph-data">
              <i />
              数据 <small>DATA</small>
            </span>
            <span className="graph-label graph-insight">
              <i />
              洞察 <small>INSIGHT</small>
            </span>
            <div className="graph-caption">
              <span>现实问题 → 数学语言 → 可解释的答案</span>
              <span className="graph-cross">＋</span>
            </div>
          </div>
        </div>
        <div className="hero-baseline site-container">
          <span>把知识连成路径，把思考变成实践。</span>
          <div>
            <span>
              <b>{modelMethods.length}</b> 类模型方法
            </span>
            <span>
              <b>7</b> 个实践关卡
            </span>
            <span>
              <b>∞</b> 种探索可能
            </span>
          </div>
        </div>
      </section>

      <div className="site-container">
        <section className="entry-section" aria-label="核心功能入口">
          <p className="entry-intro">
            你的下一步，
            <br />
            <strong>从这里开始。</strong>
          </p>
          <div className="entry-grid">
            {entries.map((e) => (
              <Link key={e.to} to={e.to} className="entry-card">
                <Icon name={e.icon} size={23} />
                <h2>{e.title}</h2>
                <p>{e.text}</p>
                <span className="entry-arrow">↗</span>
              </Link>
            ))}
          </div>
        </section>

        <Reveal>
          <section className="home-section" id="learning-paths">
            <SectionHeading
              index="01"
              eyebrow="LEARNING PATHS"
              title="每个起点，都有一条学习路径。"
              text="不必一次学会所有模型。选好起点，让每一步都有收获。"
              to="/learn"
              label="查看学习路径"
            />
            <div className="path-grid">
              {learningTracks.map((track, i) => (
                <Link
                  to="/learn"
                  className={`path-card path-${i}`}
                  key={track.title}
                >
                  <div className="path-top">
                    <span className="path-number">0{i + 1}</span>
                    <span className="pill">{track.duration}</span>
                  </div>
                  <h3>{track.title}</h3>
                  <p>{track.focus}</p>
                  <ul>
                    {track.steps.slice(0, 3).map((step) => (
                      <li key={step}>
                        <Icon name="check" size={14} />
                        {step}
                      </li>
                    ))}
                  </ul>
                  <span className="path-bottom">
                    进入学习路径
                    <Icon name="arrow" size={17} />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className="home-section methods-section">
            <SectionHeading
              index="02"
              eyebrow="MODEL LIBRARY"
              title="理解一个模型，多一种看世界的方式。"
              text="从适用条件到结果检验，让公式真正成为解决问题的工具。"
              to="/learn#methods"
              label="全部模型方法"
            />
            <div className="method-grid">
              {featured.map((m, i) => (
                <Link
                  to={`/learn#model-${m.slug}`}
                  className="method-card"
                  key={m.slug}
                >
                  <div className="method-art" aria-hidden="true">
                    <svg viewBox="0 0 240 84">
                      <path
                        d={
                          i === 0
                            ? "M20 68 220 17M30 60h1m25-11h1m30 3h1m22-25h1m25 8h1m28-23h1m28 7h1"
                            : i === 1
                              ? "M40 70V12M40 70h170M40 54 100 16 185 70M60 70 145 12M100 70 180 12"
                              : i === 2
                                ? "M120 14v20M55 44v-10h130v10M55 44v15M120 34v25M185 44v15M42 60h26v15H42ZM107 60h26v15h-26ZM172 60h26v15h-26ZM107 2h26v15h-26Z"
                                : "M42 70V15M42 70h162M57 54l38-19 40 8 44-30M57 63l38-17 40 11 44-19"
                        }
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={i === 0 ? 2 : 1.3}
                      />
                    </svg>
                    <span>{formulas[i]}</span>
                  </div>
                  <div className="method-body">
                    <div className="method-meta">
                      <span>{m.family}模型</span>
                      <span>{m.level}</span>
                    </div>
                    <h3>{m.name}</h3>
                    <p>{m.when}</p>
                    <span className="method-link">
                      理解这个模型 <Icon name="arrow" size={16} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className="home-section">
            <SectionHeading
              index="03"
              eyebrow="PROBLEMS & CASES"
              title="好的问题，是最好的老师。"
              text="以经典赛题的简化训练为起点，练习把现实问题转译成数学语言。"
              to="/cases"
              label="浏览案例库"
            />
            <div className="case-list">
              {classicProblems.slice(0, 3).map((problem, i) => (
                <Link
                  className="case-row"
                  key={problem.slug}
                  to={getClassicProblemPracticeLink(problem).href}
                >
                  <span className="case-number">0{i + 1}</span>
                  <div className="case-source">
                    <b>{problem.year}</b>
                    <span>{problem.contest} · 教学改编</span>
                  </div>
                  <div className="case-copy">
                    <h3>{problem.title}</h3>
                    <p>{problem.type}</p>
                  </div>
                  <span className="pill case-level">{problem.difficulty}</span>
                  <Icon name="arrow" />
                </Link>
              ))}
            </div>
            <p className="source-note">
              以上为仓库现有教学改编案例，非官方完整题面。
              <Link to="/resources">竞赛资料与来源入口 ↗</Link>
            </p>
          </section>
        </Reveal>
      </div>

      <Reveal>
        <section className="quest-band">
          <div className="site-container">
            <div className="quest-heading">
              <div>
                <p className="eyebrow">
                  04 <span>/</span> LEARN BY DOING
                </p>
                <h2>
                  从一道题开始，
                  <br />
                  走完一次数学建模。
                </h2>
              </div>
              <div>
                <p>
                  七个关卡，把“大作业”变成可完成的小目标。
                  <br />
                  写下判断，核对条件，留下属于自己的建模记录。
                </p>
                <Link to="/quest" className="mb-button button-mint">
                  开启数模七关
                  <Icon name="arrow" size={18} />
                </Link>
              </div>
            </div>
            <ol className="quest-road">
              {questStages.map((stage, i) => (
                <li key={stage.id}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <h3>{stage.shortTitle}</h3>
                  <p>{stage.outputLabel}</p>
                </li>
              ))}
            </ol>
            <div className="quest-note">
              <span>
                <Icon name="check" size={15} />
                本机自动保存
              </span>
              <span>
                <Icon name="check" size={15} />
                按条件逐关解锁
              </span>
              <span>
                <Icon name="check" size={15} />
                学习记录可导出
              </span>
              <Link to="/records">查看我的记录 ↗</Link>
            </div>
          </div>
        </section>
      </Reveal>

      <div className="site-container">
        <Reveal>
          <section className="home-section">
            <SectionHeading
              index="05"
              eyebrow="THE MODELING TOOLKIT"
              title="少一点重复摸索，多一点专注思考。"
              text="把可靠的方法，放进你的日常建模工具箱。"
              to="/tools"
              label="打开工具箱"
            />
            <div className="tool-grid">
              <Link to="/tools" className="tool-card">
                <div className="tool-copy">
                  <Icon name="code" size={25} />
                  <h3>让代码服务于问题</h3>
                  <p>
                    数据清洗、模型检验与可复现实践。
                    <br />
                    从现有编码指南开始建立好习惯。
                  </p>
                  <span className="text-link">
                    查看编码指南 <Icon name="arrow" size={17} />
                  </span>
                </div>
                <div className="code-preview" aria-hidden="true">
                  <div>
                    <i />
                    <i />
                    <i />
                    <span>modeling.py · 工作流程</span>
                  </div>
                  <pre>
                    <span># 从问题到可解释的结果</span>
                    {"\n"}01 理解数据与单位{"\n"}02 建立基准模型{"\n"}03
                    检验误差与约束{"\n"}04 解释结果，记录局限
                  </pre>
                </div>
              </Link>
              <Link to="/tools" className="tool-card writing-tool">
                <Icon name="book" size={25} />
                <h3>把思考写清楚</h3>
                <p>论文结构、图表表达与交稿检查清单，让每个结论都有依据。</p>
                <div className="tool-tags">
                  <span>论文框架</span>
                  <span>图表检查</span>
                  <span>AI 使用记录</span>
                </div>
                <span className="text-link">
                  查看表达指南 <Icon name="arrow" size={17} />
                </span>
              </Link>
            </div>
            <p className="source-note">
              代码片段与可复制提示词库将在后续内容升级中加入；当前入口提供已有编码与写作指南。
            </p>
          </section>
        </Reveal>

        <Reveal>
          <section className="assistant-panel">
            <div className="assistant-symbol">
              <Icon name="spark" size={28} />
            </div>
            <div className="assistant-copy">
              <p className="eyebrow">06 / AI LEARNING COMPANION</p>
              <h2>你的数模学习助手</h2>
              <p>辅助理解模型、梳理思路与检查代码，让学习始终由你掌舵。</p>
              <span className="service-status">
                <span className="status-dot" />
                AI 在线服务暂未开放
              </span>
            </div>
            <div className="assistant-action">
              <Link to="/workbench" className="mb-button button-dark">
                了解 AI 工作台
                <Icon name="arrow" size={17} />
              </Link>
              <small>知识学习与七关训练可独立使用</small>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className="community-section">
            <p className="eyebrow">BUILT FOR LEARNERS, BY LEARNERS</p>
            <h2>一座桥，由每个愿意分享的人搭起。</h2>
            <p>
              模桥是一个持续生长的公益学习项目。
              <br />
              欢迎同学、教师与数学建模协会，一起留下经验、完善内容。
            </p>
            <div>
              <Link to="/about" className="text-link">
                认识模桥
                <Icon name="arrow" size={17} />
              </Link>
              <Link to="/feedback" className="text-link">
                参与内容共建
                <Icon name="arrow" size={17} />
              </Link>
              <a
                href="https://github.com/Xiaotian69/modelingbridge"
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                <Icon name="github" size={17} />
                GitHub ↗
              </a>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
