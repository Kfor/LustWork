use rusqlite::{Connection, Result as SqlResult, params};
use serde::Serialize;
use std::path::PathBuf;
use std::sync::Mutex;

use crate::models::*;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new(app_data_dir: PathBuf) -> SqlResult<Self> {
        std::fs::create_dir_all(&app_data_dir).ok();
        let db_path = app_data_dir.join("lustwork.db");
        let conn = Connection::open(db_path)?;
        Ok(Database {
            conn: Mutex::new(conn),
        })
    }

    pub fn init_tables(&self) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS day_plans (
                date TEXT PRIMARY KEY,
                condition TEXT NOT NULL,
                random_seed TEXT,
                notes TEXT,
                created_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS ratings (
                date TEXT PRIMARY KEY,
                efficiency INTEGER,
                pleasure INTEGER,
                health INTEGER,
                sleep_hours REAL,
                sleep_quality INTEGER,
                exercise_minutes INTEGER,
                exercise_type TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS work_blocks (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                kind TEXT NOT NULL,
                start_ts INTEGER NOT NULL,
                end_ts INTEGER,
                planned_minutes INTEGER,
                tags TEXT
            );

            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                title TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'todo',
                created_at INTEGER NOT NULL,
                completed_at INTEGER,
                notes TEXT
            );

            CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                ts INTEGER NOT NULL,
                event_type TEXT NOT NULL,
                level INTEGER,
                trigger_type TEXT,
                duration_sec INTEGER,
                intensity INTEGER,
                media_flag TEXT,
                context TEXT,
                note TEXT
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );"
        )?;
        Ok(())
    }

    pub fn get_day_plan(&self, date: &str) -> SqlResult<Option<DayPlan>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT date, condition, random_seed, notes, created_at FROM day_plans WHERE date = ?1"
        )?;
        let result = stmt.query_row(params![date], |row| {
            Ok(DayPlan {
                date: row.get(0)?,
                condition: row.get(1)?,
                random_seed: row.get(2)?,
                notes: row.get(3)?,
                created_at: row.get(4)?,
            })
        });
        match result {
            Ok(plan) => Ok(Some(plan)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub fn upsert_day_plan(&self, plan: &DayPlan) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO day_plans (date, condition, random_seed, notes, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![plan.date, plan.condition, plan.random_seed, plan.notes, plan.created_at],
        )?;
        Ok(())
    }

    pub fn get_ratings(&self, date: &str) -> SqlResult<Option<Ratings>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT date, efficiency, pleasure, health, sleep_hours, sleep_quality,
                    exercise_minutes, exercise_type, created_at, updated_at
             FROM ratings WHERE date = ?1"
        )?;
        let result = stmt.query_row(params![date], |row| {
            Ok(Ratings {
                date: row.get(0)?,
                efficiency: row.get(1)?,
                pleasure: row.get(2)?,
                health: row.get(3)?,
                sleep_hours: row.get(4)?,
                sleep_quality: row.get(5)?,
                exercise_minutes: row.get(6)?,
                exercise_type: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        });
        match result {
            Ok(r) => Ok(Some(r)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub fn upsert_ratings(&self, date: &str, payload: &RatingsPayload) -> SqlResult<Ratings> {
        let conn = self.conn.lock().unwrap();
        let now = chrono::Utc::now().timestamp();
        conn.execute(
            "INSERT INTO ratings (date, efficiency, pleasure, health, sleep_hours, sleep_quality,
                                  exercise_minutes, exercise_type, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
             ON CONFLICT(date) DO UPDATE SET
                efficiency = ?2, pleasure = ?3, health = ?4,
                sleep_hours = ?5, sleep_quality = ?6,
                exercise_minutes = ?7, exercise_type = ?8,
                updated_at = ?10",
            params![
                date, payload.efficiency, payload.pleasure, payload.health,
                payload.sleep_hours, payload.sleep_quality,
                payload.exercise_minutes, payload.exercise_type,
                now, now
            ],
        )?;
        drop(conn);
        self.get_ratings(date).map(|r| r.unwrap())
    }

    pub fn get_work_blocks(&self, date: &str) -> SqlResult<Vec<WorkBlock>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, date, kind, start_ts, end_ts, planned_minutes, tags
             FROM work_blocks WHERE date = ?1 ORDER BY start_ts"
        )?;
        let rows = stmt.query_map(params![date], |row| {
            Ok(WorkBlock {
                id: row.get(0)?,
                date: row.get(1)?,
                kind: row.get(2)?,
                start_ts: row.get(3)?,
                end_ts: row.get(4)?,
                planned_minutes: row.get(5)?,
                tags: row.get(6)?,
            })
        })?;
        rows.collect()
    }

    pub fn insert_work_block(&self, block: &WorkBlock) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO work_blocks (id, date, kind, start_ts, end_ts, planned_minutes, tags)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![block.id, block.date, block.kind, block.start_ts, block.end_ts, block.planned_minutes, block.tags],
        )?;
        Ok(())
    }

    pub fn update_work_block_end(&self, block_id: &str, end_ts: i64) -> SqlResult<WorkBlock> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE work_blocks SET end_ts = ?1 WHERE id = ?2",
            params![end_ts, block_id],
        )?;
        let mut stmt = conn.prepare(
            "SELECT id, date, kind, start_ts, end_ts, planned_minutes, tags
             FROM work_blocks WHERE id = ?1"
        )?;
        stmt.query_row(params![block_id], |row| {
            Ok(WorkBlock {
                id: row.get(0)?,
                date: row.get(1)?,
                kind: row.get(2)?,
                start_ts: row.get(3)?,
                end_ts: row.get(4)?,
                planned_minutes: row.get(5)?,
                tags: row.get(6)?,
            })
        })
    }

    pub fn get_tasks(&self, date: &str) -> SqlResult<Vec<Task>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, date, title, status, created_at, completed_at, notes
             FROM tasks WHERE date = ?1 ORDER BY created_at"
        )?;
        let rows = stmt.query_map(params![date], |row| {
            Ok(Task {
                id: row.get(0)?,
                date: row.get(1)?,
                title: row.get(2)?,
                status: row.get(3)?,
                created_at: row.get(4)?,
                completed_at: row.get(5)?,
                notes: row.get(6)?,
            })
        })?;
        rows.collect()
    }

    pub fn insert_task(&self, task: &Task) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO tasks (id, date, title, status, created_at, completed_at, notes)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![task.id, task.date, task.title, task.status, task.created_at, task.completed_at, task.notes],
        )?;
        Ok(())
    }

    pub fn update_task(&self, task_id: &str, status: &str) -> SqlResult<Task> {
        let conn = self.conn.lock().unwrap();
        let completed_at: Option<i64> = if status == "done" {
            Some(chrono::Utc::now().timestamp())
        } else {
            None
        };
        conn.execute(
            "UPDATE tasks SET status = ?1, completed_at = ?2 WHERE id = ?3",
            params![status, completed_at, task_id],
        )?;
        let mut stmt = conn.prepare(
            "SELECT id, date, title, status, created_at, completed_at, notes FROM tasks WHERE id = ?1"
        )?;
        stmt.query_row(params![task_id], |row| {
            Ok(Task {
                id: row.get(0)?,
                date: row.get(1)?,
                title: row.get(2)?,
                status: row.get(3)?,
                created_at: row.get(4)?,
                completed_at: row.get(5)?,
                notes: row.get(6)?,
            })
        })
    }

    pub fn get_events(&self, date: &str) -> SqlResult<Vec<Event>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, date, ts, event_type, level, trigger_type, duration_sec,
                    intensity, media_flag, context, note
             FROM events WHERE date = ?1 ORDER BY ts"
        )?;
        let rows = stmt.query_map(params![date], |row| {
            Ok(Event {
                id: row.get(0)?,
                date: row.get(1)?,
                ts: row.get(2)?,
                event_type: row.get(3)?,
                level: row.get(4)?,
                trigger_type: row.get(5)?,
                duration_sec: row.get(6)?,
                intensity: row.get(7)?,
                media_flag: row.get(8)?,
                context: row.get(9)?,
                note: row.get(10)?,
            })
        })?;
        rows.collect()
    }

    pub fn insert_event(&self, event: &Event) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO events (id, date, ts, event_type, level, trigger_type, duration_sec,
                                 intensity, media_flag, context, note)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                event.id, event.date, event.ts, event.event_type, event.level,
                event.trigger_type, event.duration_sec, event.intensity,
                event.media_flag, event.context, event.note
            ],
        )?;
        Ok(())
    }

    pub fn get_settings(&self) -> SqlResult<Vec<Setting>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT key, value FROM settings")?;
        let rows = stmt.query_map([], |row| {
            Ok(Setting {
                key: row.get(0)?,
                value: row.get(1)?,
            })
        })?;
        rows.collect()
    }

    pub fn upsert_setting(&self, key: &str, value: &str) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
            params![key, value],
        )?;
        Ok(())
    }

    pub fn export_all_for_range(&self, range: &str) -> SqlResult<ExportData> {
        let date_filter = match range {
            "today" => {
                let today = chrono::Local::now().format("%Y-%m-%d").to_string();
                format!("= '{}'", today)
            }
            "week" => {
                let today = chrono::Local::now();
                let week_ago = today - chrono::Duration::days(7);
                format!(">= '{}'", week_ago.format("%Y-%m-%d"))
            }
            _ => ">= '2000-01-01'".to_string(),
        };

        let conn = self.conn.lock().unwrap();

        let day_plans = {
            let mut stmt = conn.prepare(&format!(
                "SELECT date, condition, random_seed, notes, created_at FROM day_plans WHERE date {}", date_filter
            ))?;
            let rows = stmt.query_map([], |row| {
                Ok(DayPlan {
                    date: row.get(0)?,
                    condition: row.get(1)?,
                    random_seed: row.get(2)?,
                    notes: row.get(3)?,
                    created_at: row.get(4)?,
                })
            })?;
            let result: SqlResult<Vec<_>> = rows.collect();
            result?
        };

        let ratings = {
            let mut stmt = conn.prepare(&format!(
                "SELECT date, efficiency, pleasure, health, sleep_hours, sleep_quality,
                        exercise_minutes, exercise_type, created_at, updated_at
                 FROM ratings WHERE date {}", date_filter
            ))?;
            let rows = stmt.query_map([], |row| {
                Ok(Ratings {
                    date: row.get(0)?,
                    efficiency: row.get(1)?,
                    pleasure: row.get(2)?,
                    health: row.get(3)?,
                    sleep_hours: row.get(4)?,
                    sleep_quality: row.get(5)?,
                    exercise_minutes: row.get(6)?,
                    exercise_type: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                })
            })?;
            let result: SqlResult<Vec<_>> = rows.collect();
            result?
        };

        let work_blocks = {
            let mut stmt = conn.prepare(&format!(
                "SELECT id, date, kind, start_ts, end_ts, planned_minutes, tags
                 FROM work_blocks WHERE date {} ORDER BY start_ts", date_filter
            ))?;
            let rows = stmt.query_map([], |row| {
                Ok(WorkBlock {
                    id: row.get(0)?,
                    date: row.get(1)?,
                    kind: row.get(2)?,
                    start_ts: row.get(3)?,
                    end_ts: row.get(4)?,
                    planned_minutes: row.get(5)?,
                    tags: row.get(6)?,
                })
            })?;
            let result: SqlResult<Vec<_>> = rows.collect();
            result?
        };

        let tasks = {
            let mut stmt = conn.prepare(&format!(
                "SELECT id, date, title, status, created_at, completed_at, notes
                 FROM tasks WHERE date {} ORDER BY created_at", date_filter
            ))?;
            let rows = stmt.query_map([], |row| {
                Ok(Task {
                    id: row.get(0)?,
                    date: row.get(1)?,
                    title: row.get(2)?,
                    status: row.get(3)?,
                    created_at: row.get(4)?,
                    completed_at: row.get(5)?,
                    notes: row.get(6)?,
                })
            })?;
            let result: SqlResult<Vec<_>> = rows.collect();
            result?
        };

        let events = {
            let mut stmt = conn.prepare(&format!(
                "SELECT id, date, ts, event_type, level, trigger_type, duration_sec,
                        intensity, media_flag, context, note
                 FROM events WHERE date {} ORDER BY ts", date_filter
            ))?;
            let rows = stmt.query_map([], |row| {
                Ok(Event {
                    id: row.get(0)?,
                    date: row.get(1)?,
                    ts: row.get(2)?,
                    event_type: row.get(3)?,
                    level: row.get(4)?,
                    trigger_type: row.get(5)?,
                    duration_sec: row.get(6)?,
                    intensity: row.get(7)?,
                    media_flag: row.get(8)?,
                    context: row.get(9)?,
                    note: row.get(10)?,
                })
            })?;
            let result: SqlResult<Vec<_>> = rows.collect();
            result?
        };

        Ok(ExportData {
            day_plans,
            ratings,
            work_blocks,
            tasks,
            events,
        })
    }
}

#[derive(Debug, Serialize)]
pub struct ExportData {
    pub day_plans: Vec<DayPlan>,
    pub ratings: Vec<Ratings>,
    pub work_blocks: Vec<WorkBlock>,
    pub tasks: Vec<Task>,
    pub events: Vec<Event>,
}
