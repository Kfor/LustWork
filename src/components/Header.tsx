import { useStore } from "../store/useStore";
import { CONDITIONS } from "../store/types";

export default function Header({ onExport }: { onExport: () => void }) {
  const date = useStore((s) => s.date);
  const dayPlan = useStore((s) => s.dayPlan);
  const rollDice = useStore((s) => s.rollDice);

  const condLabel = dayPlan
    ? CONDITIONS.find((c) => c.value === dayPlan.condition)?.label ??
      dayPlan.condition
    : "—";

  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Lust Work</h1>
        <p className="text-sm text-[var(--text-dim)]">{date}</p>
      </div>

      <div className="flex items-center gap-2">
        {dayPlan ? (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-[var(--surface2)] text-[var(--green)]">
            {condLabel}
          </span>
        ) : (
          <span className="text-sm text-[var(--text-dim)]">No condition</span>
        )}
        <button
          onClick={rollDice}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--accent)] hover:opacity-90 transition-opacity"
          title="Roll dice for today's condition"
        >
          🎲 Roll
        </button>
        <button
          onClick={onExport}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--surface2)] hover:opacity-90 transition-opacity"
          title="Export data"
        >
          Export
        </button>
      </div>
    </div>
  );
}
