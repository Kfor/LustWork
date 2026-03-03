import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useTodayStore } from "../store/todayStore";

export default function QuickCapturePalette() {
  const {
    date,
    quickCaptureOpen,
    setQuickCaptureOpen,
    logEvent,
    addTask,
    startWorkBlock,
    stopWorkBlock,
    timer,
  } = useTodayStore();
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (quickCaptureOpen) {
      setInput("");
      setFeedback("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [quickCaptureOpen]);

  // Global keyboard shortcut listener
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "L") {
        e.preventDefault();
        setQuickCaptureOpen(!useTodayStore.getState().quickCaptureOpen);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setQuickCaptureOpen]);

  const parseAndExecute = async (cmd: string) => {
    const rawParts = cmd.trim().split(/\s+/);
    const parts = rawParts.map((p) => p.toLowerCase());
    if (!parts.length) return;

    try {
      if (parts[0] === "reward" || parts[0] === "r") {
        const levelStr = parts[1]?.replace("l", "");
        const level = levelStr ? parseInt(levelStr, 10) : 1;
        const duration = parts[2] ? parseInt(parts[2], 10) : undefined;
        await logEvent({
          date,
          event_type: "reward",
          level: isNaN(level) ? 1 : level,
          duration_sec: duration ?? null,
        });
        setFeedback(`Logged reward L${level}${duration ? ` ${duration}s` : ""}`);
      } else if (parts[0] === "ejac" || parts[0] === "ejaculation") {
        await logEvent({ date, event_type: "ejaculation" });
        setFeedback("Logged ejaculation");
      } else if (parts[0] === "discomfort") {
        const note = rawParts.slice(1).join(" ") || undefined;
        await logEvent({ date, event_type: "discomfort", note });
        setFeedback(`Logged discomfort${note ? `: ${note}` : ""}`);
      } else if (parts[0] === "lube") {
        await logEvent({ date, event_type: "lube" });
        setFeedback("Logged lube");
      } else if (parts[0] === "note") {
        const note = rawParts.slice(1).join(" ");
        await logEvent({ date, event_type: "note", note: note || undefined });
        setFeedback("Logged note");
      } else if (parts[0] === "task" && parts[1] === "add") {
        const title = rawParts.slice(2).join(" ");
        if (title) {
          await addTask(title);
          setFeedback(`Added task: ${title}`);
        }
      } else if (parts[0] === "work" && parts[1] === "start") {
        if (!timer.running) {
          await startWorkBlock("work");
          setFeedback("Work timer started");
        } else {
          setFeedback("Timer already running");
        }
      } else if (parts[0] === "work" && parts[1] === "stop") {
        if (timer.running) {
          await stopWorkBlock();
          setFeedback("Work timer stopped");
        } else {
          setFeedback("No timer running");
        }
      } else if (parts[0] === "break" && parts[1] === "start") {
        if (!timer.running) {
          await startWorkBlock("break");
          setFeedback("Break timer started");
        } else {
          setFeedback("Timer already running");
        }
      } else {
        // Treat as a generic note, preserve original casing
        await logEvent({ date, event_type: "note", note: cmd.trim() });
        setFeedback("Logged as note");
      }
    } catch (err) {
      setFeedback(`Error: ${err}`);
    }

    setTimeout(() => setQuickCaptureOpen(false), 600);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      parseAndExecute(input);
    } else if (e.key === "Escape") {
      setQuickCaptureOpen(false);
    }
  };

  if (!quickCaptureOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-start justify-center pt-[20vh] z-50"
      onClick={() => setQuickCaptureOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-gray-800 rounded-lg shadow-2xl border border-gray-600 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="reward L2 60 / ejac / discomfort pain / task add xxx / work start"
          className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-600 rounded text-gray-200 placeholder-gray-500"
        />
        {feedback && (
          <p className="mt-2 text-xs text-emerald-400">{feedback}</p>
        )}
        <p className="mt-2 text-xs text-gray-600">
          Esc to close · Enter to submit
        </p>
      </div>
    </div>
  );
}
