import { useState, useRef } from "react";
import { useTodayStore } from "../store/todayStore";

export default function NotesSection() {
  const { dayPlan, updateNotes } = useTodayStore();
  const [expanded, setExpanded] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const notes = dayPlan?.notes ?? "";

  const handleChange = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      updateNotes(value);
    }, 500);
  };

  return (
    <section className="px-4 py-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm font-medium text-gray-400 uppercase tracking-wide hover:text-gray-300 transition-colors"
      >
        {expanded ? "▾ Notes" : "▸ Notes"}
      </button>

      {expanded && (
        <textarea
          defaultValue={notes}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Day notes..."
          rows={4}
          className="mt-2 w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded text-gray-200 placeholder-gray-500 resize-y"
        />
      )}
    </section>
  );
}
