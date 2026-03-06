import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

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
      <label className="text-sm text-gray-300 w-24">{label}</label>
      <input
        type="range"
        min={1}
        max={7}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-blue-500"
      />
      <span className="text-sm text-white w-6 text-center">{value}</span>
    </div>
  );
}

export default function RatingsPanel() {
  const { ratings, setRatings } = useStore();
  const [efficiency, setEfficiency] = useState(ratings?.efficiency ?? 4);
  const [pleasure, setPleasure] = useState(ratings?.pleasure ?? 4);
  const [health, setHealth] = useState(ratings?.health ?? 4);
  const [showExtra, setShowExtra] = useState(false);
  const [sleepHours, setSleepHours] = useState(ratings?.sleep_hours ?? 7);
  const [sleepQuality, setSleepQuality] = useState(ratings?.sleep_quality ?? 4);
  const [exerciseMinutes, setExerciseMinutes] = useState(ratings?.exercise_minutes ?? 0);
  const [exerciseType, setExerciseType] = useState(ratings?.exercise_type ?? '');

  useEffect(() => {
    if (ratings) {
      setEfficiency(ratings.efficiency ?? 4);
      setPleasure(ratings.pleasure ?? 4);
      setHealth(ratings.health ?? 4);
      setSleepHours(ratings.sleep_hours ?? 7);
      setSleepQuality(ratings.sleep_quality ?? 4);
      setExerciseMinutes(ratings.exercise_minutes ?? 0);
      setExerciseType(ratings.exercise_type ?? '');
    }
  }, [ratings]);

  const save = () => {
    setRatings({
      efficiency,
      pleasure,
      health,
      sleep_hours: showExtra ? sleepHours : null,
      sleep_quality: showExtra ? sleepQuality : null,
      exercise_minutes: showExtra ? exerciseMinutes : null,
      exercise_type: showExtra && exerciseType ? exerciseType : null,
    });
  };

  return (
    <div className="p-4 border-b border-gray-700">
      <h3 className="text-sm font-medium text-gray-400 mb-3">Daily Ratings</h3>
      <div className="space-y-2">
        <RatingSlider label="Efficiency" value={efficiency} onChange={setEfficiency} />
        <RatingSlider label="Pleasure" value={pleasure} onChange={setPleasure} />
        <RatingSlider label="Health" value={health} onChange={setHealth} />
      </div>

      <button
        onClick={() => setShowExtra(!showExtra)}
        className="mt-2 text-xs text-gray-500 hover:text-gray-300"
      >
        {showExtra ? 'Hide' : 'Show'} Sleep & Exercise
      </button>

      {showExtra && (
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-300 w-24">Sleep (hrs)</label>
            <input
              type="number"
              min={0}
              max={24}
              step={0.5}
              value={sleepHours}
              onChange={(e) => setSleepHours(Number(e.target.value))}
              className="bg-gray-800 text-white rounded px-2 py-1 w-20 text-sm border border-gray-600"
            />
          </div>
          <RatingSlider label="Sleep Quality" value={sleepQuality} onChange={setSleepQuality} />
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-300 w-24">Exercise (min)</label>
            <input
              type="number"
              min={0}
              value={exerciseMinutes}
              onChange={(e) => setExerciseMinutes(Number(e.target.value))}
              className="bg-gray-800 text-white rounded px-2 py-1 w-20 text-sm border border-gray-600"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-300 w-24">Exercise Type</label>
            <input
              value={exerciseType}
              onChange={(e) => setExerciseType(e.target.value)}
              placeholder="e.g. running, yoga"
              className="bg-gray-800 text-white rounded px-2 py-1 flex-1 text-sm border border-gray-600 placeholder-gray-500"
            />
          </div>
        </div>
      )}

      <button
        onClick={save}
        className="mt-3 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm"
      >
        Save Ratings
      </button>
    </div>
  );
}
