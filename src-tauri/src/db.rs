use rusqlite::Connection;

pub fn init_db(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch("PRAGMA journal_mode=WAL;")?;
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
        );

        CREATE INDEX IF NOT EXISTS idx_work_blocks_date ON work_blocks(date);
        CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
        CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);",
    )
}
