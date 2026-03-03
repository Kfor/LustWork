import { useState, useEffect, useRef } from "react";
import { useTodayStore } from "../store/todayStore";

const TRIGGERS = [
  "mind_wander",
  "irritability",
  "task_start",
  "milestone_done",
  "break_time",
  "other",
];

const DURATION_PRESETS = [30, 60, 90];

function formatSec(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0
    ? `${m}:${String(sec).padStart(2, "0")}`
    : `${sec}s`;
}

export default function RewardPanel() {
  const { date, logEvent, rewardTimer, startRewardTimer, stopRewardTimer, tickRewardTimer } =
    useTodayStore();
  const [trigger, setTrigger] = useState("mind_wander");
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (rewardTimer.running) {
      intervalRef.current = window.setInterval(tickRewardTimer, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [rewardTimer.running, tickRewardTimer]);

  const logReward = async (level: number, durationSec?: number) => {
    await logEvent({
      date,
      event_type: "reward",
      level,
      trigger_type: trigger,
      duration_sec: durationSec ?? null,
    });
  };

  const handleLevelClick = async (level: number) => {
    if (level === 1 || level === 4) {
      await logReward(level);
    } else {
      // L2/L3: start timer on click
      handleTimerToggle(level);
    }
  };

  const handlePreset = async (level: number, sec: number) => {
    await logReward(level, sec);
  };

  const handleTimerToggle = (level: number) => {
    if (rewardTimer.running && rewardTimer.level === level) {
      const elapsed = stopRewardTimer();
      logReward(level, elapsed);
    } else {
      if (rewardTimer.running) stopRewardTimer();
      startRewardTimer(level);
    }
  };

  const logOtherEvent = async (eventType: string) => {
    await logEvent({ date, event_type: eventType });
  };

  return (
    <section className="px-4 py-3 border-b border-gray-700">
      <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-2">
        Reward / Events
      </h2>

      {/* Trigger selector */}
      <div className="mb-3">
        <select
          value={trigger}
          onChange={(e) => setTrigger(e.target.value)}
          className="w-full px-2 py-1.5 text-sm bg-gray-800 border border-gray-600 rounded text-gray-200"
        >
          {TRIGGERS.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {/* L1-L4 buttons */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[1, 2, 3, 4].map((level) => (
          <button
            key={level}
            onClick={() => handleLevelClick(level)}
            className={`py-2 text-sm font-medium rounded transition-colors ${
              rewardTimer.running && rewardTimer.level === level
                ? "bg-amber-500 text-white"
                : "bg-gray-700 hover:bg-gray-600 text-gray-200"
            }`}
          >
            L{level}
          </button>
        ))}
      </div>

      {/* L2/L3 duration presets + timer */}
      {[2, 3].map((level) => (
        <div key={level} className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-500 w-6">L{level}</span>
          {DURATION_PRESETS.map((sec) => (
            <button
              key={sec}
              onClick={() => handlePreset(level, sec)}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            >
              {sec}s
            </button>
          ))}
          <button
            onClick={() => handleTimerToggle(level)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              rewardTimer.running && rewardTimer.level === level
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-emerald-700 hover:bg-emerald-600 text-white"
            }`}
          >
            {rewardTimer.running && rewardTimer.level === level
              ? `Stop (${formatSec(rewardTimer.elapsed)})`
              : "Start"}
          </button>
        </div>
      ))}

      {/* Other event buttons */}
      <div className="flex flex-wrap gap-2 mt-2">
        {[
          { type: "ejaculation", label: "Ejac" },
          { type: "discomfort", label: "Discomfort" },
          { type: "lube", label: "Lube" },
          { type: "note", label: "Note" },
        ].map((evt) => (
          <button
            key={evt.type}
            onClick={() => logOtherEvent(evt.type)}
            className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          >
            {evt.label}
          </button>
        ))}
      </div>
    </section>
  );
}
