import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useStore } from './store/useStore';
import TodayPage from './components/TodayPage';
import SettingsPage from './components/SettingsPage';
import QuickCapturePalette from './components/QuickCapturePalette';
import ExportDialog from './components/ExportDialog';

function App() {
  const { page, loadToday, loadSettings, setShowQuickCapture } = useStore();

  useEffect(() => {
    loadToday();
    loadSettings();
  }, [loadToday, loadSettings]);

  // In-window keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setShowQuickCapture(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setShowQuickCapture]);

  // Global shortcut event from Tauri backend
  useEffect(() => {
    const unlisten = listen('quick-capture', () => {
      setShowQuickCapture(true);
    });
    return () => { unlisten.then((fn) => fn()); };
  }, [setShowQuickCapture]);

  return (
    <div className="h-full bg-gray-900 text-gray-200">
      {page === 'today' ? <TodayPage /> : <SettingsPage />}
      <QuickCapturePalette />
      <ExportDialog />
    </div>
  );
}

export default App;
