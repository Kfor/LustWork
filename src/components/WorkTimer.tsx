import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

export default function WorkTimer() {
  const { activeBlock, workBlocks, startWorkBlock, stopWorkBlock, settings } = useStore();
  const [elapsed, setElapsed] = useState(0);

  const workMinutes = parseInt(settings['work_minutes'] || '45', 10);
  const breakMinutes = parseInt(settings['break_minutes'] || '5', 10);

  useEffect(() => {
    if (!activeBlock) {
      setElapsed(0);
      return;
    }
    const tick = () => {
      setElapsed(Math.floor(Date.now() / 1000) - activeBlock.start_ts);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeBlock]);

  const totalWork = workBlocks
    .filter((b) => b.kind === 'work')
    .reduce((sum, b) => {
      const end = b.end_ts ?? Math.floor(Date.now() / 1000);
      return sum + (end - b.start_ts);
    }, 0);

  const totalBreak = workBlocks
    .filter((b) => b.kind === 'break')
    .reduce((sum, b) => {
      const end = b.end_ts ?? Math.floor(Date.now() / 1000);
      return sum + (end - b.start_ts);
    }, 0);

  const fmt = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const planned = activeBlock?.planned_minutes ?? 0;
  const planSecs = planned * 60;
  const overTime = activeBlock && planSecs > 0 && elapsed > planSecs;

  return (
    <div className="p-4 border-b border-gray-700">
      <div className="flex items-center gap-4">
        <div className="text-3xl font-mono text-white min-w-[120px]">
          <span className={overTime ? 'text-red-400' : ''}>{fmt(elapsed)}</span>
        </div>
        {activeBlock ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 capitalize">{activeBlock.kind}</span>
            <button
              onClick={stopWorkBlock}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-medium"
            >
              Stop
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => startWorkBlock('work', workMinutes)}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-medium"
            >
              Start Work ({workMinutes}m)
            </button>
            <button
              onClick={() => startWorkBlock('break', breakMinutes)}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded font-medium"
            >
              Break ({breakMinutes}m)
            </button>
          </div>
        )}
      </div>
      <div className="flex gap-4 mt-2 text-sm text-gray-400">
        <span>Work: {Math.floor(totalWork / 60)}m</span>
        <span>Break: {Math.floor(totalBreak / 60)}m</span>
        <span>Blocks: {workBlocks.length}</span>
      </div>
    </div>
  );
}
