import { useState, useRef, useCallback } from "react";
import { useTodayStore } from "../store/todayStore";
import type { RatingsPayload } from "../types";

function RatingSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-300 w-20">{label}</span>
      <input
        type="range"
        min={1}
        max={7}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-indigo-500"
      />
      <span className="text-sm text-gray-400 w-4 text-right">{value}</span>
    </div>
  );
}

export default function RatingsPanel() {
  const { ratings, setRatings } = useTodayStore();
  const [expanded, setExpanded] = useState(false);

  // Local state for responsive sliders, debounced save to backend
  const [local, setLocal] = useState({
    efficiency: ratings?.efficiency ?? 4,
    pleasure: ratings?.pleasure ?? 4,
    health: ratings?.health ?? 4,
    sleep_hours: ratings?.sleep_hours ?? 7,
    sleep_quality: ratings?.sleep_quality ?? 4,
    exercise_minutes: ratings?.exercise_minutes ?? 0,
    exercise_type: ratings?.exercise_type ?? "",
  });

  const debounceRef = useRef<number | null>(null);

  const debouncedSave = useCallback(
    (payload: RatingsPayload) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        setRatings(payload);
      }, 400);
    },
    [setRatings]
  );

  const update = (field: string, value: number | string) => {
    const next = { ...local, [field]: value };
    setLocal(next);
    debouncedSave({
      efficiency: next.efficiency,
      pleasure: next.pleasure,
      health: next.health,
      sleep_hours: next.sleep_hours,
      sleep_quality: next.sleep_quality,
      exercise_minutes: next.exercise_minutes,
      exercise_type: next.exercise_type,
    });
  };

  return (
    <section className="px-4 py-3 border-b border-gray-700">
      <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-2">
        Ratings (1-7)
      </h2>

      <div className="space-y-2">
        <RatingSlider
          label="Efficiency"
          value={local.efficiency}
          onChange={(v) => update("efficiency", v)}
        />
        <RatingSlider
          label="Pleasure"
          value={local.pleasure}
          onChange={(v) => update("pleasure", v)}
        />
        <RatingSlider
          label="Health"
          value={local.health}
          onChange={(v) => update("health", v)}
        />
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        {expanded ? "▾ Hide details" : "▸ Sleep & Exercise"}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 pl-2 border-l border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 w-28">Sleep hours</span>
            <input
              type="number"
              min={0}
              max={24}
              step={0.5}
              value={local.sleep_hours}
              onChange={(e) => update("sleep_hours", Number(e.target.value))}
              className="w-20 px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-gray-200"
            />
          </div>
          <RatingSlider
            label="Sleep quality"
            value={local.sleep_quality}
            onChange={(v) => update("sleep_quality", v)}
          />
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 w-28">Exercise (min)</span>
            <input
              type="number"
              min={0}
              max={300}
              value={local.exercise_minutes}
              onChange={(e) =>
                update("exercise_minutes", Number(e.target.value))
              }
              className="w-20 px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-gray-200"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 w-28">Exercise type</span>
            <input
              type="text"
              value={local.exercise_type}
              onChange={(e) => update("exercise_type", e.target.value)}
              placeholder="e.g. running, yoga"
              className="flex-1 px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-gray-200 placeholder-gray-500"
            />
          </div>
        </div>
      )}
    </section>
  );
}
