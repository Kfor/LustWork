import { useState } from 'react';
import { useStore } from '../store/useStore';

export default function TaskList() {
  const { tasks, addTask, updateTaskStatus } = useStore();
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const title = input.trim();
    if (!title) return;
    addTask(title);
    setInput('');
  };

  return (
    <div className="p-4 border-b border-gray-700">
      <h3 className="text-sm font-medium text-gray-400 mb-2">Tasks</h3>

      <div className="flex gap-2 mb-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add task..."
          className="flex-1 bg-gray-800 text-white rounded px-3 py-1.5 text-sm border border-gray-600 placeholder-gray-500"
        />
        <button
          onClick={handleAdd}
          className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded text-sm"
        >
          Add
        </button>
      </div>

      <ul className="space-y-1">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-center gap-2 group">
            <input
              type="checkbox"
              checked={task.status === 'done'}
              onChange={() =>
                updateTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done')
              }
              className="accent-green-500"
            />
            <span
              className={`flex-1 text-sm ${task.status === 'done' ? 'line-through text-gray-500' : 'text-white'}`}
            >
              {task.title}
            </span>
            {task.status !== 'dropped' && (
              <button
                onClick={() => updateTaskStatus(task.id, 'dropped')}
                className="text-gray-600 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                drop
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
