mod commands;
mod db;

use db::{DbState, open_db};
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let conn = open_db().expect("Failed to open database");

    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(DbState(Mutex::new(conn)))
        .invoke_handler(tauri::generate_handler![
            commands::get_today,
            commands::roll_day_plan,
            commands::set_day_plan,
            commands::set_day_notes,
            commands::start_work_block,
            commands::stop_work_block,
            commands::add_task,
            commands::update_task_status,
            commands::log_event,
            commands::set_ratings,
            commands::export_data,
            commands::open_data_dir,
            commands::get_settings,
            commands::update_setting,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
