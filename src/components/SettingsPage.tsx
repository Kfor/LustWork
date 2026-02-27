import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';

const DEFAULT_SETTINGS: Record<string, string> = {
  work_minutes: '45',
  break_minutes: '5',
  shortcut: 'CmdOrCtrl+Shift+L',
};

export default function SettingsPage() {
  const { settings, loadSettings, updateSetting, setPage, openDataDir } = useStore();

  const [workMin, setWorkMin] = useState(settings['work_minutes'] || DEFAULT_SETTINGS.work_minutes);
  const [breakMin, setBreakMin] = useState(settings['break_minutes'] || DEFAULT_SETTINGS.break_minutes);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    setWorkMin(settings['work_minutes'] || DEFAULT_SETTINGS.work_minutes);
    setBreakMin(settings['break_minutes'] || DEFAULT_SETTINGS.break_minutes);
  }, [settings]);

  const save = async () => {
    await updateSetting('work_minutes', workMin);
    await updateSetting('break_minutes', breakMin);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <button
          onClick={() => setPage('today')}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
        >
          Back
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section>
          <h2 className="text-sm font-medium text-gray-400 mb-3">Timer Defaults</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-300 w-32">Work (minutes)</label>
              <input
                type="number"
                min={1}
                value={workMin}
                onChange={(e) => setWorkMin(e.target.value)}
                className="bg-gray-800 text-white rounded px-3 py-1.5 w-24 text-sm border border-gray-600"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-300 w-32">Break (minutes)</label>
              <input
                type="number"
                min={1}
                value={breakMin}
                onChange={(e) => setBreakMin(e.target.value)}
                className="bg-gray-800 text-white rounded px-3 py-1.5 w-24 text-sm border border-gray-600"
              />
            </div>
          </div>
          <button
            onClick={save}
            className="mt-3 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm"
          >
            Save
          </button>
        </section>

        <section>
          <h2 className="text-sm font-medium text-gray-400 mb-3">Conditions</h2>
          <ul className="text-sm text-gray-300 space-y-1">
            <li><strong>A</strong> — Baseline</li>
            <li><strong>B</strong> — Stim/No-ejac</li>
            <li><strong>C</strong> — Stim/Ejac-allowed</li>
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-medium text-gray-400 mb-3">Quick Capture</h2>
          <p className="text-sm text-gray-300">Shortcut: <kbd className="bg-gray-700 px-1.5 py-0.5 rounded text-xs">Cmd/Ctrl+Shift+L</kbd></p>
        </section>

        <section>
          <h2 className="text-sm font-medium text-gray-400 mb-3">Data</h2>
          <button
            onClick={openDataDir}
            className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
          >
            Open Data Directory
          </button>
        </section>

        <section className="pb-8">
          <p className="text-xs text-gray-500 italic">
            Lust Work is a self-recording and experimentation tool. It does not provide medical advice.
            Please prioritize bodily discomfort signals and decide whether to pause on your own.
          </p>
        </section>
      </div>
    </div>
  );
}
