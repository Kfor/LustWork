import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type {
  DayPlan,
  Ratings,
  WorkBlock,
  Task,
  Event,
  TodayDTO,
  EventPayload,
  RatingsPayload,
  Settings,
} from '../types';

function todayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface AppState {
  date: string;
  dayPlan: DayPlan | null;
  ratings: Ratings | null;
  workBlocks: WorkBlock[];
  tasks: Task[];
  events: Event[];
  settings: Settings;
  activeBlock: WorkBlock | null;
  showQuickCapture: boolean;
  showExportDialog: boolean;
  page: 'today' | 'settings';

  setPage: (page: 'today' | 'settings') => void;
  setShowQuickCapture: (show: boolean) => void;
  setShowExportDialog: (show: boolean) => void;
  loadToday: () => Promise<void>;
  rollDayPlan: () => Promise<void>;
  startWorkBlock: (kind: string, plannedMinutes?: number) => Promise<void>;
  stopWorkBlock: () => Promise<void>;
  addTask: (title: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: string) => Promise<void>;
  logEvent: (payload: EventPayload) => Promise<void>;
  setRatings: (payload: RatingsPayload) => Promise<void>;
  exportData: (range: string, format: string) => Promise<string>;
  loadSettings: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
  openDataDir: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  date: todayDate(),
  dayPlan: null,
  ratings: null,
  workBlocks: [],
  tasks: [],
  events: [],
  settings: {},
  activeBlock: null,
  showQuickCapture: false,
  showExportDialog: false,
  page: 'today',

  setPage: (page) => set({ page }),
  setShowQuickCapture: (show) => set({ showQuickCapture: show }),
  setShowExportDialog: (show) => set({ showExportDialog: show }),

  loadToday: async () => {
    const { date } = get();
    const data = await invoke<TodayDTO>('get_today', { date });
    const active = data.work_blocks.find((b) => b.end_ts === null) || null;
    set({
      dayPlan: data.day_plan,
      ratings: data.ratings,
      workBlocks: data.work_blocks,
      tasks: data.tasks,
      events: data.events,
      activeBlock: active,
    });
  },

  rollDayPlan: async () => {
    const { date } = get();
    const plan = await invoke<DayPlan>('roll_day_plan', { date });
    set({ dayPlan: plan });
  },

  startWorkBlock: async (kind, plannedMinutes) => {
    const { date } = get();
    const block = await invoke<WorkBlock>('start_work_block', {
      date,
      kind,
      plannedMinutes: plannedMinutes ?? null,
    });
    set((s) => ({
      workBlocks: [...s.workBlocks, block],
      activeBlock: block,
    }));
  },

  stopWorkBlock: async () => {
    const { activeBlock } = get();
    if (!activeBlock) return;
    const block = await invoke<WorkBlock>('stop_work_block', {
      blockId: activeBlock.id,
    });
    set((s) => ({
      workBlocks: s.workBlocks.map((b) => (b.id === block.id ? block : b)),
      activeBlock: null,
    }));
  },

  addTask: async (title) => {
    const { date } = get();
    const task = await invoke<Task>('add_task', { date, title });
    set((s) => ({ tasks: [...s.tasks, task] }));
  },

  updateTaskStatus: async (taskId, status) => {
    const task = await invoke<Task>('update_task_status', { taskId, status });
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === task.id ? task : t)),
    }));
  },

  logEvent: async (payload) => {
    const event = await invoke<Event>('log_event', { payload });
    set((s) => ({ events: [...s.events, event] }));
  },

  setRatings: async (payload) => {
    const { date } = get();
    const ratings = await invoke<Ratings>('set_ratings', { date, payload });
    set({ ratings });
  },

  exportData: async (range, format) => {
    return await invoke<string>('export_data', { range, format });
  },

  loadSettings: async () => {
    const settings = await invoke<Settings>('get_settings');
    set({ settings });
  },

  updateSetting: async (key, value) => {
    await invoke('update_setting', { key, value });
    set((s) => ({ settings: { ...s.settings, [key]: value } }));
  },

  openDataDir: async () => {
    await invoke('open_data_dir');
  },
}));
