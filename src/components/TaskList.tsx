import { useState } from "react";
import { useStore } from "../store/useStore";

export default function TaskList() {
  const tasks = useStore((s) => s.tasks);
  const addTask = useStore((s) => s.addTask);
  const updateTaskStatus = useStore((s) => s.updateTaskStatus);
  const [input, setInput] = useState("");

  const handleAdd = async () => {
    const title = input.trim();
    if (!title) return;
    await addTask(title);
    setInput("");
  };

  return (
    <div className="rounded-xl bg-[var(--surface)] p-4 space-y-3">
      <h2 className="text-sm font-semibold text-[var(--text-dim)] uppercase tracking-wide">
        Tasks
      </h2>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add task…"
          className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--surface2)] text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] border-none outline-none"
        />
        <button
          onClick={handleAdd}
          className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Add
        </button>
      </div>

      <ul className="space-y-1">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-center gap-2 group">
            <input
              type="checkbox"
              checked={task.status === "done"}
              onChange={() =>
                updateTaskStatus(
                  task.id,
                  task.status === "done" ? "todo" : "done"
                )
              }
              className="accent-[var(--green)] w-4 h-4"
            />
            <span
              className={`flex-1 text-sm ${task.status === "done" ? "line-through text-[var(--text-dim)]" : ""}`}
            >
              {task.title}
            </span>
            {task.status !== "dropped" && (
              <button
                onClick={() => updateTaskStatus(task.id, "dropped")}
                className="text-xs text-[var(--text-dim)] opacity-0 group-hover:opacity-100 hover:text-[var(--accent)] transition-all"
              >
                drop
              </button>
            )}
            {task.status === "dropped" && (
              <span className="text-xs text-[var(--accent)]">dropped</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
