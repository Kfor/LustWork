import { useStore } from "../store/useStore";
import { useState, useEffect } from "react";

export default function WorkTimer() {
  const workBlocks = useStore((s) => s.workBlocks);
  const activeBlockId = useStore((s) => s.activeBlockId);
  const startWork = useStore((s) => s.startWork);
  const stopWork = useStore((s) => s.stopWork);
  const [elapsed, setElapsed] = useState(0);

  const activeBlock = workBlocks.find((b) => b.id === activeBlockId);

  // Timer tick
  useEffect(() => {
    if (!activeBlock) {
      setElapsed(0);
      return;
    }
    const tick = () => {
      setElapsed(Math.floor(Date.now() / 1000 - activeBlock.start_ts));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeBlock]);

  // Compute daily totals
  const now = Math.floor(Date.now() / 1000);
  const workSecs = workBlocks
    .filter((b) => b.kind === "work")
    .reduce((sum, b) => {
      const end = b.end_ts ?? now;
      return sum + (end - b.start_ts);
    }, 0);
  const breakSecs = workBlocks
    .filter((b) => b.kind === "break")
    .reduce((sum, b) => {
      const end = b.end_ts ?? now;
      return sum + (end - b.start_ts);
    }, 0);

  const planned = activeBlock?.planned_minutes ?? 0;
  const remaining = Math.max(0, planned * 60 - elapsed);
  const isOvertime = elapsed > planned * 60 && planned > 0;

  const fmt = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };
  const fmtMin = (secs: number) => `${Math.floor(secs / 60)}m`;

  return (
    <div className="rounded-xl bg-[var(--surface)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-dim)] uppercase tracking-wide">
          Timer
        </h2>
        <div className="flex gap-2 text-xs text-[var(--text-dim)]">
          <span>Work: {fmtMin(workSecs)}</span>
          <span>Break: {fmtMin(breakSecs)}</span>
        </div>
      </div>

      {activeBlock ? (
        <div className="text-center space-y-2">
          <p className="text-xs text-[var(--text-dim)] uppercase">
            {activeBlock.kind === "work" ? "Working" : "Break"}
          </p>
          <p
            className={`text-4xl font-mono font-bold ${isOvertime ? "text-[var(--accent)]" : "text-[var(--green)]"}`}
          >
            {planned > 0 ? fmt(remaining) : fmt(elapsed)}
          </p>
          {planned > 0 && (
            <p className="text-xs text-[var(--text-dim)]">
              Elapsed: {fmt(elapsed)} / {planned}m
            </p>
          )}
          <button
            onClick={stopWork}
            className="px-4 py-2 rounded-lg bg-[var(--accent)] text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Stop
          </button>
        </div>
      ) : (
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => startWork("work", 45)}
            className="px-4 py-2 rounded-lg bg-[var(--surface2)] text-sm font-medium hover:bg-[var(--accent)] transition-colors"
          >
            Start Work (45m)
          </button>
          <button
            onClick={() => startWork("break", 5)}
            className="px-4 py-2 rounded-lg bg-[var(--surface2)] text-sm font-medium hover:bg-[var(--green)] hover:text-[var(--bg)] transition-colors"
          >
            Start Break (5m)
          </button>
        </div>
      )}
    </div>
  );
}
