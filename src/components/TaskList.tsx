import { useState, type KeyboardEvent } from "react";
import { useTodayStore } from "../store/todayStore";

export default function TaskList() {
  const { tasks, addTask, updateTaskStatus } = useTodayStore();
  const [input, setInput] = useState("");

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      await addTask(input.trim());
      setInput("");
    }
  };

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const doneTasks = tasks.filter((t) => t.status === "done");
  const droppedTasks = tasks.filter((t) => t.status === "dropped");

  return (
    <section className="px-4 py-3 border-b border-gray-700">
      <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-2">
        Tasks
      </h2>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add task... (Enter)"
        className="w-full px-3 py-1.5 text-sm bg-gray-800 border border-gray-600 rounded text-gray-200 placeholder-gray-500 mb-2"
      />

      <ul className="space-y-1">
        {todoTasks.map((task) => (
          <li key={task.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={false}
              onChange={() => updateTaskStatus(task.id, "done")}
              className="rounded border-gray-600 bg-gray-800 text-emerald-500"
            />
            <span className="text-sm text-gray-200">{task.title}</span>
          </li>
        ))}
        {doneTasks.map((task) => (
          <li key={task.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={true}
              onChange={() => updateTaskStatus(task.id, "todo")}
              className="rounded border-gray-600 bg-gray-800 text-emerald-500"
            />
            <span className="text-sm text-gray-500 line-through">
              {task.title}
            </span>
            <button
              onClick={() => updateTaskStatus(task.id, "dropped")}
              className="ml-auto text-xs text-gray-600 hover:text-red-400 transition-colors"
              title="Drop task"
            >
              ✕
            </button>
          </li>
        ))}
        {droppedTasks.map((task) => (
          <li key={task.id} className="flex items-center gap-2 opacity-50">
            <button
              onClick={() => updateTaskStatus(task.id, "todo")}
              className="text-xs text-gray-500 hover:text-gray-300 underline"
            >
              ↩
            </button>
            <span className="text-sm text-gray-600 line-through">
              {task.title}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
