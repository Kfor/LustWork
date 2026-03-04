use crate::types::*;
use crate::AppState;
use chrono::Utc;
use rand::Rng;
use rusqlite::params;
use uuid::Uuid;

#[tauri::command]
pub fn db_init(state: tauri::State<'_, AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::init_db(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_today(date: String, state: tauri::State<'_, AppState>) -> Result<TodayDTO, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let day_plan = query_day_plans(&conn, &date, &date)?.into_iter().next();
    let ratings = query_ratings(&conn, &date, &date)?.into_iter().next();
    let work_blocks = query_work_blocks(&conn, &date, &date)?;
    let tasks = query_tasks(&conn, &date, &date)?;
    let events = query_events(&conn, &date, &date)?;

    Ok(TodayDTO {
        date,
        day_plan,
        ratings,
        work_blocks,
        tasks,
        events,
    })
}

#[tauri::command]
pub fn roll_day_plan(date: String, state: tauri::State<'_, AppState>) -> Result<DayPlan, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mut rng = rand::thread_rng();
    let seed: u64 = rng.gen();
    let conditions = ["A", "B", "C"];
    let condition = conditions[seed as usize % 3].to_string();
    let seed_str = seed.to_string();
    let now = Utc::now().timestamp();

    conn.execute(
        "INSERT INTO day_plans (date, condition, random_seed, notes, created_at) VALUES (?1, ?2, ?3, NULL, ?4)
         ON CONFLICT(date) DO UPDATE SET condition = ?2, random_seed = ?3",
        params![&date, &condition, &seed_str, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(DayPlan {
        date,
        condition: Some(condition),
        random_seed: Some(seed_str),
        notes: None,
        created_at: now,
    })
}

#[tauri::command]
pub fn set_day_plan(
    date: String,
    condition: Option<String>,
    seed: Option<String>,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().timestamp();

    conn.execute(
        "INSERT INTO day_plans (date, condition, random_seed, notes, created_at) VALUES (?1, ?2, ?3, NULL, ?4)
         ON CONFLICT(date) DO UPDATE SET condition = ?2, random_seed = ?3",
        params![&date, &condition, &seed, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn start_work_block(
    date: String,
    kind: String,
    planned_minutes: Option<i32>,
    state: tauri::State<'_, AppState>,
) -> Result<WorkBlock, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp();

    conn.execute(
        "INSERT INTO work_blocks (id, date, kind, start_ts, end_ts, planned_minutes, tags) VALUES (?1, ?2, ?3, ?4, NULL, ?5, NULL)",
        params![&id, &date, &kind, now, planned_minutes],
    )
    .map_err(|e| e.to_string())?;

    Ok(WorkBlock {
        id,
        date,
        kind,
        start_ts: now,
        end_ts: None,
        planned_minutes,
        tags: None,
    })
}

#[tauri::command]
pub fn stop_work_block(
    block_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<WorkBlock, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().timestamp();

    conn.execute(
        "UPDATE work_blocks SET end_ts = ?1 WHERE id = ?2",
        params![now, &block_id],
    )
    .map_err(|e| e.to_string())?;

    if conn.changes() == 0 {
        return Err(format!("Work block not found: {}", block_id));
    }

    conn.query_row(
        "SELECT id, date, kind, start_ts, end_ts, planned_minutes, tags FROM work_blocks WHERE id = ?1",
        params![&block_id],
        |row| {
            Ok(WorkBlock {
                id: row.get(0)?,
                date: row.get(1)?,
                kind: row.get(2)?,
                start_ts: row.get(3)?,
                end_ts: row.get(4)?,
                planned_minutes: row.get(5)?,
                tags: row.get(6)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_task(
    date: String,
    title: String,
    state: tauri::State<'_, AppState>,
) -> Result<Task, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp();

    conn.execute(
        "INSERT INTO tasks (id, date, title, status, created_at, completed_at, notes) VALUES (?1, ?2, ?3, 'todo', ?4, NULL, NULL)",
        params![&id, &date, &title, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(Task {
        id,
        date,
        title,
        status: "todo".to_string(),
        created_at: now,
        completed_at: None,
        notes: None,
    })
}

#[tauri::command]
pub fn update_task_status(
    task_id: String,
    status: String,
    state: tauri::State<'_, AppState>,
) -> Result<Task, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().timestamp();
    let completed_at: Option<i64> = if status == "done" { Some(now) } else { None };

    conn.execute(
        "UPDATE tasks SET status = ?1, completed_at = ?2 WHERE id = ?3",
        params![&status, completed_at, &task_id],
    )
    .map_err(|e| e.to_string())?;

    if conn.changes() == 0 {
        return Err(format!("Task not found: {}", task_id));
    }

    conn.query_row(
        "SELECT id, date, title, status, created_at, completed_at, notes FROM tasks WHERE id = ?1",
        params![&task_id],
        |row| {
            Ok(Task {
                id: row.get(0)?,
                date: row.get(1)?,
                title: row.get(2)?,
                status: row.get(3)?,
                created_at: row.get(4)?,
                completed_at: row.get(5)?,
                notes: row.get(6)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn log_event(
    payload: EventPayload,
    state: tauri::State<'_, AppState>,
) -> Result<Event, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp();

    conn.execute(
        "INSERT INTO events (id, date, ts, event_type, level, trigger_type, duration_sec, intensity, media_flag, context, note)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            &id,
            &payload.date,
            now,
            &payload.event_type,
            payload.level,
            &payload.trigger_type,
            payload.duration_sec,
            payload.intensity,
            &payload.media_flag,
            &payload.context,
            &payload.note,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(Event {
        id,
        date: payload.date,
        ts: now,
        event_type: payload.event_type,
        level: payload.level,
        trigger_type: payload.trigger_type,
        duration_sec: payload.duration_sec,
        intensity: payload.intensity,
        media_flag: payload.media_flag,
        context: payload.context,
        note: payload.note,
    })
}

#[tauri::command]
pub fn set_ratings(
    date: String,
    payload: RatingsPayload,
    state: tauri::State<'_, AppState>,
) -> Result<Ratings, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().timestamp();

    conn.execute(
        "INSERT INTO ratings (date, efficiency, pleasure, health, sleep_hours, sleep_quality, exercise_minutes, exercise_type, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
         ON CONFLICT(date) DO UPDATE SET efficiency=?2, pleasure=?3, health=?4, sleep_hours=?5, sleep_quality=?6, exercise_minutes=?7, exercise_type=?8, updated_at=?10",
        params![
            &date,
            payload.efficiency,
            payload.pleasure,
            payload.health,
            payload.sleep_hours,
            payload.sleep_quality,
            payload.exercise_minutes,
            &payload.exercise_type,
            now,
            now,
        ],
    )
    .map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT date, efficiency, pleasure, health, sleep_hours, sleep_quality, exercise_minutes, exercise_type, created_at, updated_at FROM ratings WHERE date = ?1",
        params![&date],
        |row| {
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
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn export_data(
    range: String,
    format: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let today = Utc::now().format("%Y-%m-%d").to_string();
    let (start_date, end_date) = match range.as_str() {
        "today" => (today.clone(), today),
        "week" => {
            let week_ago = (Utc::now() - chrono::Duration::days(7))
                .format("%Y-%m-%d")
                .to_string();
            let today = Utc::now().format("%Y-%m-%d").to_string();
            (week_ago, today)
        }
        _ => ("0000-01-01".to_string(), "9999-12-31".to_string()),
    };

    let day_plans = query_day_plans(&conn, &start_date, &end_date)?;
    let ratings_list = query_ratings(&conn, &start_date, &end_date)?;
    let work_blocks = query_work_blocks(&conn, &start_date, &end_date)?;
    let tasks = query_tasks(&conn, &start_date, &end_date)?;
    let events = query_events(&conn, &start_date, &end_date)?;

    match format.as_str() {
        "json" => {
            let export = serde_json::json!({
                "exported_at": Utc::now().to_rfc3339(),
                "range": range,
                "day_plans": day_plans,
                "ratings": ratings_list,
                "work_blocks": work_blocks,
                "tasks": tasks,
                "events": events,
            });
            serde_json::to_string_pretty(&export).map_err(|e| e.to_string())
        }
        "csv" => {
            let result = serde_json::json!({
                "day_plans.csv": serialize_csv(&day_plans)?,
                "ratings.csv": serialize_csv(&ratings_list)?,
                "work_blocks.csv": serialize_csv(&work_blocks)?,
                "tasks.csv": serialize_csv(&tasks)?,
                "events.csv": serialize_csv(&events)?,
            });
            serde_json::to_string(&result).map_err(|e| e.to_string())
        }
        _ => Err(format!("Unsupported format: {}", format)),
    }
}

#[tauri::command]
pub fn open_data_dir(state: tauri::State<'_, AppState>) -> Result<(), String> {
    let path = &state.data_dir;
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_settings(state: tauri::State<'_, AppState>) -> Result<Settings, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT key, value FROM settings")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(rows.into_iter().collect())
}

#[tauri::command]
pub fn update_setting(
    key: String,
    value: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = ?2",
        params![&key, &value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

// --- helpers ---

fn serialize_csv<T: serde::Serialize>(records: &[T]) -> Result<String, String> {
    let mut wtr = csv::Writer::from_writer(vec![]);
    for record in records {
        wtr.serialize(record).map_err(|e| e.to_string())?;
    }
    String::from_utf8(wtr.into_inner().map_err(|e| e.to_string())?).map_err(|e| e.to_string())
}

fn query_day_plans(
    conn: &rusqlite::Connection,
    start: &str,
    end: &str,
) -> Result<Vec<DayPlan>, String> {
    let mut stmt = conn
        .prepare("SELECT date, condition, random_seed, notes, created_at FROM day_plans WHERE date >= ?1 AND date <= ?2 ORDER BY date")
        .map_err(|e| e.to_string())?;
    let result = stmt
        .query_map(params![start, end], |row| {
            Ok(DayPlan {
                date: row.get(0)?,
                condition: row.get(1)?,
                random_seed: row.get(2)?,
                notes: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(result)
}

fn query_ratings(
    conn: &rusqlite::Connection,
    start: &str,
    end: &str,
) -> Result<Vec<Ratings>, String> {
    let mut stmt = conn
        .prepare("SELECT date, efficiency, pleasure, health, sleep_hours, sleep_quality, exercise_minutes, exercise_type, created_at, updated_at FROM ratings WHERE date >= ?1 AND date <= ?2 ORDER BY date")
        .map_err(|e| e.to_string())?;
    let result = stmt
        .query_map(params![start, end], |row| {
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
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(result)
}

fn query_work_blocks(
    conn: &rusqlite::Connection,
    start: &str,
    end: &str,
) -> Result<Vec<WorkBlock>, String> {
    let mut stmt = conn
        .prepare("SELECT id, date, kind, start_ts, end_ts, planned_minutes, tags FROM work_blocks WHERE date >= ?1 AND date <= ?2 ORDER BY start_ts")
        .map_err(|e| e.to_string())?;
    let result = stmt
        .query_map(params![start, end], |row| {
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
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(result)
}

fn query_tasks(
    conn: &rusqlite::Connection,
    start: &str,
    end: &str,
) -> Result<Vec<Task>, String> {
    let mut stmt = conn
        .prepare("SELECT id, date, title, status, created_at, completed_at, notes FROM tasks WHERE date >= ?1 AND date <= ?2 ORDER BY created_at")
        .map_err(|e| e.to_string())?;
    let result = stmt
        .query_map(params![start, end], |row| {
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
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(result)
}

fn query_events(
    conn: &rusqlite::Connection,
    start: &str,
    end: &str,
) -> Result<Vec<Event>, String> {
    let mut stmt = conn
        .prepare("SELECT id, date, ts, event_type, level, trigger_type, duration_sec, intensity, media_flag, context, note FROM events WHERE date >= ?1 AND date <= ?2 ORDER BY ts")
        .map_err(|e| e.to_string())?;
    let result = stmt
        .query_map(params![start, end], |row| {
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
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(result)
}
