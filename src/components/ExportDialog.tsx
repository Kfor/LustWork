import { useState } from "react";
import { useTodayStore } from "../store/todayStore";

export default function ExportDialog() {
  const { exportDialogOpen, setExportDialogOpen, exportData } =
    useTodayStore();
  const [range, setRange] = useState("today");
  const [format, setFormat] = useState("json");
  const [status, setStatus] = useState<"idle" | "exporting" | "done" | "error">(
    "idle"
  );

  if (!exportDialogOpen) return null;

  const downloadBlob = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setStatus("exporting");
    try {
      const data = await exportData(range, format);
      if (format === "json") {
        downloadBlob(data, `lustwork-export-${range}.json`, "application/json");
      } else {
        // CSV format: backend returns JSON map of { "filename.csv": "csv content", ... }
        const csvMap: Record<string, string> = JSON.parse(data);
        for (const [filename, content] of Object.entries(csvMap)) {
          downloadBlob(content, `lustwork-${range}-${filename}`, "text/csv");
        }
      }
      setStatus("done");
      setTimeout(() => {
        setExportDialogOpen(false);
        setStatus("idle");
      }, 1000);
    } catch (err) {
      console.error("Export failed:", err);
      setStatus("error");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={() => {
        setExportDialogOpen(false);
        setStatus("idle");
      }}
    >
      <div
        className="w-full max-w-sm bg-gray-800 rounded-lg shadow-2xl border border-gray-600 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-100 mb-4">
          Export Data
        </h3>

        <div className="mb-3">
          <label className="block text-sm text-gray-400 mb-1">Range</label>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-gray-900 border border-gray-600 rounded text-gray-200"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="all">All data</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Format</label>
          <div className="flex gap-3">
            {(["json", "csv"] as const).map((f) => (
              <label key={f} className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="format"
                  value={f}
                  checked={format === f}
                  onChange={() => setFormat(f)}
                  className="accent-indigo-500"
                />
                <span className="text-sm text-gray-300 uppercase">{f}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setExportDialogOpen(false);
              setStatus("idle");
            }}
            className="flex-1 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={status === "exporting"}
            className="flex-1 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded transition-colors"
          >
            {status === "exporting"
              ? "Exporting..."
              : status === "done"
                ? "Done!"
                : status === "error"
                  ? "Failed"
                  : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
}
