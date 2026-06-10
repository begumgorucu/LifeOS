/**
 * Uygulamanın router'ı.
 *
 * Tüm sayfalar Layout'un (Sidebar + Topbar + Outlet) altında render olur.
 * Her path bir component'a denk gelir. Sıraya değil, parent-child yapısına
 * göre okunur — Layout her sayfanın ortak şablonu.
 */
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import AreasPage from "@/pages/Areas";
import AreaDetailPage from "@/pages/AreaDetail";
import CalendarPage from "@/pages/Calendar";
import DashboardPage from "@/pages/Dashboard";
import TasksPage from "@/pages/Tasks";
import DailyPoolPage from "@/pages/DailyPool";
import ProjectsPage from "@/pages/Projects";
import ProjectDetailPage from "@/pages/ProjectDetail";
import VisionBoardPage from "@/pages/VisionBoard";
import StatsPage from "@/pages/Stats";
import SettingsPage from "@/pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/areas" element={<AreasPage />} />
          <Route path="/areas/:areaId" element={<AreaDetailPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/pool" element={<DailyPoolPage />} />
          <Route path="/visions" element={<VisionBoardPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
