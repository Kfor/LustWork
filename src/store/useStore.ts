import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type {
  TodayDTO,
  DayPlan,
  WorkBlock,
  Task,
  Event,
  Ratings,
  EventPayload,
  RatingsPayload,
} from "./types";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface AppState {
  date: string;
  dayPlan: DayPlan | null;
  ratings: Ratings | null;
  workBlocks: WorkBlock[];
  tasks: Task[];
  events: Event[];
  activeBlockId: string | null;
  quickCaptureOpen: boolean;
  loading: boolean;

  loadToday: () => Promise<void>;
  rollDice: () => Promise<void>;
  setDayNotes: (notes: string) => Promise<void>;
  startWork: (kind: "work" | "break", plannedMinutes?: number) => Promise<void>;
  stopWork: () => Promise<void>;
  addTask: (title: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: Task["status"]) => Promise<void>;
  logEvent: (payload: EventPayload) => Promise<void>;
  setRatings: (payload: RatingsPayload) => Promise<void>;
  exportData: (range: string, format: string) => Promise<string>;
  setQuickCaptureOpen: (open: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  date: todayStr(),
  dayPlan: null,
  ratings: null,
  workBlocks: [],
  tasks: [],
  events: [],
  activeBlockId: null,
  quickCaptureOpen: false,
  loading: false,

  loadToday: async () => {
    set({ loading: true });
    try {
      const data = await invoke<TodayDTO>("get_today", { date: get().date });
      const activeBlock = data.work_blocks.find((b) => b.end_ts === null);
      set({
        dayPlan: data.day_plan,
        ratings: data.ratings,
        workBlocks: data.work_blocks,
        tasks: data.tasks,
        events: data.events,
        activeBlockId: activeBlock?.id ?? null,
        loading: false,
      });
    } catch (e) {
      console.error("loadToday failed:", e);
      set({ loading: false });
    }
  },

  rollDice: async () => {
    try {
      const plan = await invoke<DayPlan>("roll_day_plan", { date: get().date });
      set({ dayPlan: plan });
    } catch (e) {
      console.error("rollDice failed:", e);
    }
  },

  setDayNotes: async (notes: string) => {
    try {
      await invoke("set_day_notes", { date: get().date, notes });
      set((s) => ({
        dayPlan: s.dayPlan ? { ...s.dayPlan, notes } : null,
      }));
    } catch (e) {
      console.error("setDayNotes failed:", e);
    }
  },

  startWork: async (kind: "work" | "break", plannedMinutes?: number) => {
    try {
      const { activeBlockId } = get();
      if (activeBlockId) {
        await invoke<WorkBlock>("stop_work_block", { blockId: activeBlockId });
      }
      const block = await invoke<WorkBlock>("start_work_block", {
        date: get().date,
        kind,
        plannedMinutes: plannedMinutes ?? (kind === "work" ? 45 : 5),
      });
      await get().loadToday();
      set({ activeBlockId: block.id });
    } catch (e) {
      console.error("startWork failed:", e);
    }
  },

  stopWork: async () => {
    try {
      const { activeBlockId } = get();
      if (!activeBlockId) return;
      await invoke<WorkBlock>("stop_work_block", { blockId: activeBlockId });
      set({ activeBlockId: null });
      await get().loadToday();
    } catch (e) {
      console.error("stopWork failed:", e);
    }
  },

  addTask: async (title: string) => {
    try {
      const task = await invoke<Task>("add_task", { date: get().date, title });
      set((s) => ({ tasks: [...s.tasks, task] }));
    } catch (e) {
      console.error("addTask failed:", e);
    }
  },

  updateTaskStatus: async (taskId: string, status: Task["status"]) => {
    try {
      const task = await invoke<Task>("update_task_status", { taskId, status });
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === taskId ? task : t)),
      }));
    } catch (e) {
      console.error("updateTaskStatus failed:", e);
    }
  },

  logEvent: async (payload: EventPayload) => {
    try {
      const event = await invoke<Event>("log_event", { payload });
      set((s) => ({ events: [...s.events, event] }));
    } catch (e) {
      console.error("logEvent failed:", e);
    }
  },

  setRatings: async (payload: RatingsPayload) => {
    try {
      const ratings = await invoke<Ratings>("set_ratings", {
        date: get().date,
        payload,
      });
      set({ ratings });
    } catch (e) {
      console.error("setRatings failed:", e);
    }
  },

  exportData: async (range: string, format: string) => {
    try {
      return await invoke<string>("export_data", { range, format });
    } catch (e) {
      console.error("exportData failed:", e);
      throw e;
    }
  },

  setQuickCaptureOpen: (open: boolean) => set({ quickCaptureOpen: open }),
}));
