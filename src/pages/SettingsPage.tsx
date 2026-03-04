import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { useTodayStore } from "../store/todayStore";

export default function SettingsPage() {
  const { setPage, setExportDialogOpen } = useTodayStore();
  const [version, setVersion] = useState<string>("");

  useEffect(() => {
    getVersion().then(setVersion).catch(() => setVersion("unknown"));
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPage("today")}
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            &larr; Back
          </button>
          <h1 className="text-lg font-semibold text-gray-100">Settings</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <section className="px-4 py-3 border-b border-gray-700">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-2">
            About
          </h2>
          <p className="text-sm text-gray-300">
            Lust Work v{version}
          </p>
        </section>

        <section className="px-4 py-3 border-b border-gray-700">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-2">
            Data
          </h2>
          <button
            onClick={() => setExportDialogOpen(true)}
            className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
          >
            Data Export
          </button>
        </section>
      </main>
    </div>
  );
}
