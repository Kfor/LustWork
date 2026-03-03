import { useEffect, useRef } from "react";
import { useTodayStore } from "../store/todayStore";

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function WorkTimer() {
  const { timer, workBlocks, startWorkBlock, stopWorkBlock, tickTimer } =
    useTodayStore();
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (timer.running) {
      intervalRef.current = window.setInterval(tickTimer, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timer.running, tickTimer]);

  const remaining =
    timer.plannedSeconds !== null
      ? Math.max(0, timer.plannedSeconds - timer.elapsed)
      : null;
  const overtime =
    timer.plannedSeconds !== null && timer.elapsed > timer.plannedSeconds;

  // Calculate daily totals from completed blocks
  const workMins = workBlocks
    .filter((b) => b.kind === "work" && b.end_ts !== null)
    .reduce((sum, b) => sum + Math.floor((b.end_ts! - b.start_ts) / 60), 0);
  const breakMins = workBlocks
    .filter((b) => b.kind === "break" && b.end_ts !== null)
    .reduce((sum, b) => sum + Math.floor((b.end_ts! - b.start_ts) / 60), 0);

  return (
    <section className="px-4 py-3 border-b border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
          Timer
        </h2>
        <div className="flex gap-3 text-xs text-gray-500">
          <span>Work: {workMins}m</span>
          <span>Break: {breakMins}m</span>
        </div>
      </div>

      {timer.running ? (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-mono tabular-nums ${
                  overtime ? "text-red-400" : "text-gray-100"
                }`}
              >
                {remaining !== null ? formatTime(remaining) : formatTime(timer.elapsed)}
              </span>
              <span
                className={`text-sm ${
                  timer.kind === "work" ? "text-emerald-400" : "text-sky-400"
                }`}
              >
                {timer.kind === "work" ? "Working" : "Break"}
              </span>
              {overtime && (
                <span className="text-xs text-red-400">
                  +{formatTime(timer.elapsed - timer.plannedSeconds!)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={stopWorkBlock}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
          >
            Stop
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => startWorkBlock("work")}
            className="flex-1 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
          >
            Start Work (45m)
          </button>
          <button
            onClick={() => startWorkBlock("break")}
            className="flex-1 py-2 text-sm bg-sky-600 hover:bg-sky-500 text-white rounded transition-colors"
          >
            Start Break (5m)
          </button>
        </div>
      )}
    </section>
  );
}
