import { useState } from 'react';
import { useStore } from '../store/useStore';

export default function NotesSection() {
  const { date, logEvent } = useStore();
  const [note, setNote] = useState('');
  const [collapsed, setCollapsed] = useState(true);

  const saveNote = () => {
    if (!note.trim()) return;
    logEvent({
      date,
      event_type: 'note',
      note: note.trim(),
    });
    setNote('');
  };

  return (
    <div className="p-4">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="text-sm font-medium text-gray-400 hover:text-gray-200 flex items-center gap-1"
      >
        <span>{collapsed ? '▶' : '▼'}</span> Notes
      </button>
      {!collapsed && (
        <div className="mt-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Quick notes for the day..."
            rows={3}
            className="w-full bg-gray-800 text-white rounded px-3 py-2 text-sm border border-gray-600 placeholder-gray-500 resize-none"
          />
          <button
            onClick={saveNote}
            className="mt-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
          >
            Save Note
          </button>
        </div>
      )}
    </div>
  );
}
