import { useTodayStore } from "../store/todayStore";

const CONDITION_LABELS: Record<string, string> = {
  A: "Baseline",
  B: "Stim/No-ejac",
  C: "Stim/Ejac-allowed",
};

const CONDITION_COLORS: Record<string, string> = {
  A: "bg-blue-600",
  B: "bg-amber-600",
  C: "bg-rose-600",
};

export default function Header() {
  const { date, dayPlan, rollDice, setExportDialogOpen } = useTodayStore();

  const condition = dayPlan?.condition;
  const label = condition ? CONDITION_LABELS[condition] ?? condition : null;
  const color = condition ? CONDITION_COLORS[condition] ?? "bg-gray-600" : "";

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-gray-100">{date}</h1>
        {condition ? (
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium text-white ${color}`}
          >
            {condition}: {label}
          </span>
        ) : (
          <span className="text-xs text-gray-500">No condition</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={rollDice}
          className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
          title="Roll dice for today's condition"
        >
          🎲 Roll
        </button>
        <button
          onClick={() => setExportDialogOpen(true)}
          className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
        >
          Export
        </button>
      </div>
    </header>
  );
}
