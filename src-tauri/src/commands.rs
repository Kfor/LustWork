use crate::db::Database;
use crate::models::*;
use rand::Rng;
use tauri::{AppHandle, Manager, State};

type CmdResult<T> = Result<T, String>;

fn map_err<E: std::fmt::Display>(e: E) -> String {
    e.to_string()
}

#[tauri::command]
pub fn db_init(db: State<Database>) -> CmdResult<()> {
    db.init_tables().map_err(map_err)
}

#[tauri::command]
pub fn get_today(date: String, db: State<Database>) -> CmdResult<TodayDTO> {
    let day_plan = db.get_day_plan(&date).map_err(map_err)?;
    let ratings = db.get_ratings(&date).map_err(map_err)?;
    let work_blocks = db.get_work_blocks(&date).map_err(map_err)?;
    let tasks = db.get_tasks(&date).map_err(map_err)?;
    let events = db.get_events(&date).map_err(map_err)?;
    Ok(TodayDTO {
        day_plan,
        ratings,
        work_blocks,
        tasks,
        events,
    })
}

#[tauri::command]
pub fn roll_day_plan(date: String, db: State<Database>) -> CmdResult<DayPlan> {
    let mut rng = rand::thread_rng();
    let conditions = ["A", "B", "C"];
    let idx = rng.gen_range(0..conditions.len());
    let condition = conditions[idx].to_string();
    let seed = format!("{}", rng.gen::<u64>());
    let now = chrono::Utc::now().timestamp();

    let plan = DayPlan {
        date: date.clone(),
        condition,
        random_seed: Some(seed),
        notes: None,
        created_at: now,
    };
    db.upsert_day_plan(&plan).map_err(map_err)?;
    Ok(plan)
}

#[tauri::command]
pub fn set_day_plan(
    date: String,
    condition: String,
    seed: Option<String>,
    db: State<Database>,
) -> CmdResult<()> {
    let now = chrono::Utc::now().timestamp();
    let plan = DayPlan {
        date,
        condition,
        random_seed: seed,
        notes: None,
        created_at: now,
    };
    db.upsert_day_plan(&plan).map_err(map_err)
}

#[tauri::command]
pub fn start_work_block(
    date: String,
    kind: String,
    planned_minutes: Option<i32>,
    db: State<Database>,
) -> CmdResult<WorkBlock> {
    let now = chrono::Utc::now().timestamp();
    let block = WorkBlock {
        id: uuid::Uuid::new_v4().to_string(),
        date,
        kind,
        start_ts: now,
        end_ts: None,
        planned_minutes,
        tags: None,
    };
    db.insert_work_block(&block).map_err(map_err)?;
    Ok(block)
}

#[tauri::command]
pub fn stop_work_block(block_id: String, db: State<Database>) -> CmdResult<WorkBlock> {
    let now = chrono::Utc::now().timestamp();
    db.update_work_block_end(&block_id, now).map_err(map_err)
}

#[tauri::command]
pub fn add_task(date: String, title: String, db: State<Database>) -> CmdResult<Task> {
    let now = chrono::Utc::now().timestamp();
    let task = Task {
        id: uuid::Uuid::new_v4().to_string(),
        date,
        title,
        status: "todo".to_string(),
        created_at: now,
        completed_at: None,
        notes: None,
    };
    db.insert_task(&task).map_err(map_err)?;
    Ok(task)
}

#[tauri::command]
pub fn update_task_status(
    task_id: String,
    status: String,
    db: State<Database>,
) -> CmdResult<Task> {
    db.update_task(&task_id, &status).map_err(map_err)
}

#[tauri::command]
pub fn log_event(payload: EventPayload, db: State<Database>) -> CmdResult<Event> {
    let now = chrono::Utc::now().timestamp();
    let event = Event {
        id: uuid::Uuid::new_v4().to_string(),
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
    };
    db.insert_event(&event).map_err(map_err)?;
    Ok(event)
}

#[tauri::command]
pub fn set_ratings(
    date: String,
    payload: RatingsPayload,
    db: State<Database>,
) -> CmdResult<Ratings> {
    db.upsert_ratings(&date, &payload).map_err(map_err)
}

#[tauri::command]
pub fn export_data(
    range: String,
    format: String,
    db: State<Database>,
) -> CmdResult<String> {
    let data = db.export_all_for_range(&range).map_err(map_err)?;

    match format.as_str() {
        "json" => serde_json::to_string_pretty(&data).map_err(map_err),
        "csv" => {
            let mut result = String::new();

            result.push_str("=== events.csv ===\n");
            result.push_str("id,date,ts,event_type,level,trigger_type,duration_sec,intensity,media_flag,context,note\n");
            for e in &data.events {
                result.push_str(&format!(
                    "{},{},{},{},{},{},{},{},{},{},{}\n",
                    e.id, e.date, e.ts, e.event_type,
                    e.level.map_or(String::new(), |v| v.to_string()),
                    e.trigger_type.as_deref().unwrap_or(""),
                    e.duration_sec.map_or(String::new(), |v| v.to_string()),
                    e.intensity.map_or(String::new(), |v| v.to_string()),
                    e.media_flag.as_deref().unwrap_or(""),
                    e.context.as_deref().unwrap_or(""),
                    e.note.as_deref().unwrap_or("")
                ));
            }

            result.push_str("\n=== work_blocks.csv ===\n");
            result.push_str("id,date,kind,start_ts,end_ts,planned_minutes,tags\n");
            for b in &data.work_blocks {
                result.push_str(&format!(
                    "{},{},{},{},{},{},{}\n",
                    b.id, b.date, b.kind, b.start_ts,
                    b.end_ts.map_or(String::new(), |v| v.to_string()),
                    b.planned_minutes.map_or(String::new(), |v| v.to_string()),
                    b.tags.as_deref().unwrap_or("")
                ));
            }

            result.push_str("\n=== ratings.csv ===\n");
            result.push_str("date,efficiency,pleasure,health,sleep_hours,sleep_quality,exercise_minutes,exercise_type\n");
            for r in &data.ratings {
                result.push_str(&format!(
                    "{},{},{},{},{},{},{},{}\n",
                    r.date,
                    r.efficiency.map_or(String::new(), |v| v.to_string()),
                    r.pleasure.map_or(String::new(), |v| v.to_string()),
                    r.health.map_or(String::new(), |v| v.to_string()),
                    r.sleep_hours.map_or(String::new(), |v| v.to_string()),
                    r.sleep_quality.map_or(String::new(), |v| v.to_string()),
                    r.exercise_minutes.map_or(String::new(), |v| v.to_string()),
                    r.exercise_type.as_deref().unwrap_or("")
                ));
            }

            result.push_str("\n=== tasks.csv ===\n");
            result.push_str("id,date,title,status,created_at,completed_at,notes\n");
            for t in &data.tasks {
                result.push_str(&format!(
                    "{},{},{},{},{},{},{}\n",
                    t.id, t.date, t.title, t.status, t.created_at,
                    t.completed_at.map_or(String::new(), |v| v.to_string()),
                    t.notes.as_deref().unwrap_or("")
                ));
            }

            Ok(result)
        }
        _ => Err("Unsupported format. Use 'json' or 'csv'.".to_string()),
    }
}

#[tauri::command]
pub fn open_data_dir(app: AppHandle) -> CmdResult<()> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&data_dir)
            .spawn()
            .map_err(map_err)?;
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&data_dir)
            .spawn()
            .map_err(map_err)?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&data_dir)
            .spawn()
            .map_err(map_err)?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_settings(db: State<Database>) -> CmdResult<std::collections::HashMap<String, String>> {
    let settings = db.get_settings().map_err(map_err)?;
    let mut map = std::collections::HashMap::new();
    for s in settings {
        map.insert(s.key, s.value);
    }
    Ok(map)
}

#[tauri::command]
pub fn update_setting(key: String, value: String, db: State<Database>) -> CmdResult<()> {
    db.upsert_setting(&key, &value).map_err(map_err)
}
