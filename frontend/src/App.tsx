import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./layouts/Layout";
import { AboutPage } from "./pages/About";
import { CalendarPage } from "./pages/Calendar";
import { CaseDetailPage } from "./pages/CaseDetail";
import { CasesPage } from "./pages/Cases";
import { FeedbackPage } from "./pages/Feedback";
import { HomePage } from "./pages/Home";
import { LearnPage } from "./pages/Learn";
import { QuestPage } from "./pages/Quest";
import { RecordsPage } from "./pages/Records";
import { ResourcesPage } from "./pages/Resources";
import { ToolsPage } from "./pages/Tools";
import { WorkbenchPage } from "./pages/Workbench";

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
