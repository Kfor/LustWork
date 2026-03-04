use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DayPlan {
    pub date: String,
    pub condition: Option<String>,
    pub random_seed: Option<String>,
    pub notes: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkBlock {
    pub id: String,
    pub date: String,
    pub kind: String,
    pub start_ts: i64,
    pub end_ts: Option<i64>,
    pub planned_minutes: Option<i32>,
    pub tags: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub date: String,
    pub title: String,
    pub status: String,
    pub created_at: i64,
    pub completed_at: Option<i64>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
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

#[derive(Debug, Serialize)]
pub struct TodayDTO {
    pub date: String,
    pub day_plan: Option<DayPlan>,
    pub ratings: Option<Ratings>,
    pub work_blocks: Vec<WorkBlock>,
    pub tasks: Vec<Task>,
    pub events: Vec<Event>,
}

pub type Settings = HashMap<String, String>;
