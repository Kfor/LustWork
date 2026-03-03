import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type {
  DayPlan,
  Ratings,
  WorkBlock,
  Task,
  Event,
  EventPayload,
  RatingsPayload,
  TodayDTO,
} from "../types";

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

interface TimerState {
  running: boolean;
  kind: "work" | "break" | null;
  blockId: string | null;
  startedAt: number | null;
  plannedSeconds: number | null;
  elapsed: number;
}

interface RewardTimerState {
  running: boolean;
  level: number | null;
  startedAt: number | null;
  elapsed: number;
}

interface TodayState {
  date: string;
  dayPlan: DayPlan | null;
  ratings: Ratings | null;
  workBlocks: WorkBlock[];
  tasks: Task[];
  events: Event[];
  loading: boolean;
  timer: TimerState;
  rewardTimer: RewardTimerState;
  exportDialogOpen: boolean;
  quickCaptureOpen: boolean;

  // Data actions
  loadToday: (date?: string) => Promise<void>;
  rollDice: () => Promise<void>;
  startWorkBlock: (kind: "work" | "break", plannedMinutes?: number) => Promise<void>;
  stopWorkBlock: () => Promise<void>;
  addTask: (title: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: string) => Promise<void>;
  logEvent: (payload: EventPayload) => Promise<void>;
  setRatings: (payload: RatingsPayload) => Promise<void>;
  updateNotes: (notes: string) => Promise<void>;
  exportData: (range: string, format: string) => Promise<string>;

  // Timer actions
  tickTimer: () => void;
  tickRewardTimer: () => void;
  startRewardTimer: (level: number) => void;
  stopRewardTimer: () => number;

  // UI actions
  setExportDialogOpen: (open: boolean) => void;
  setQuickCaptureOpen: (open: boolean) => void;
}

export const useTodayStore = create<TodayState>((set, get) => ({
  date: getToday(),
  dayPlan: null,
  ratings: null,
  workBlocks: [],
  tasks: [],
  events: [],
  loading: true,
  timer: {
    running: false,
    kind: null,
    blockId: null,
    startedAt: null,
    plannedSeconds: null,
    elapsed: 0,
  },
  rewardTimer: {
    running: false,
    level: null,
    startedAt: null,
    elapsed: 0,
  },
  exportDialogOpen: false,
  quickCaptureOpen: false,

  loadToday: async (date?: string) => {
    const d = date ?? getToday();
    set({ loading: true, date: d });
    try {
      const dto = await invoke<TodayDTO>("get_today", { date: d });
      const activeBlock = dto.work_blocks.find((b) => b.end_ts === null);
      const timer: TimerState = activeBlock
        ? {
            running: true,
            kind: activeBlock.kind as "work" | "break",
            blockId: activeBlock.id,
            startedAt: activeBlock.start_ts,
            plannedSeconds: activeBlock.planned_minutes
              ? activeBlock.planned_minutes * 60
              : null,
            elapsed: Math.floor(Date.now() / 1000) - activeBlock.start_ts,
          }
        : {
            running: false,
            kind: null,
            blockId: null,
            startedAt: null,
            plannedSeconds: null,
            elapsed: 0,
          };
      set({
        dayPlan: dto.day_plan,
        ratings: dto.ratings,
        workBlocks: dto.work_blocks,
        tasks: dto.tasks,
        events: dto.events,
        loading: false,
        timer,
      });
    } catch (err) {
      console.error("Failed to load today:", err);
      set({ loading: false });
    }
  },

  rollDice: async () => {
    const { date } = get();
    const plan = await invoke<DayPlan>("roll_day_plan", { date });
    set({ dayPlan: plan });
  },

  startWorkBlock: async (kind, plannedMinutes) => {
    const { date } = get();
    const mins = plannedMinutes ?? (kind === "work" ? 45 : 5);
    const block = await invoke<WorkBlock>("start_work_block", {
      date,
      kind,
      plannedMinutes: mins,
    });
    set((s) => ({
      workBlocks: [...s.workBlocks, block],
      timer: {
        running: true,
        kind,
        blockId: block.id,
        startedAt: block.start_ts,
        plannedSeconds: mins * 60,
        elapsed: 0,
      },
    }));
  },

  stopWorkBlock: async () => {
    const { timer } = get();
    if (!timer.blockId) return;
    const block = await invoke<WorkBlock>("stop_work_block", {
      blockId: timer.blockId,
    });
    set((s) => ({
      workBlocks: s.workBlocks.map((b) => (b.id === block.id ? block : b)),
      timer: {
        running: false,
        kind: null,
        blockId: null,
        startedAt: null,
        plannedSeconds: null,
        elapsed: 0,
      },
    }));
  },

  addTask: async (title) => {
    const { date } = get();
    const task = await invoke<Task>("add_task", { date, title });
    set((s) => ({ tasks: [...s.tasks, task] }));
  },

  updateTaskStatus: async (taskId, status) => {
    const task = await invoke<Task>("update_task_status", { taskId, status });
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === task.id ? task : t)),
    }));
  },

  logEvent: async (payload) => {
    const event = await invoke<Event>("log_event", { payload });
    set((s) => ({ events: [...s.events, event] }));
  },

  setRatings: async (payload) => {
    const { date } = get();
    const ratings = await invoke<Ratings>("set_ratings", { date, payload });
    set({ ratings });
  },

  updateNotes: async (notes) => {
    // NOTE: The backend set_day_plan does not persist notes (hardcodes NULL).
    // We optimistically update local state so notes work within the session.
    // A backend update_day_notes command is needed for persistence across restarts.
    set((s) => ({
      dayPlan: s.dayPlan
        ? { ...s.dayPlan, notes }
        : {
            date: s.date,
            condition: "A",
            random_seed: null,
            notes,
            created_at: Math.floor(Date.now() / 1000),
          },
    }));
  },

  exportData: async (range, format) => {
    return invoke<string>("export_data", { range, format });
  },

  tickTimer: () => {
    set((s) => {
      if (!s.timer.running || !s.timer.startedAt) return s;
      return {
        timer: {
          ...s.timer,
          elapsed: Math.floor(Date.now() / 1000) - s.timer.startedAt,
        },
      };
    });
  },

  tickRewardTimer: () => {
    set((s) => {
      if (!s.rewardTimer.running || !s.rewardTimer.startedAt) return s;
      return {
        rewardTimer: {
          ...s.rewardTimer,
          elapsed: Math.floor(Date.now() / 1000) - s.rewardTimer.startedAt,
        },
      };
    });
  },

  startRewardTimer: (level) => {
    set({
      rewardTimer: {
        running: true,
        level,
        startedAt: Math.floor(Date.now() / 1000),
        elapsed: 0,
      },
    });
  },

  stopRewardTimer: () => {
    const { rewardTimer } = get();
    const elapsed = rewardTimer.elapsed;
    set({
      rewardTimer: {
        running: false,
        level: null,
        startedAt: null,
        elapsed: 0,
      },
    });
    return elapsed;
  },

  setExportDialogOpen: (open) => set({ exportDialogOpen: open }),
  setQuickCaptureOpen: (open) => set({ quickCaptureOpen: open }),
}));
