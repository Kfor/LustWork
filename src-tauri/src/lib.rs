mod commands;
mod db;
mod models;

use db::Database;
use tauri::{Emitter, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to resolve app data dir");

            let database = Database::new(data_dir).expect("failed to open database");
            database.init_tables().expect("failed to init db tables");
            app.manage(database);

            // Register global shortcut Cmd/Ctrl+Shift+L
            let shortcut = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyL);
            let handle = app.handle().clone();
            app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_handler(move |_app, _shortcut, _event| {
                        if let Some(window) = handle.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = handle.emit("quick-capture", ());
                        }
                    })
                    .build(),
            )?;
            let _ = app.global_shortcut().register(shortcut);

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::db_init,
            commands::get_today,
            commands::roll_day_plan,
            commands::set_day_plan,
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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
