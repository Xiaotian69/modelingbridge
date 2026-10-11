import { RouteScroll } from "./components/motion/RouteScroll";
import { lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./layouts/Layout";
import { HomePage } from "./pages/Home";
import { TrialGate } from "./trial/TrialGate";

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
const QuestPage = lazy(() =>
  import("./pages/Quest").then((m) => ({ default: m.QuestPage })),
);
const RecordsPage = lazy(() =>
  import("./pages/Records").then((m) => ({ default: m.RecordsPage })),
);
const ResourcesPage = lazy(() =>
  import("./pages/Resources").then((m) => ({ default: m.ResourcesPage })),
);
const ToolsPage = lazy(() =>
  import("./pages/Tools").then((m) => ({ default: m.ToolsPage })),
);
const WorkbenchPage = lazy(() =>
  import("./pages/Workbench").then((m) => ({ default: m.WorkbenchPage })),
);

export default function App() {
  return (
    <BrowserRouter>
      <TrialGate>
        <RouteScroll />
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="quest" element={<QuestPage />} />
            <Route path="learn" element={<LearnPage />} />
            <Route path="workbench" element={<WorkbenchPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="cases" element={<CasesPage />} />
            <Route path="cases/:slug" element={<CaseDetailPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="tools" element={<ToolsPage />} />
            <Route path="records" element={<RecordsPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </TrialGate>
    </BrowserRouter>
  );
}
