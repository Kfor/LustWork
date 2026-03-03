export interface DayPlan {
  date: string;
  condition: string;
  random_seed: string | null;
  notes: string | null;
  created_at: number;
}

export interface Ratings {
  date: string;
  efficiency: number | null;
  pleasure: number | null;
  health: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  exercise_minutes: number | null;
  exercise_type: string | null;
  created_at: number;
  updated_at: number;
}

export interface WorkBlock {
  id: string;
  date: string;
  kind: string;
  start_ts: number;
  end_ts: number | null;
  planned_minutes: number | null;
  tags: string | null;
}

export interface Task {
  id: string;
  date: string;
  title: string;
  status: "todo" | "done" | "dropped";
  created_at: number;
  completed_at: number | null;
  notes: string | null;
}

export interface Event {
  id: string;
  date: string;
  ts: number;
  event_type: string;
  level: number | null;
  trigger_type: string | null;
  duration_sec: number | null;
  intensity: number | null;
  media_flag: string | null;
  context: string | null;
  note: string | null;
}

export interface TodayDTO {
  day_plan: DayPlan | null;
  ratings: Ratings | null;
  work_blocks: WorkBlock[];
  tasks: Task[];
  events: Event[];
}

export interface EventPayload {
  date: string;
  event_type: string;
  level?: number;
  trigger_type?: string;
  duration_sec?: number;
  intensity?: number;
  media_flag?: string;
  context?: string;
  note?: string;
}

export interface RatingsPayload {
  efficiency?: number;
  pleasure?: number;
  health?: number;
  sleep_hours?: number;
  sleep_quality?: number;
  exercise_minutes?: number;
  exercise_type?: string;
}

export const TRIGGERS = [
  "mind_wander",
  "irritability",
  "task_start",
  "milestone_done",
  "break_time",
  "other",
] as const;

export const CONDITIONS = [
  { value: "A", label: "A — Baseline" },
  { value: "B", label: "B — Stim/No-ejac" },
  { value: "C", label: "C — Stim/Ejac-allowed" },
] as const;

export const EVENT_TYPES = [
  "reward",
  "ejaculation",
  "discomfort",
  "lube",
  "note",
  "custom",
] as const;
