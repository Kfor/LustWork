import { useState } from "react";
import { useStore } from "../store/useStore";

export default function ExportDialog({ onClose }: { onClose: () => void }) {
  const exportData = useStore((s) => s.exportData);
  const [range, setRange] = useState("today");
  const [format, setFormat] = useState("json");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExport = async () => {
    try {
      setError(null);
      const data = await exportData(range, format);
      setResult(data);
    } catch (e) {
      setError(String(e));
      setResult(null);
    }
  };

  const handleCopy = async () => {
    if (result) {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[var(--surface)] rounded-xl shadow-2xl p-4 space-y-3 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Export Data
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--text-dim)] hover:text-[var(--text)]"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-3">
          <div className="space-y-1">
            <label className="text-xs text-[var(--text-dim)]">Range</label>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="block text-sm bg-[var(--surface2)] text-[var(--text)] rounded px-2 py-1 border-none outline-none"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 days</option>
              <option value="all">All</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[var(--text-dim)]">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="block text-sm bg-[var(--surface2)] text-[var(--text)] rounded px-2 py-1 border-none outline-none"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleExport}
              className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Export
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-[var(--accent)]">Export failed: {error}</p>
        )}

        {result && (
          <div className="flex-1 overflow-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[var(--text-dim)]">Result</span>
              <button
                onClick={handleCopy}
                className="text-xs text-[var(--green)] hover:underline"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="text-xs bg-[var(--bg)] rounded p-2 overflow-auto max-h-64 whitespace-pre-wrap break-all">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
