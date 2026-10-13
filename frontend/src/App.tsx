import { RouteScroll } from "./components/motion/RouteScroll";
import { lazy, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { legacyTarget } from "./content/skills/legacy";
import { Layout } from "./layouts/Layout";
import { HomePage } from "./pages/Home";
import { TrialGate } from "./trial/TrialGate";
import { PrefsProvider } from "./app/PrefsContext";
import { signalAppReady } from "./splash/signal";

const AboutPage = lazy(() =>
  import("./pages/About").then((m) => ({ default: m.AboutPage })),
);
const CalendarPage = lazy(() =>
  import("./pages/Calendar").then((m) => ({ default: m.CalendarPage })),
);
const CaseDetailPage = lazy(() =>
  import("./pages/CaseDetail").then((m) => ({ default: m.CaseDetailPage })),
);
const CasesPage = lazy(() =>
  import("./pages/Cases").then((m) => ({ default: m.CasesPage })),
);
const FeedbackPage = lazy(() =>
  import("./pages/Feedback").then((m) => ({ default: m.FeedbackPage })),
);
const LearnPage = lazy(() =>
  import("./pages/Learn").then((m) => ({ default: m.LearnPage })),
);
const CoursePage = lazy(() => import("./pages/Course").then(m => ({ default: m.CoursePage })));
const AhpCoursePage = lazy(() => import("./pages/AhpCourse").then((m) => ({ default: m.AhpCoursePage })));
const LpLabPage = lazy(() => import("./pages/LpLab").then((m) => ({ default: m.LpLabPage })));
const PracticePage = lazy(() => import("./pages/Practice").then(m => ({ default: m.PracticePage })));
const ModelReferencePage = lazy(() => import("./pages/ModelReference").then(m => ({ default: m.ModelReferencePage })));
const QuestPage = lazy(() =>
  import("./pages/Quest").then((m) => ({ default: m.QuestPage })),
);
const RecordsPage = lazy(() =>
  import("./pages/Records").then((m) => ({ default: m.RecordsPage })),
);
const ResourcesPage = lazy(() =>
  import("./pages/Resources").then((m) => ({ default: m.ResourcesPage })),
);
const SkillsPage = lazy(() =>
  import("./pages/Skills").then((m) => ({ default: m.SkillsPage })),
);
const ToolsPage = lazy(() =>
  import("./pages/Tools").then((m) => ({ default: m.ToolsPage })),
);
const WorkbenchPage = lazy(() =>
  import("./pages/Workbench").then((m) => ({ default: m.WorkbenchPage })),
);
const LibraryLayout = lazy(() =>
  import("./pages/LibraryLayout").then((m) => ({ default: m.LibraryLayout })),
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFound").then((m) => ({ default: m.NotFoundPage })),
);

/** Route table, exported so tests can mount it in a MemoryRouter. Old URLs keep working. */
/** 旧提示词链接 → 对应技能；保留七关的返回地址。 */
function LegacyPromptRedirect() {
  const { promptId } = useParams();
  const { search } = useLocation();
  const target = legacyTarget(promptId);
  const back = new URLSearchParams(search).get("back");
  const extra = back ? `${target.includes("?") ? "&" : "?"}back=${encodeURIComponent(back)}` : "";
  return <Navigate to={`${target}${extra}`} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        {/* 精讲 */}
        <Route path="learn" element={<LearnPage />} />
        <Route path="learn/linear-programming" element={<CoursePage />} />
        <Route path="learn/ahp" element={<AhpCoursePage />} />
        <Route path="learn/linear-programming/lab" element={<LpLabPage />} />
        <Route path="learn/reference" element={<ModelReferencePage />} />
        {/* 刷题 */}
        <Route path="practice" element={<Navigate to="/practice/linear-programming" replace />} />
        <Route path="practice/linear-programming" element={<PracticePage />} />
        <Route path="practice/linear-programming/:exerciseId" element={<PracticePage />} />
        <Route path="practice/ahp" element={<PracticePage topic="ahp" />} />
        <Route path="practice/ahp/:exerciseId" element={<PracticePage topic="ahp" />} />
        {/* 实战 */}
        <Route path="quest" element={<QuestPage />} />
        <Route path="cases" element={<CasesPage />} />
        <Route path="cases/:slug" element={<CaseDetailPage />} />
        {/* 资料 */}
        <Route path="library" element={<LibraryLayout />}>
          <Route index element={<ResourcesPage />} />
          <Route path="skills" element={<SkillsPage />} />
          <Route path="skills/:skillId" element={<SkillsPage />} />
          {/* V2.0/V2.1 提示词库的旧链接 → 对应技能 */}
          <Route path="prompts" element={<LegacyPromptRedirect />} />
          <Route path="prompts/:promptId" element={<LegacyPromptRedirect />} />
          <Route path="tools" element={<ToolsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
        </Route>
        <Route path="resources" element={<Navigate to="/library" replace />} />
        <Route path="tools" element={<Navigate to="/library/tools" replace />} />
        <Route path="calendar" element={<Navigate to="/library/calendar" replace />} />
        {/* 学习记录与其他 */}
        <Route path="records" element={<RecordsPage />} />
        <Route path="workbench" element={<WorkbenchPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  // Lets the inline splash leave once the real page has committed (never before).
  useEffect(() => signalAppReady(), []);
  return (
    <BrowserRouter>
      <PrefsProvider>
        <TrialGate>
          <RouteScroll />
          <AppRoutes />
        </TrialGate>
      </PrefsProvider>
    </BrowserRouter>
  );
}
