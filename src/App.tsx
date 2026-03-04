import { useEffect } from "react";
import { useTodayStore } from "./store/todayStore";
import TodayPage from "./pages/TodayPage";
import SettingsPage from "./pages/SettingsPage";
import QuickCapturePalette from "./components/QuickCapturePalette";
import ExportDialog from "./components/ExportDialog";

export default function App() {
  const { loading, loadToday, page } = useTodayStore();

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Initializing...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {page === "settings" ? <SettingsPage /> : <TodayPage />}
      <QuickCapturePalette />
      <ExportDialog />
    </div>
  );
}
