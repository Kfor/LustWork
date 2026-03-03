import { useEffect } from "react";
import { useStore } from "./store/useStore";
import Header from "./components/Header";
import WorkTimer from "./components/WorkTimer";
import RewardPanel from "./components/RewardPanel";
import TaskList from "./components/TaskList";
import RatingsPanel from "./components/RatingsPanel";
import NotesSection from "./components/NotesSection";
import QuickCapturePalette from "./components/QuickCapturePalette";
import ExportDialog from "./components/ExportDialog";
import { useState } from "react";

export default function App() {
  const loadToday = useStore((s) => s.loadToday);
  const quickCaptureOpen = useStore((s) => s.quickCaptureOpen);
  const setQuickCaptureOpen = useStore((s) => s.setQuickCaptureOpen);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  // Global keyboard shortcut for Quick Capture
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "L") {
        e.preventDefault();
        setQuickCaptureOpen(!quickCaptureOpen);
      }
      if (e.key === "Escape" && quickCaptureOpen) {
        setQuickCaptureOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [quickCaptureOpen, setQuickCaptureOpen]);

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto space-y-4">
      <Header onExport={() => setExportOpen(true)} />
      <WorkTimer />
      <RewardPanel />
      <TaskList />
      <RatingsPanel />
      <NotesSection />

      {quickCaptureOpen && <QuickCapturePalette />}
      {exportOpen && <ExportDialog onClose={() => setExportOpen(false)} />}

      <footer className="text-center text-xs text-[var(--text-dim)] pb-4 pt-2">
        Lust Work 是自我记录与实验工具，不提供医疗建议；请优先关注身体不适信号并自行决定是否暂停。
      </footer>
    </div>
  );
}
