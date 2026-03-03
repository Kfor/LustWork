import { useState, useEffect } from "react";
import { useStore } from "../store/useStore";

export default function RatingsPanel() {
  const ratings = useStore((s) => s.ratings);
  const setRatings = useStore((s) => s.setRatings);
  const [expanded, setExpanded] = useState(false);

  const [efficiency, setEfficiency] = useState<number>(ratings?.efficiency ?? 0);
  const [pleasure, setPleasure] = useState<number>(ratings?.pleasure ?? 0);
  const [health, setHealth] = useState<number>(ratings?.health ?? 0);
  const [sleepHours, setSleepHours] = useState<string>(
    ratings?.sleep_hours?.toString() ?? ""
  );
  const [sleepQuality, setSleepQuality] = useState<number>(
    ratings?.sleep_quality ?? 0
  );
  const [exerciseMinutes, setExerciseMinutes] = useState<string>(
    ratings?.exercise_minutes?.toString() ?? ""
  );
  const [exerciseType, setExerciseType] = useState<string>(
    ratings?.exercise_type ?? ""
  );

  useEffect(() => {
    if (ratings) {
      setEfficiency(ratings.efficiency ?? 0);
      setPleasure(ratings.pleasure ?? 0);
      setHealth(ratings.health ?? 0);
      setSleepHours(ratings.sleep_hours?.toString() ?? "");
      setSleepQuality(ratings.sleep_quality ?? 0);
      setExerciseMinutes(ratings.exercise_minutes?.toString() ?? "");
      setExerciseType(ratings.exercise_type ?? "");
    }
  }, [ratings]);

  const save = async () => {
    await setRatings({
      efficiency: efficiency || undefined,
      pleasure: pleasure || undefined,
      health: health || undefined,
      sleep_hours: sleepHours ? parseFloat(sleepHours) : undefined,
      sleep_quality: sleepQuality || undefined,
      exercise_minutes: exerciseMinutes ? parseInt(exerciseMinutes) : undefined,
      exercise_type: exerciseType || undefined,
    });
  };

  const RatingRow = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
  }) => (
    <div className="flex items-center gap-2">
      <span className="text-sm w-20 text-[var(--text-dim)]">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
              n === value
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--surface2)] hover:bg-[var(--accent)] hover:opacity-70"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="rounded-xl bg-[var(--surface)] p-4 space-y-3">
      <h2 className="text-sm font-semibold text-[var(--text-dim)] uppercase tracking-wide">
        Daily Ratings
      </h2>

      <RatingRow label="Efficiency" value={efficiency} onChange={setEfficiency} />
      <RatingRow label="Pleasure" value={pleasure} onChange={setPleasure} />
      <RatingRow label="Health" value={health} onChange={setHealth} />

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
      >
        {expanded ? "▼" : "▶"} Sleep & Exercise
      </button>

      {expanded && (
        <div className="space-y-2 pl-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--text-dim)] w-28">
              Sleep hours
            </label>
            <input
              type="number"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              className="w-20 px-2 py-1 rounded text-xs bg-[var(--surface2)] text-[var(--text)] border-none outline-none"
            />
          </div>
          <RatingRow
            label="Sleep quality"
            value={sleepQuality}
            onChange={setSleepQuality}
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--text-dim)] w-28">
              Exercise min
            </label>
            <input
              type="number"
              value={exerciseMinutes}
              onChange={(e) => setExerciseMinutes(e.target.value)}
              className="w-20 px-2 py-1 rounded text-xs bg-[var(--surface2)] text-[var(--text)] border-none outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--text-dim)] w-28">
              Exercise type
            </label>
            <input
              type="text"
              value={exerciseType}
              onChange={(e) => setExerciseType(e.target.value)}
              placeholder="e.g. walking, yoga"
              className="flex-1 px-2 py-1 rounded text-xs bg-[var(--surface2)] text-[var(--text)] placeholder:text-[var(--text-dim)] border-none outline-none"
            />
          </div>
        </div>
      )}

      <button
        onClick={save}
        className="px-4 py-1.5 rounded-lg bg-[var(--surface2)] text-sm font-medium hover:bg-[var(--green)] hover:text-[var(--bg)] transition-colors"
      >
        Save Ratings
      </button>
    </div>
  );
}
