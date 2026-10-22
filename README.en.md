<div align="center">

# ModelingBridge · 模桥

### From a question you cannot decode to a model you can defend.
**From Confusion to Models. From Models to Solutions.**

**An interactive learning space built for the next generation of mathematical modelers.**  
Learn not only **which model to use**, but **why it fits, how it works, and when to question the result**.

[🌐 Live Website](https://www.modelingbridge.cc) · [📚 Start Learning](https://www.modelingbridge.cc/learn) · [🧩 Modeling Quest](https://www.modelingbridge.cc/quest) · [🇨🇳 简体中文](README.md)

![React 18](https://img.shields.io/badge/React-18-149eca?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Version](https://img.shields.io/badge/version-v3.0.0-2563eb)
![Status](https://img.shields.io/badge/status-free%20trial-16a34a)

**Created & Led by [@Xiaotian69](https://github.com/Xiaotian69)**

</div>

![ModelingBridge: from complex problems to testable models](docs/assets/hero.png)

<sub>The interface shown in this cover is the early MVP guided workbench, not the current V3.0 UI. For the latest experience, [open the website](https://www.modelingbridge.cc).</sub>

> **In one sentence:** ModelingBridge turns mathematical modeling from a collection of formulas and templates into a journey of exploration, experimentation, practice, and reflection.

---

## ✨ Why ModelingBridge?

A common first encounter with mathematical modeling looks like this:

- The problem statement is long, and you do not know where to start.
- You recognize names like linear programming, AHP, and TOPSIS—but not when to use them.
- Your code runs, yet you cannot confidently defend the assumptions behind it.
- You have bookmarks, slides, and PDFs everywhere, but no coherent learning path.
- You want to join a modeling competition, yet struggle to connect theory with practice.

**ModelingBridge is not another pile of resources or a one-click paper generator.**

It is an attempt to connect the learning process end to end:

**Understand → Build Intuition → Experiment → Practice → Model → Validate → Reflect**

Instead of watching an answer appear, learners make—and examine—the decisions along the way.

## 🚀 ModelingBridge V3.0 at a Glance

| What you can explore | Why it matters |
| --- | --- |
| 🎒 **Lesson Zero** | Starting from a rainy-day umbrella allocation problem, walk through objectives, variables, assumptions, solving, validation, and improvement before learning advanced methods |
| 📐 **Five interactive courses** | Linear Programming, AHP, TOPSIS / Entropy Weighting, Regression, and Graph / Network Optimization |
| 🧪 **Hands-on experiments** | Observe how assumptions, constraints, weights, or data can change a conclusion; Linear Programming also has a dedicated interactive lab |
| 📝 **Topic-focused practice** | Each of the five courses has matching exercises with layered hints, feedback, and retries |
| 🧭 **Seven-checkpoint modeling quest** | Go from first reading of a problem to a paper outline through a complete, traceable process |
| 🧠 **AI Skills and a guided workbench** | Use structured prompts and checklists, with clear separation between demo and live AI |
| 📅 **Competition calendar** | Organize key dates while distinguishing officially announced, unverified, and projected entries |
| 📁 **Cases and resource index** | Find original learning content and links to official sources |
| 💾 **Local learning progress** | No sign-up; resume learning on the same browser and revisit your work |

> **Release boundary:** The public website currently delivers a deployed static frontend experience and is in a free trial phase. The repository also contains a FastAPI backend and configurable model integration for local development. Their presence **does not mean live AI tutoring, cloud accounts, or automatically refreshed competition data are available in production**.

## 🧭 Your Modeling Learning Journey

```mermaid
flowchart TD
    A["New to mathematical modeling?"] --> B["Lesson Zero"]
    B --> C["Choose a learning track"]
    C --> D["Interactive lessons"]
    D --> E["Experiments + practice"]
    E --> F["Seven-checkpoint quest"]
    F --> G["Cases + validation + reflection"]
    G --> D
    E -.-> H["AI Skills / Guided Workbench"]
    H -.-> E
```

**Best starting point:** [Lesson Zero — Introduction to Mathematical Modeling](https://www.modelingbridge.cc/learn/introduction).

### 01 · Start With Intuition, Not Jargon

Lesson Zero takes about 15–20 minutes and opens with a rainy-day question: how should a limited supply of umbrellas be allocated? Through it, learners meet objectives, decision variables, assumptions, solutions, validation, and iteration—building the modeling mindset before encountering a full toolkit.

No programming language or algorithm is required up front. Learners with some background can skip straight to any course.

### 02 · Five Courses, Five Ways to Think

| Topic | A motivating question | What you learn | Explore |
| --- | --- | --- | --- |
| **Linear Programming** | How should scarce resources be allocated? | Objectives, decision variables, constraints, feasible regions, optima; plus an interactive lab | [Course](https://www.modelingbridge.cc/learn/linear-programming) |
| **Analytic Hierarchy Process (AHP)** | How can subjective priorities become a structured decision? | Hierarchies, pairwise comparisons, weights, consistency checks | [Course](https://www.modelingbridge.cc/learn/ahp) |
| **TOPSIS / Entropy Weighting** | How should alternatives be ranked against several criteria? | Normalization, ideal solutions, closeness, data-driven weights | [Course](https://www.modelingbridge.cc/learn/topsis) |
| **Regression Analysis** | What can data tell us about likely outcomes? | Least squares, fit, residuals, interpretation, prediction limits | [Course](https://www.modelingbridge.cc/learn/regression) |
| **Graph & Network Optimization** | What is the shortest route or cheapest connection? | Graph representation, Dijkstra, Kruskal, network reasoning | [Course](https://www.modelingbridge.cc/learn/graph) |

These are not just static articles: the courses include interactive components designed to turn mathematical concepts into actions learners can explore. Every course starts from zero with no prerequisites; for the evaluation track, AHP is recommended before TOPSIS.

### 03 · Understanding Must Survive Practice

ModelingBridge connects lessons with topic-specific exercises:

- Each of the five courses has its own practice set.
- Work through questions and receive structured feedback and layered hints.
- Retry after making mistakes.
- Keep learning state locally in your browser.

**Lessons build intuition. Practice exposes the gaps.**

[Explore practice](https://www.modelingbridge.cc/practice).

### 04 · The Seven-Checkpoint Quest

A realistic modeling question rarely comes with an obvious method. The quest focuses on a sequence of decisions:

1. **Break the ice:** state the background, goal, constraints, and keywords of the problem.
2. **Decompose the task:** split it into subproblems with clear inputs, outputs, and evaluation criteria.
3. **Scout the data:** decide which fields, sources, units, and fallbacks you need.
4. **Choose a model:** compare baseline and advanced models and justify the choice.
5. **Start the code:** turn the modeling route into data flow, functions, and pseudocode.
6. **Plan the figures:** decide which charts you need and which conclusion each one supports.
7. **Outline the paper:** organize sections, conclusions, validation, and a record of AI use.

Each checkpoint comes with built-in coach hint cards and pass conditions; no online AI is called. **The goal is not a one-click answer. It is a model you understand well enough to defend.**

[Try the modeling quest](https://www.modelingbridge.cc/quest).

## 🧠 AI as a Learning Copilot—not an Answer Vending Machine

Our guiding question is simple: **Can AI help people understand the work instead of bypassing it?**

The repository includes AI-oriented skill content and an eight-step guided workbench covering problem intake, goal decomposition, data planning, model selection, code practice, result interpretation, validation, and paper communication.

- **Useful assistance:** explain concepts, compare options, uncover assumptions, suggest verification checks, and support reflection.
- **Human responsibility:** verify every important dataset, derivation, assumption, citation, and final statement.
- **Honest deployment boundary:** the online AI service is not yet open on the public website; the workbench there shows teaching demo results. Local FastAPI development can use a configured OpenAI-compatible provider, and also falls back to demo results without a key. Do not mistake a demo response for a verified live-model interaction.

> **AI may be the copilot. The learner remains responsible for the model.**

## 🗂️ Beyond Courses: The Competition Learning Toolkit

**Teaching cases.** Explore example problems and reasoning patterns without presenting instructional cases as official contest solutions.

**Skills and tools.** Use modeling references, AI Skills, the toolbox, and the guided workbench to bridge the gap between terminology and practical workflow.

**Competition calendar.** Explore a year-view timeline and monthly list. Officially announced milestones, unverified entries, and projections from previous years are labeled distinctly. **The calendar does not yet automatically verify new announcements in real time.** Always consult organizers and your school for authoritative dates.

**Resource index.** The currently deployed foundation focuses on original content and official public-source links, with no file downloads. Curated textbooks, openly available lectures, methodology references, exemplary papers, authorized reading experiences, and a dedicated historical-problem module are future work—not a shipped download library.

**Challenges and team-role exploration.** The website also includes an interactive recruitment challenge and a separate learning activity about roles within a modeling team.

## 🖼️ Preview

For the most up-to-date interface, **[open the live website](https://www.modelingbridge.cc)**. The repository does not yet include V3.0 screenshots.

<details>
<summary>View legacy MVP screenshots</summary>

The images below depict earlier local demo experiences. **They are not verified screenshots of the V3.0 production UI.**

| Guided workbench (legacy) | Case library (legacy) |
| --- | --- |
| ![Legacy workbench](docs/assets/screenshots/guided-workbench.png) | ![Legacy case library](docs/assets/screenshots/case-library.png) |

| Home (legacy) | Mobile quest (legacy) |
| --- | --- |
| ![Legacy home](docs/assets/screenshots/home.png) | ![Legacy mobile quest](docs/assets/screenshots/mobile-path.png) |

</details>

## 🧱 Architecture

The public frontend and the repository's optional backend are intentionally distinguished.

```mermaid
flowchart LR
    U["Browser"] --> E["Tencent Cloud EdgeOne Pages (static hosting)"]
    E --> W["React 18 + TypeScript + Vite"]
    W --> I["Lessons · Practice · Quest · Tools"]
    W --> L[("Local browser progress")]
    W -. "Local/configured API" .-> A["Python FastAPI"]
    A --> C["Teaching cases + demo behavior"]
    A -. "Optional API key" .-> M["OpenAI-compatible Model API"]
```

| Layer | Stack |
| --- | --- |
| Frontend | React 18, TypeScript 5.6, Vite 5 |
| UI | Tailwind CSS, responsive layout, interactive components |
| Math and code rendering | KaTeX, highlight.js |
| Routing | React Router |
| Quality checks | Vitest, Testing Library, TypeScript checking, production build |
| Optional backend | Python, FastAPI (repository code, not a confirmed live production API) |
| Frontend hosting | Tencent Cloud EdgeOne Pages |
| Progress storage | Browser-local data; no claim of cross-device account sync |

### Repository Layout

```text
modelingbridge/
├── frontend/             # Web app, courses, exercises, resources, calendar
├── backend/              # Optional FastAPI and model integration
├── cases/                # Teaching-case data
├── docs/                 # Product, collaboration, deployment, and content docs
├── README.md             # Simplified Chinese project overview
└── README.en.md          # English project overview
```

The exact layout may evolve as branches are integrated.

## ⚡ Run Locally

> **Important branch note:** `main` currently retains an early MVP baseline. The V3.0 description here is based on `feat/edgeone-hk-pilot`, the branch behind the live website. Until the branches are reconciled, do not assume cloning default `main` gives you the current V3.0 website.

You will need **Node.js 22 (LTS)** for the frontend. Python 3.11+ is only needed if you also want to run FastAPI locally.

```bash
git clone https://github.com/Xiaotian69/modelingbridge.git
cd modelingbridge
git switch feat/edgeone-hk-pilot

cd frontend
npm ci
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

Optional backend, in a second terminal starting from the repository root:

```bash
cd backend
python -m venv .venv

# Windows PowerShell:
# .\.venv\Scripts\Activate.ps1
# macOS / Linux:
# source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Configure an OpenAI-compatible provider only if you need live model responses: copy `backend/.env.example` to a local `backend/.env` and fill in the connection details. Never commit secrets or put private keys in public `VITE_*` build variables.

### Tests

```bash
cd frontend
npm ci
npx tsc --noEmit
npm test
npm run build
```

For backend tests, install `backend/requirements-dev.txt`, then run `python -m pytest -q` from the repository root. Some resource-directory tests expect optional, untracked local materials and may fail in a clean clone. Report those constraints instead of copying in files without permission.

## 🛣️ Roadmap

| Stage | Direction | Status |
| --- | --- | --- |
| **V3.0** | Intro lesson, five interactive courses, exercises, seven-checkpoint quest, tools, base resource index, calendar | ✅ Implemented / frontend deployed |
| **Content expansion** | Vetted modeling textbooks, public lectures, method references, exemplary cases/papers, authorized reading | 🔧 In progress |
| **Competition data** | Automated discovery with human review and source traceability | 🧭 Planned |
| **Learning continuity** | Accounts, cross-device records, cloud synchronization | 🧭 Planned |
| **Intelligent tutoring** | More realistic, verifiable, trackable AI learning workflows | 🧭 Planned |
| **Dedicated contest archive** | Dedicated historical-problem experience after rights and provenance checks | 🧭 Future phase |

A roadmap describes intended work, **not features already shipped**. Content correctness, mathematical validity, browser/mobile testing, and release review remain part of the acceptance process.

## 🤝 Contributing and Collaboration

ModelingBridge aims to be a student-maintainable learning project. Thoughtful feedback and contributions are welcome in mathematical review, exercise design, accessibility, frontend UX, tests, and documentation.

- Start with the [contribution guide](CONTRIBUTING.md) and the [team workflow](docs/TEAM_WORKFLOW.md) (both in Chinese).
- Discuss through Issues; propose changes using a branch and Pull Request. Use the base branch the maintainer names in the Issue—do not start new work from the legacy `main`.
- Do not upload private credentials, personal data, or contest/publishing materials without verified permission.
- Public source and internally reviewed working materials are separated.
- AI may assist development or writing, but human maintainers review content and authorize releases.

## 👤 Creator & Maintainer

| Role | Credit |
| --- | --- |
| **Creator / Project Lead / Maintainer** | **[@Xiaotian69](https://github.com/Xiaotian69)** |
| Project responsibilities | Vision, product and architecture decisions, development oversight, review, verification, and release approval |
| AI assistance | Claude, Codex, and similar tools may help with writing, coding, and review; tools are not listed as human project owners |

Genuine human collaboration and contributions remain credited in the appropriate commit history, PRs, and acknowledgments. The project's creator/maintainer credit is distinct from GitHub's automatically generated contributor statistics.

## 📜 Licensing, Content Rights & Academic Integrity

**Publicly visible does not mean open-source licensed.** This repository does not currently contain a project-wide `LICENSE` file. Until the maintainer publishes one, this README does not claim an MIT or other open-source license. Original content and third-party materials may be subject to different rights.

ModelingBridge is an educational tool, not a ghostwriting, contest-submission, or award-guarantee service. Learners remain responsible for the provenance of data, mathematical reasoning, code, citations, and final results, and for complying with their school and competition rules on AI use.

---

<div align="center">

### Every great model begins with a better question.

**Model Better. Think Deeper. Build Your Own Path.**

[🌐 Explore ModelingBridge](https://www.modelingbridge.cc) · [⭐ Star the Repo](https://github.com/Xiaotian69/modelingbridge) · [简体中文](README.md)

*ModelingBridge · Created & Led by [@Xiaotian69](https://github.com/Xiaotian69)*

</div>
