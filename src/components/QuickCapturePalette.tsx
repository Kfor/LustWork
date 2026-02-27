import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export default function QuickCapturePalette() {
  const { showQuickCapture, setShowQuickCapture, date, logEvent, addTask, startWorkBlock, stopWorkBlock } = useStore();
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showQuickCapture) {
      setInput('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showQuickCapture]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showQuickCapture) {
        setShowQuickCapture(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showQuickCapture, setShowQuickCapture]);

  if (!showQuickCapture) return null;

  const execute = () => {
    const cmd = input.trim().toLowerCase();
    if (!cmd) return;

    const parts = cmd.split(/\s+/);
    const action = parts[0];

    if (action === 'reward' || action === 'r') {
      const levelStr = parts[1] || '';
      const level = parseInt(levelStr.replace(/^l/i, ''), 10) || 1;
      const duration = parts[2] ? parseInt(parts[2], 10) : undefined;
      logEvent({
        date,
        event_type: 'reward',
        level,
        duration_sec: duration ?? null,
      });
    } else if (action === 'ejac' || action === 'ejaculation') {
      logEvent({ date, event_type: 'ejaculation' });
    } else if (action === 'discomfort' || action === 'disc') {
      logEvent({
        date,
        event_type: 'discomfort',
        note: parts.slice(1).join(' ') || null,
      });
    } else if (action === 'task' && parts[1] === 'add') {
      const title = parts.slice(2).join(' ');
      if (title) addTask(title);
    } else if (action === 'work' && parts[1] === 'start') {
      startWorkBlock('work', parseInt(parts[2] || '45', 10));
    } else if (action === 'work' && parts[1] === 'stop') {
      stopWorkBlock();
    } else if (action === 'break') {
      startWorkBlock('break', parseInt(parts[1] || '5', 10));
    } else if (action === 'note') {
      logEvent({
        date,
        event_type: 'note',
        note: parts.slice(1).join(' ') || null,
      });
    } else if (action === 'lube') {
      logEvent({ date, event_type: 'lube' });
    } else {
      logEvent({
        date,
        event_type: 'custom',
        note: cmd,
      });
    }

    setInput('');
    setShowQuickCapture(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60" onClick={() => setShowQuickCapture(false)}>
      <div
        className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 w-[500px] p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && execute()}
          placeholder="reward L2 60 / ejac / task add xxx / work start"
          className="w-full bg-gray-800 text-white rounded px-4 py-3 text-sm border border-gray-600 placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <div className="mt-2 text-xs text-gray-500">
          Commands: reward L[1-4] [sec] | ejac | discomfort [note] | lube | task add [title] | work start [min] | work stop | break [min] | note [text]
        </div>
      </div>
    </div>
  );
}
