import { useStore } from '../store/useStore';
import { CONDITION_LABELS } from '../types';

export default function Header() {
  const { date, dayPlan, rollDayPlan, setShowExportDialog, setPage } = useStore();

  const conditionColor: Record<string, string> = {
    A: 'bg-gray-500',
    B: 'bg-blue-500',
    C: 'bg-purple-500',
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-700">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-white">Lust Work</h1>
        <span className="text-gray-400">{date}</span>
        {dayPlan ? (
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium text-white ${conditionColor[dayPlan.condition] || 'bg-gray-600'}`}
          >
            {dayPlan.condition} — {CONDITION_LABELS[dayPlan.condition] || dayPlan.condition}
          </span>
        ) : (
          <button
            onClick={rollDayPlan}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-sm"
          >
            Roll Dice
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowExportDialog(true)}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
        >
          Export
        </button>
        <button
          onClick={() => setPage('settings')}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
        >
          Settings
        </button>
      </div>
    </div>
  );
}
