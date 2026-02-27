import { useState } from 'react';
import { useStore } from '../store/useStore';
import { TRIGGERS } from '../types';

const LEVELS = [1, 2, 3, 4];
const DURATIONS = [30, 60, 90];

export default function RewardPanel() {
  const { date, logEvent } = useStore();
  const [trigger, setTrigger] = useState('');

  const handleReward = (level: number, durationSec?: number) => {
    logEvent({
      date,
      event_type: 'reward',
      level,
      trigger_type: trigger || null,
      duration_sec: durationSec ?? null,
    });
  };

  const handleQuickEvent = (eventType: string) => {
    logEvent({
      date,
      event_type: eventType,
      trigger_type: trigger || null,
    });
  };

  return (
    <div className="p-4 border-b border-gray-700">
      <h3 className="text-sm font-medium text-gray-400 mb-2">Events & Rewards</h3>

      <div className="flex flex-wrap gap-2 mb-3">
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => handleReward(l)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-sm"
          >
            L{l}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-xs text-gray-500 self-center">Duration:</span>
        {LEVELS.filter((l) => l === 2 || l === 3).map((l) =>
          DURATIONS.map((d) => (
            <button
              key={`${l}-${d}`}
              onClick={() => handleReward(l, d)}
              className="px-3 py-1 bg-indigo-800 hover:bg-indigo-700 text-white rounded text-xs"
            >
              L{l} +{d}s
            </button>
          ))
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => handleQuickEvent('ejaculation')}
          className="px-3 py-1 bg-rose-700 hover:bg-rose-600 text-white rounded text-sm"
        >
          Ejac
        </button>
        <button
          onClick={() => handleQuickEvent('discomfort')}
          className="px-3 py-1 bg-orange-700 hover:bg-orange-600 text-white rounded text-sm"
        >
          Discomfort
        </button>
        <button
          onClick={() => handleQuickEvent('lube')}
          className="px-3 py-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded text-sm"
        >
          Lube
        </button>
        <button
          onClick={() => handleQuickEvent('note')}
          className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
        >
          Note
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500">Trigger:</label>
        <select
          value={trigger}
          onChange={(e) => setTrigger(e.target.value)}
          className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-600"
        >
          <option value="">None</option>
          {TRIGGERS.map((t) => (
            <option key={t} value={t}>
              {t.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
