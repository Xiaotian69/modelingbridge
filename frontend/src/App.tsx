import { RouteScroll } from "./components/motion/RouteScroll";
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./layouts/Layout";
import { PageErrorBoundary } from "./components/ui/PageErrorBoundary";
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
const PromptsPage = lazy(() =>
  import("./pages/Prompts").then((m) => ({ default: m.PromptsPage })),
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
const ChallengePage = lazy(() =>
  import("./challenge/ChallengePage").then((m) => ({ default: m.ChallengePage })),
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFound").then((m) => ({ default: m.NotFoundPage })),
);

/** Route table, exported so tests can mount it in a MemoryRouter. Old URLs keep working. */
export function AppRoutes() {
  return (
    <Routes>
      {/* 招新挑战：独立全屏页面，不套站点导航 */}
      <Route
        path="challenge"
        element={
          <Suspense fallback={null}>
            <PageErrorBoundary>
              <ChallengePage />
            </PageErrorBoundary>
          </Suspense>
        }
      />
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        {/* 精讲 */}
        <Route path="learn" element={<LearnPage />} />
        <Route path="learn/linear-programming" element={<CoursePage />} />
        <Route path="learn/reference" element={<ModelReferencePage />} />
        {/* 刷题 */}
        <Route path="practice" element={<Navigate to="/practice/linear-programming" replace />} />
        <Route path="practice/linear-programming" element={<PracticePage />} />
        <Route path="practice/linear-programming/:exerciseId" element={<PracticePage />} />
        {/* 实战 */}
        <Route path="quest" element={<QuestPage />} />
        <Route path="cases" element={<CasesPage />} />
        <Route path="cases/:slug" element={<CaseDetailPage />} />
        {/* 资料 */}
        <Route path="library" element={<LibraryLayout />}>
          <Route index element={<ResourcesPage />} />
          <Route path="prompts" element={<PromptsPage />} />
          <Route path="prompts/:promptId" element={<PromptsPage />} />
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
