import { useState } from "react";
import { useStore } from "../store/useStore";
import { TRIGGERS, EVENT_TYPES } from "../store/types";

const DURATION_PRESETS = [30, 60, 90];

export default function RewardPanel() {
  const date = useStore((s) => s.date);
  const logEvent = useStore((s) => s.logEvent);
  const events = useStore((s) => s.events);
  const [trigger, setTrigger] = useState<string>("other");
  const [timerLevel, setTimerLevel] = useState<number | null>(null);
  const [timerStart, setTimerStart] = useState<number | null>(null);

  const quickLog = async (level: number, durationSec?: number) => {
    await logEvent({
      date,
      event_type: "reward",
      level,
      trigger_type: trigger,
      duration_sec: durationSec,
    });
  };

  const startTimer = (level: number) => {
    setTimerLevel(level);
    setTimerStart(Math.floor(Date.now() / 1000));
  };

  const stopTimer = async () => {
    if (timerLevel !== null && timerStart !== null) {
      const dur = Math.floor(Date.now() / 1000) - timerStart;
      await quickLog(timerLevel, dur);
    }
    setTimerLevel(null);
    setTimerStart(null);
  };

  const logOther = async (eventType: string) => {
    await logEvent({ date, event_type: eventType, trigger_type: trigger });
  };

  const todayRewards = events.filter((e) => e.event_type === "reward");

  return (
    <div className="rounded-xl bg-[var(--surface)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-dim)] uppercase tracking-wide">
          Events
        </h2>
        <span className="text-xs text-[var(--text-dim)]">
          {todayRewards.length} reward{todayRewards.length !== 1 ? "s" : ""} today
        </span>
      </div>

      {/* L1-L4 quick buttons */}
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((level) => (
          <button
            key={level}
            onClick={() => quickLog(level)}
            className="py-2 rounded-lg bg-[var(--surface2)] text-sm font-medium hover:bg-[var(--accent)] transition-colors"
          >
            L{level}
          </button>
        ))}
      </div>

      {/* Duration presets for L2/L3 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-[var(--text-dim)]">L2/L3 +sec:</span>
        {DURATION_PRESETS.map((sec) => (
          <button
            key={sec}
            onClick={() => quickLog(2, sec)}
            className="px-2 py-1 rounded text-xs bg-[var(--surface2)] hover:bg-[var(--accent)] transition-colors"
          >
            +{sec}s
          </button>
        ))}
        {timerStart === null ? (
          <>
            <button
              onClick={() => startTimer(2)}
              className="px-2 py-1 rounded text-xs bg-[var(--green)] text-[var(--bg)] font-medium"
            >
              L2 Timer
            </button>
            <button
              onClick={() => startTimer(3)}
              className="px-2 py-1 rounded text-xs bg-[var(--green)] text-[var(--bg)] font-medium"
            >
              L3 Timer
            </button>
          </>
        ) : (
          <button
            onClick={stopTimer}
            className="px-2 py-1 rounded text-xs bg-[var(--accent)] font-medium animate-pulse"
          >
            Stop L{timerLevel} Timer
          </button>
        )}
      </div>

      {/* Trigger selector */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-[var(--text-dim)]">Trigger:</label>
        <select
          value={trigger}
          onChange={(e) => setTrigger(e.target.value)}
          className="text-xs bg-[var(--surface2)] text-[var(--text)] rounded px-2 py-1 border-none outline-none"
        >
          {TRIGGERS.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Other event types */}
      <div className="flex gap-2 flex-wrap">
        {EVENT_TYPES.filter((t) => t !== "reward").map((et) => (
          <button
            key={et}
            onClick={() => logOther(et)}
            className="px-2 py-1 rounded text-xs bg-[var(--surface2)] hover:bg-[var(--yellow)] hover:text-[var(--bg)] transition-colors"
          >
            {et}
          </button>
        ))}
      </div>
    </div>
  );
}
