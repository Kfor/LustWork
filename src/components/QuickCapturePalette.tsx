import { useState, useRef, useEffect } from "react";
import { useStore } from "../store/useStore";

export default function QuickCapturePalette() {
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const date = useStore((s) => s.date);
  const logEvent = useStore((s) => s.logEvent);
  const addTask = useStore((s) => s.addTask);
  const startWork = useStore((s) => s.startWork);
  const stopWork = useStore((s) => s.stopWork);
  const setQuickCaptureOpen = useStore((s) => s.setQuickCaptureOpen);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => {
      setQuickCaptureOpen(false);
    }, 600);
  };

  const handleSubmit = async () => {
    const cmd = input.trim().toLowerCase();
    if (!cmd) return;

    try {
      if (cmd.startsWith("reward ") || cmd.startsWith("r ")) {
        const parts = cmd.split(/\s+/);
        const levelStr = parts[1]?.replace("l", "");
        const level = parseInt(levelStr);
        const duration = parts[2] ? parseInt(parts[2]) : undefined;
        if (level >= 1 && level <= 4) {
          await logEvent({
            date,
            event_type: "reward",
            level,
            duration_sec: duration,
          });
          showFeedback(`Logged reward L${level}${duration ? ` ${duration}s` : ""}`);
        }
      } else if (cmd === "ejac" || cmd === "ejaculation") {
        await logEvent({ date, event_type: "ejaculation" });
        showFeedback("Logged ejaculation");
      } else if (cmd.startsWith("discomfort")) {
        const note = cmd.replace("discomfort", "").trim() || undefined;
        await logEvent({ date, event_type: "discomfort", note });
        showFeedback("Logged discomfort");
      } else if (cmd.startsWith("task add ") || cmd.startsWith("t ")) {
        const title = cmd.startsWith("task add ")
          ? cmd.slice(9).trim()
          : cmd.slice(2).trim();
        if (title) {
          await addTask(title);
          showFeedback(`Added task: ${title}`);
        }
      } else if (cmd === "work start" || cmd === "w") {
        await startWork("work", 45);
        showFeedback("Work started (45m)");
      } else if (cmd === "work stop" || cmd === "ws") {
        await stopWork();
        showFeedback("Work stopped");
      } else if (cmd === "break" || cmd === "b") {
        await startWork("break", 5);
        showFeedback("Break started (5m)");
      } else if (cmd.startsWith("note ") || cmd.startsWith("n ")) {
        const note = cmd.startsWith("note ") ? cmd.slice(5) : cmd.slice(2);
        await logEvent({ date, event_type: "note", note });
        showFeedback("Note logged");
      } else if (cmd === "lube") {
        await logEvent({ date, event_type: "lube" });
        showFeedback("Logged lube");
      } else {
        // Treat as a note
        await logEvent({ date, event_type: "note", note: cmd });
        showFeedback("Logged as note");
      }
    } catch (e) {
      setFeedback(`Error: ${e}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60"
      onClick={() => setQuickCaptureOpen(false)}
    >
      <div
        className="w-full max-w-md bg-[var(--surface)] rounded-xl shadow-2xl p-4 space-y-2"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs text-[var(--text-dim)]">
          Quick Capture — type a command
        </p>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") setQuickCaptureOpen(false);
          }}
          placeholder="reward L2 60 / ejac / task add xxx / work start"
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface2)] text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] border-none outline-none"
        />
        {feedback && (
          <p className="text-sm text-[var(--green)] font-medium">{feedback}</p>
        )}
        <div className="text-[10px] text-[var(--text-dim)] space-y-0.5">
          <p>reward L[1-4] [sec] · ejac · discomfort [note] · lube</p>
          <p>task add [title] · work start · work stop · break</p>
          <p>note [text] · or just type anything as a note</p>
        </div>
      </div>
    </div>
  );
}
