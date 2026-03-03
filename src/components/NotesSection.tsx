import { useState, useEffect } from "react";
import { useStore } from "../store/useStore";

export default function NotesSection() {
  const dayPlan = useStore((s) => s.dayPlan);
  const setDayNotes = useStore((s) => s.setDayNotes);
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(dayPlan?.notes ?? "");

  useEffect(() => {
    setNotes(dayPlan?.notes ?? "");
  }, [dayPlan?.notes]);

  const save = async () => {
    await setDayNotes(notes);
  };

  return (
    <div className="rounded-xl bg-[var(--surface)] p-4 space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm font-semibold text-[var(--text-dim)] uppercase tracking-wide hover:text-[var(--text)] transition-colors w-full text-left"
      >
        {expanded ? "▼" : "▶"} Notes
      </button>

      {expanded && (
        <div className="space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={save}
            rows={4}
            placeholder="Daily notes…"
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] border-none outline-none resize-y"
          />
        </div>
      )}
    </div>
  );
}
