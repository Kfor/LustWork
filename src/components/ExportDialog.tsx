import { useState } from 'react';
import { useStore } from '../store/useStore';

export default function ExportDialog() {
  const { showExportDialog, setShowExportDialog, exportData } = useStore();
  const [range, setRange] = useState('today');
  const [format, setFormat] = useState('json');
  const [result, setResult] = useState<string | null>(null);

  if (!showExportDialog) return null;

  const handleExport = async () => {
    const data = await exportData(range, format);
    setResult(data);
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
    }
  };

  const close = () => {
    setShowExportDialog(false);
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60" onClick={close}>
      <div
        className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 w-[600px] max-h-[80vh] flex flex-col p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Export Data</h2>
          <button onClick={close} className="text-gray-400 hover:text-white text-xl">&times;</button>
        </div>

        <div className="flex gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Range</label>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="bg-gray-800 text-white rounded px-3 py-1.5 text-sm border border-gray-600"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="all">All Data</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="bg-gray-800 text-white rounded px-3 py-1.5 text-sm border border-gray-600"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleExport}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm"
            >
              Export
            </button>
          </div>
        </div>

        {result && (
          <>
            <div className="flex-1 overflow-auto mb-2">
              <pre className="bg-gray-800 text-gray-300 p-3 rounded text-xs whitespace-pre-wrap break-all max-h-[400px] overflow-auto">
                {result}
              </pre>
            </div>
            <button
              onClick={handleCopy}
              className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm self-end"
            >
              Copy to Clipboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
