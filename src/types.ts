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
  status: string;
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

export interface EventPayload {
  date: string;
  event_type: string;
  level?: number | null;
  trigger_type?: string | null;
  duration_sec?: number | null;
  intensity?: number | null;
  media_flag?: string | null;
  context?: string | null;
  note?: string | null;
}

export interface RatingsPayload {
  efficiency?: number | null;
  pleasure?: number | null;
  health?: number | null;
  sleep_hours?: number | null;
  sleep_quality?: number | null;
  exercise_minutes?: number | null;
  exercise_type?: string | null;
}

export interface TodayDTO {
  date: string;
  day_plan: DayPlan | null;
  ratings: Ratings | null;
  work_blocks: WorkBlock[];
  tasks: Task[];
  events: Event[];
}

export type Settings = Record<string, string>;
