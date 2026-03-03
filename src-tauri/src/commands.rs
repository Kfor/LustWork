use crate::db::*;
use chrono::Utc;
use rand::Rng;
use rusqlite::params;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn get_today(state: State<DbState>, date: String) -> Result<TodayDTO, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    Ok(TodayDTO {
        day_plan: get_day_plan(&conn, &date)?,
        ratings: get_ratings(&conn, &date)?,
        work_blocks: get_work_blocks(&conn, &date)?,
        tasks: get_tasks(&conn, &date)?,
        events: get_events(&conn, &date)?,
    })
}

#[tauri::command]
pub fn roll_day_plan(state: State<DbState>, date: String) -> Result<DayPlan, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut rng = rand::thread_rng();
    let seed: u64 = rng.gen();
    let conditions = ["A", "B", "C"];
    let idx = (seed % 3) as usize;
    let condition = conditions[idx].to_string();
    let now = Utc::now().timestamp();

    conn.execute(
        "INSERT OR REPLACE INTO day_plans (date, condition, random_seed, notes, created_at) VALUES (?1, ?2, ?3, (SELECT notes FROM day_plans WHERE date = ?1), ?4)",
        params![date, condition, seed.to_string(), now],
    )
    .map_err(|e| e.to_string())?;

    get_day_plan(&conn, &date)?.ok_or_else(|| "Failed to create day plan".into())
}

#[tauri::command]
pub fn set_day_plan(
    state: State<DbState>,
    date: String,
    condition: String,
    seed: Option<String>,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().timestamp();
    conn.execute(
        "INSERT OR REPLACE INTO day_plans (date, condition, random_seed, notes, created_at) VALUES (?1, ?2, ?3, (SELECT notes FROM day_plans WHERE date = ?1), ?4)",
        params![date, condition, seed, now],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn set_day_notes(
    state: State<DbState>,
    date: String,
    notes: String,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().timestamp();
    // Upsert: if day_plan exists, update notes; otherwise create with empty condition
    let existing = get_day_plan(&conn, &date)?;
    if existing.is_some() {
        conn.execute(
            "UPDATE day_plans SET notes = ?1 WHERE date = ?2",
            params![notes, date],
        )
        .map_err(|e| e.to_string())?;
    } else {
        conn.execute(
            "INSERT INTO day_plans (date, condition, random_seed, notes, created_at) VALUES (?1, ?2, NULL, ?3, ?4)",
            params![date, "", notes, now],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn start_work_block(
    state: State<DbState>,
    date: String,
    kind: String,
    planned_minutes: Option<i32>,
) -> Result<WorkBlock, String> {
    if kind != "work" && kind != "break" {
        return Err(format!("Invalid kind: {}. Must be 'work' or 'break'", kind));
    }
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp();
    conn.execute(
        "INSERT INTO work_blocks (id, date, kind, start_ts, end_ts, planned_minutes, tags) VALUES (?1, ?2, ?3, ?4, NULL, ?5, NULL)",
        params![id, date, kind, now, planned_minutes],
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
pub fn stop_work_block(state: State<DbState>, block_id: String) -> Result<WorkBlock, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().timestamp();
    let updated = conn.execute(
        "UPDATE work_blocks SET end_ts = ?1 WHERE id = ?2 AND end_ts IS NULL",
        params![now, block_id],
    )
    .map_err(|e| e.to_string())?;
    if updated == 0 {
        return Err(format!("Work block '{}' not found or already stopped", block_id));
    }

    let mut stmt = conn
        .prepare("SELECT id, date, kind, start_ts, end_ts, planned_minutes, tags FROM work_blocks WHERE id = ?1")
        .map_err(|e| e.to_string())?;
    let block = stmt
        .query_row(params![block_id], |row| {
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
    Ok(block)
}

#[tauri::command]
pub fn add_task(state: State<DbState>, date: String, title: String) -> Result<Task, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp();
    conn.execute(
        "INSERT INTO tasks (id, date, title, status, created_at, completed_at, notes) VALUES (?1, ?2, ?3, 'todo', ?4, NULL, NULL)",
        params![id, date, title, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(Task {
        id,
        date,
        title,
        status: "todo".into(),
        created_at: now,
        completed_at: None,
        notes: None,
    })
}

#[tauri::command]
pub fn update_task_status(
    state: State<DbState>,
    task_id: String,
    status: String,
) -> Result<Task, String> {
    if status != "todo" && status != "done" && status != "dropped" {
        return Err(format!("Invalid status: {}. Must be 'todo', 'done', or 'dropped'", status));
    }
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let completed_at = if status == "done" {
        Some(Utc::now().timestamp())
    } else {
        None
    };
    conn.execute(
        "UPDATE tasks SET status = ?1, completed_at = ?2 WHERE id = ?3",
        params![status, completed_at, task_id],
    )
    .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, date, title, status, created_at, completed_at, notes FROM tasks WHERE id = ?1")
        .map_err(|e| e.to_string())?;
    let task = stmt
        .query_row(params![task_id], |row| {
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
    Ok(task)
}

#[tauri::command]
pub fn log_event(state: State<DbState>, payload: EventPayload) -> Result<Event, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp();
    conn.execute(
        "INSERT INTO events (id, date, ts, event_type, level, trigger_type, duration_sec, intensity, media_flag, context, note) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![id, payload.date, now, payload.event_type, payload.level, payload.trigger_type, payload.duration_sec, payload.intensity, payload.media_flag, payload.context, payload.note],
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
    state: State<DbState>,
    date: String,
    payload: RatingsPayload,
) -> Result<Ratings, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = Utc::now().timestamp();
    conn.execute(
        "INSERT OR REPLACE INTO ratings (date, efficiency, pleasure, health, sleep_hours, sleep_quality, exercise_minutes, exercise_type, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, COALESCE((SELECT created_at FROM ratings WHERE date = ?1), ?9), ?9)",
        params![date, payload.efficiency, payload.pleasure, payload.health, payload.sleep_hours, payload.sleep_quality, payload.exercise_minutes, payload.exercise_type, now],
    )
    .map_err(|e| e.to_string())?;

    get_ratings(&conn, &date)?.ok_or_else(|| "Failed to save ratings".into())
}

#[tauri::command]
pub fn export_data(
    state: State<DbState>,
    range: String,
    format: String,
) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let (op, date_val) = match range.as_str() {
        "today" => {
            let today = chrono::Local::now().format("%Y-%m-%d").to_string();
            ("=", today)
        }
        "week" => {
            let today = chrono::Local::now();
            let week_ago = today - chrono::Duration::days(7);
            (">=", week_ago.format("%Y-%m-%d").to_string())
        }
        _ => (">=", "1970-01-01".to_string()),
    };

    if format == "json" {
        export_json(&conn, op, &date_val)
    } else {
        export_csv(&conn, op, &date_val)
    }
}

fn export_json(conn: &rusqlite::Connection, op: &str, date_val: &str) -> Result<String, String> {
    let day_plans = query_day_plans(conn, op, date_val)?;
    let ratings = query_all_ratings(conn, op, date_val)?;
    let work_blocks = query_all_work_blocks(conn, op, date_val)?;
    let tasks = query_all_tasks(conn, op, date_val)?;
    let events = query_all_events(conn, op, date_val)?;

    let export = serde_json::json!({
        "exported_at": Utc::now().to_rfc3339(),
        "day_plans": day_plans,
        "ratings": ratings,
        "work_blocks": work_blocks,
        "tasks": tasks,
        "events": events,
    });

    serde_json::to_string_pretty(&export).map_err(|e| e.to_string())
}

fn export_csv(conn: &rusqlite::Connection, op: &str, date_val: &str) -> Result<String, String> {
    let mut result = String::new();

    // Events CSV
    result.push_str("=== events.csv ===\n");
    result.push_str("id,date,ts,event_type,level,trigger_type,duration_sec,intensity,media_flag,context,note\n");
    let events = query_all_events(conn, op, date_val)?;
    for e in &events {
        result.push_str(&format!(
            "{},{},{},{},{},{},{},{},{},{},{}\n",
            e.id, e.date, e.ts, csv_escape(&e.event_type),
            opt_i32(e.level), csv_escape_opt(&e.trigger_type), opt_i32(e.duration_sec),
            opt_i32(e.intensity), csv_escape_opt(&e.media_flag), csv_escape_opt(&e.context), csv_escape_opt(&e.note)
        ));
    }

    // Work blocks CSV
    result.push_str("\n=== work_blocks.csv ===\n");
    result.push_str("id,date,kind,start_ts,end_ts,planned_minutes,tags\n");
    let blocks = query_all_work_blocks(conn, op, date_val)?;
    for b in &blocks {
        result.push_str(&format!(
            "{},{},{},{},{},{},{}\n",
            b.id, b.date, b.kind, b.start_ts,
            opt_i64(b.end_ts), opt_i32(b.planned_minutes), csv_escape_opt(&b.tags)
        ));
    }

    // Ratings CSV
    result.push_str("\n=== ratings.csv ===\n");
    result.push_str("date,efficiency,pleasure,health,sleep_hours,sleep_quality,exercise_minutes,exercise_type\n");
    let ratings = query_all_ratings(conn, op, date_val)?;
    for r in &ratings {
        result.push_str(&format!(
            "{},{},{},{},{},{},{},{}\n",
            r.date, opt_i32(r.efficiency), opt_i32(r.pleasure), opt_i32(r.health),
            opt_f64(r.sleep_hours), opt_i32(r.sleep_quality), opt_i32(r.exercise_minutes), csv_escape_opt(&r.exercise_type)
        ));
    }

    // Tasks CSV
    result.push_str("\n=== tasks.csv ===\n");
    result.push_str("id,date,title,status,created_at,completed_at,notes\n");
    let tasks = query_all_tasks(conn, op, date_val)?;
    for t in &tasks {
        result.push_str(&format!(
            "{},{},{},{},{},{},{}\n",
            t.id, t.date, csv_escape(&t.title), t.status, t.created_at,
            opt_i64(t.completed_at), csv_escape_opt(&t.notes)
        ));
    }

    Ok(result)
}

fn csv_escape(s: &str) -> String {
    if s.contains(',') || s.contains('"') || s.contains('\n') {
        format!("\"{}\"", s.replace('"', "\"\""))
    } else {
        s.to_string()
    }
}

fn csv_escape_opt(v: &Option<String>) -> String {
    match v {
        Some(s) => csv_escape(s),
        None => String::new(),
    }
}

fn opt_i32(v: Option<i32>) -> String {
    v.map(|x| x.to_string()).unwrap_or_default()
}
fn opt_i64(v: Option<i64>) -> String {
    v.map(|x| x.to_string()).unwrap_or_default()
}
fn opt_f64(v: Option<f64>) -> String {
    v.map(|x| x.to_string()).unwrap_or_default()
}

fn query_day_plans(conn: &rusqlite::Connection, op: &str, date_val: &str) -> Result<Vec<DayPlan>, String> {
    let sql = format!("SELECT date, condition, random_seed, notes, created_at FROM day_plans WHERE date {} ?1 ORDER BY date", op);
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![date_val], |row| {
            Ok(DayPlan {
                date: row.get(0)?,
                condition: row.get(1)?,
                random_seed: row.get(2)?,
                notes: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

fn query_all_ratings(conn: &rusqlite::Connection, op: &str, date_val: &str) -> Result<Vec<Ratings>, String> {
    let sql = format!("SELECT date, efficiency, pleasure, health, sleep_hours, sleep_quality, exercise_minutes, exercise_type, created_at, updated_at FROM ratings WHERE date {} ?1 ORDER BY date", op);
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![date_val], |row| {
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
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

fn query_all_work_blocks(conn: &rusqlite::Connection, op: &str, date_val: &str) -> Result<Vec<WorkBlock>, String> {
    let sql = format!("SELECT id, date, kind, start_ts, end_ts, planned_minutes, tags FROM work_blocks WHERE date {} ?1 ORDER BY start_ts", op);
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![date_val], |row| {
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

fn query_all_tasks(conn: &rusqlite::Connection, op: &str, date_val: &str) -> Result<Vec<Task>, String> {
    let sql = format!("SELECT id, date, title, status, created_at, completed_at, notes FROM tasks WHERE date {} ?1 ORDER BY created_at", op);
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![date_val], |row| {
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

fn query_all_events(conn: &rusqlite::Connection, op: &str, date_val: &str) -> Result<Vec<Event>, String> {
    let sql = format!("SELECT id, date, ts, event_type, level, trigger_type, duration_sec, intensity, media_flag, context, note FROM events WHERE date {} ?1 ORDER BY ts", op);
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![date_val], |row| {
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

#[tauri::command]
pub fn open_data_dir() -> Result<(), String> {
    let path = db_path();
    if let Some(parent) = path.parent() {
        #[cfg(target_os = "macos")]
        {
            std::process::Command::new("open")
                .arg(parent)
                .spawn()
                .map_err(|e| e.to_string())?;
        }
        #[cfg(target_os = "windows")]
        {
            std::process::Command::new("explorer")
                .arg(parent)
                .spawn()
                .map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn get_settings(state: State<DbState>) -> Result<std::collections::HashMap<String, String>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT key, value FROM settings")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|e| e.to_string())?;
    let mut map = std::collections::HashMap::new();
    for r in rows {
        let (k, v) = r.map_err(|e| e.to_string())?;
        map.insert(k, v);
    }
    Ok(map)
}

#[tauri::command]
pub fn update_setting(
    state: State<DbState>,
    key: String,
    value: String,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
        params![key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
