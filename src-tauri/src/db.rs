use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;

pub struct DbState(pub Mutex<Connection>);

pub fn db_path() -> PathBuf {
    let mut path = dirs_data_dir();
    path.push("lustwork.db");
    path
}

fn dirs_data_dir() -> PathBuf {
    #[cfg(target_os = "macos")]
    {
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".into());
        PathBuf::from(home).join("Library/Application Support/com.lustwork.app")
    }
    #[cfg(target_os = "windows")]
    {
        let appdata = std::env::var("APPDATA").unwrap_or_else(|_| ".".into());
        PathBuf::from(appdata).join("com.lustwork.app")
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".into());
        PathBuf::from(home).join(".local/share/com.lustwork.app")
    }
}

pub fn open_db() -> Result<Connection, String> {
    let path = db_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let conn = Connection::open(&path).map_err(|e| e.to_string())?;
    init_schema(&conn)?;
    Ok(conn)
}

fn init_schema(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS day_plans (
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
        );
        ",
    )
    .map_err(|e| e.to_string())
}

// ── Data types ──

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DayPlan {
    pub date: String,
    pub condition: String,
    pub random_seed: Option<String>,
    pub notes: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Ratings {
    pub date: String,
    pub efficiency: Option<i32>,
    pub pleasure: Option<i32>,
    pub health: Option<i32>,
    pub sleep_hours: Option<f64>,
    pub sleep_quality: Option<i32>,
    pub exercise_minutes: Option<i32>,
    pub exercise_type: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WorkBlock {
    pub id: String,
    pub date: String,
    pub kind: String,
    pub start_ts: i64,
    pub end_ts: Option<i64>,
    pub planned_minutes: Option<i32>,
    pub tags: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: String,
    pub date: String,
    pub title: String,
    pub status: String,
    pub created_at: i64,
    pub completed_at: Option<i64>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Event {
    pub id: String,
    pub date: String,
    pub ts: i64,
    pub event_type: String,
    pub level: Option<i32>,
    pub trigger_type: Option<String>,
    pub duration_sec: Option<i32>,
    pub intensity: Option<i32>,
    pub media_flag: Option<String>,
    pub context: Option<String>,
    pub note: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TodayDTO {
    pub day_plan: Option<DayPlan>,
    pub ratings: Option<Ratings>,
    pub work_blocks: Vec<WorkBlock>,
    pub tasks: Vec<Task>,
    pub events: Vec<Event>,
}

#[derive(Debug, Deserialize)]
pub struct EventPayload {
    pub date: String,
    pub event_type: String,
    pub level: Option<i32>,
    pub trigger_type: Option<String>,
    pub duration_sec: Option<i32>,
    pub intensity: Option<i32>,
    pub media_flag: Option<String>,
    pub context: Option<String>,
    pub note: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct RatingsPayload {
    pub efficiency: Option<i32>,
    pub pleasure: Option<i32>,
    pub health: Option<i32>,
    pub sleep_hours: Option<f64>,
    pub sleep_quality: Option<i32>,
    pub exercise_minutes: Option<i32>,
    pub exercise_type: Option<String>,
}

// ── Query helpers ──

pub fn get_day_plan(conn: &Connection, date: &str) -> Result<Option<DayPlan>, String> {
    let mut stmt = conn
        .prepare("SELECT date, condition, random_seed, notes, created_at FROM day_plans WHERE date = ?1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt
        .query_map(params![date], |row| {
            Ok(DayPlan {
                date: row.get(0)?,
                condition: row.get(1)?,
                random_seed: row.get(2)?,
                notes: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    match rows.next() {
        Some(Ok(plan)) => Ok(Some(plan)),
        Some(Err(e)) => Err(e.to_string()),
        None => Ok(None),
    }
}

pub fn get_ratings(conn: &Connection, date: &str) -> Result<Option<Ratings>, String> {
    let mut stmt = conn
        .prepare("SELECT date, efficiency, pleasure, health, sleep_hours, sleep_quality, exercise_minutes, exercise_type, created_at, updated_at FROM ratings WHERE date = ?1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt
        .query_map(params![date], |row| {
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
        })
        .map_err(|e| e.to_string())?;
    match rows.next() {
        Some(Ok(r)) => Ok(Some(r)),
        Some(Err(e)) => Err(e.to_string()),
        None => Ok(None),
    }
}

pub fn get_work_blocks(conn: &Connection, date: &str) -> Result<Vec<WorkBlock>, String> {
    let mut stmt = conn
        .prepare("SELECT id, date, kind, start_ts, end_ts, planned_minutes, tags FROM work_blocks WHERE date = ?1 ORDER BY start_ts")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![date], |row| {
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
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

pub fn get_tasks(conn: &Connection, date: &str) -> Result<Vec<Task>, String> {
    let mut stmt = conn
        .prepare("SELECT id, date, title, status, created_at, completed_at, notes FROM tasks WHERE date = ?1 ORDER BY created_at")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![date], |row| {
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
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

pub fn get_events(conn: &Connection, date: &str) -> Result<Vec<Event>, String> {
    let mut stmt = conn
        .prepare("SELECT id, date, ts, event_type, level, trigger_type, duration_sec, intensity, media_flag, context, note FROM events WHERE date = ?1 ORDER BY ts")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![date], |row| {
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
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}
