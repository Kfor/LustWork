# Lust Work — Desktop N-of-1 Experiment Tracker (Tauri v0.1 MVP)

## Background

用户需要一个本地、私密、极低负担的桌面工具，用于进行 N-of-1 自我实验——探索"身体奖励/刺激"对工作效率、愉悦感、健康的影响。核心理念是"少设计、多记录、后续用 AI 分析"。

产品定位：本地离线的"工作-奖励实验"记录器，提供便捷按钮、随机骰子、快速速记、结构化数据导出。

非定位：不是医疗器械、诊断工具或治疗建议系统。

## Target Users & Scenarios

- **用户**：进行个人 N-of-1 实验的个体研究者
- **场景 1**：每天早上打开应用，掷骰子决定当天实验条件（A/B/C），然后开始工作
- **场景 2**：工作中走神/烦躁时，一键打点记录奖励事件（L1-L4），附带触发原因和时长
- **场景 3**：工作日结束时，快速评分效率/愉悦/健康（1-7），导出数据给 AI 分析
- **场景 4**：通过全局快捷键快速打点，不中断当前工作流

## User Flow

### 主流程（每日）
1. 打开应用 → 今日面板
2. 掷骰子 → 生成当天 Condition（A/B/C）
3. 开始工作计时器（45min work / 5min break）
4. 工作中按需打点：奖励事件（L1-L4）、不适、射精等
5. 快速添加/完成任务
6. 收工前：日结评分（效率/愉悦/健康 1-7）
7. 按需导出数据（JSON/CSV）

### Quick Capture 流程
- `Cmd/Ctrl+Shift+L` 呼出命令面板
- 输入命令：`reward L2 60` / `ejac` / `discomfort pain` / `task add xxx` / `work start`
- 自动打时间戳，关闭面板

## Core Requirements

### R1: 今日面板（Today Dashboard）
- 单屏完成所有当日操作
- 模块从上到下：Header（日期+条件+导出）→ 工作计时器 → 奖励打点区 → 任务速记 → 日结评分 → 备注

### R2: 随机骰子（Daily Dice）
- 一键生成当天 Condition（A/B/C，均匀分布）
- 记录 `random_seed` 和 `roll_result` 以便复现
- 可选生成 1 个额外变量（exercise_plan: 无/轻/中）

### R3: 番茄钟/工作区块计时器
- Start Work（默认 45min）/ Start Break（默认 5min）/ Stop
- 显示今日累计 work mins / break mins
- 每个 block 记录 start_ts / end_ts / kind / planned_minutes

### R4: 事件快速打点
- L1/L2/L3/L4 一键按钮
- L2/L3 支持预设时长（+30s/+60s/+90s）和计时模式（Start/Stop）
- Trigger 下拉选择（mind_wander / irritability / task_start / milestone_done / break_time / other）
- 支持记录：reward / ejaculation / discomfort / lube / note / custom

### R5: 任务速记
- 输入框 + Enter 快速添加
- 列表显示，勾选完成
- 状态：todo / done / dropped

### R6: 日结评分
- Efficiency / Pleasure / Health 三个 1-7 评分
- 可选（折叠）：sleep_hours / sleep_quality / exercise_minutes / exercise_type

### R7: Quick Capture 命令面板
- 全局快捷键 `Cmd/Ctrl+Shift+L` 呼出
- 搜索式命令输入：`reward L2 60` / `ejac` / `discomfort pain` / `task add xxx` / `work start` / `work stop`
- 自动时间戳

### R8: 数据导出
- 格式：JSON（推荐）+ CSV
- 范围：当天 / 最近 7 天 / 全量
- JSON 结构按 Spec 8.1 定义
- CSV 分表：events.csv / work_blocks.csv / ratings.csv / tasks.csv

### R9: 数据持久化（SQLite）
- 5 张表：day_plans / ratings / work_blocks / tasks / events + settings
- UUID 主键（work_blocks / tasks / events）
- 日期主键（day_plans / ratings）
- 存储路径：系统 AppData/lust-work/lustwork.db

## Design / Constraints

### 技术栈
- **Tauri v2**（Rust backend + Web UI）
- **Frontend**: React + TypeScript + Vite
- **State**: Zustand
- **CSS**: Tailwind CSS（快速开发，风格简洁）
- **DB**: rusqlite（Rust 侧，同步即可）
- **Target**: macOS / Windows 优先

### 硬约束
1. **完全离线**：不联网、不内置云同步、不发送任何数据
2. **不存储媒体**：只存事件元数据，无音频/视频/截图落盘
3. **低负担**：任何一次打点操作 ≤ 2 次点击 / 1 次快捷键
4. **首屏优先**：最常用动作都在今日面板首屏
5. **无价值判断**：软件对行为只做记录，不做判断或强制限制

### SQLite Schema

```sql
CREATE TABLE day_plans (
    date TEXT PRIMARY KEY,
    condition TEXT NOT NULL,
    random_seed TEXT,
    notes TEXT,
    created_at INTEGER NOT NULL
);

CREATE TABLE ratings (
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

CREATE TABLE work_blocks (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    kind TEXT NOT NULL,
    start_ts INTEGER NOT NULL,
    end_ts INTEGER,
    planned_minutes INTEGER,
    tags TEXT
);

CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'todo',
    created_at INTEGER NOT NULL,
    completed_at INTEGER,
    notes TEXT
);

CREATE TABLE events (
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

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
```

### Tauri Commands (Rust → Frontend)

```
db_init() -> Result<()>
get_today(date: String) -> Result<TodayDTO>
roll_day_plan(date: String) -> Result<DayPlan>
set_day_plan(date: String, condition: String, seed: Option<String>) -> Result<()>
start_work_block(date: String, kind: String, planned_minutes: Option<i32>) -> Result<WorkBlock>
stop_work_block(block_id: String) -> Result<WorkBlock>
add_task(date: String, title: String) -> Result<Task>
update_task_status(task_id: String, status: String) -> Result<Task>
log_event(payload: EventPayload) -> Result<Event>
set_ratings(date: String, payload: RatingsPayload) -> Result<Ratings>
export_data(range: String, format: String) -> Result<String>
open_data_dir() -> Result<()>
get_settings() -> Result<Settings>
update_setting(key: String, value: String) -> Result<()>
```

### 前端组件树

```
App
├── TodayPage
│   ├── Header (date, condition badge, roll button, export button)
│   ├── WorkTimer (start/stop/break buttons, timer display, daily totals)
│   ├── RewardPanel (L1-L4 buttons, duration presets, trigger selector)
│   ├── TaskList (input, task items with checkbox)
│   ├── RatingsPanel (3x 1-7 sliders, collapsible sleep/exercise)
│   └── NotesSection (collapsible textarea)
├── QuickCapturePalette (global shortcut overlay)
├── SettingsPage (conditions, levels, triggers, timer defaults, shortcuts)
└── ExportDialog (range selector, format selector, export button)
```

### 默认配置值
- 番茄钟：work=45min, break=5min
- Condition 集合：A (Baseline), B (Stim/No-ejac), C (Stim/Ejac-allowed)
- Reward Level 标签：L1-L4
- Trigger 枚举：mind_wander, irritability, task_start, milestone_done, break_time, other
- Quick Capture 快捷键：Cmd/Ctrl+Shift+L

### 应用声明文本
> Lust Work 是自我记录与实验工具，不提供医疗建议；请优先关注身体不适信号并自行决定是否暂停。

## Environment Bootstrap

### Prerequisites
- **Rust**: stable (>=1.75), via rustup
- **Node.js**: >=18 LTS
- **pnpm**: >=8 (包管理器)
- **Tauri CLI**: `cargo install tauri-cli` (v2)
- **macOS**: Xcode Command Line Tools (`xcode-select --install`)
- **Windows**: Visual Studio Build Tools (C++ workload), WebView2

### 初始化命令

```bash
# 1. 确保工具链就绪
rustup update stable
cargo install tauri-cli

# 2. 在项目根目录创建 Tauri v2 + React + TS 项目
cd /Users/k/MyPlayground/LustWork
pnpm create tauri-app lust-work --template react-ts --manager pnpm
# 注意: 如果 scaffolding 工具不支持上述参数，则手动:
#   pnpm create vite lust-work --template react-ts
#   cd lust-work && pnpm install
#   pnpm add @tauri-apps/cli @tauri-apps/api
#   pnpm tauri init

# 3. 安装前端依赖
cd lust-work
pnpm install
pnpm add zustand @tauri-apps/api @tauri-apps/plugin-global-shortcut @tauri-apps/plugin-dialog @tauri-apps/plugin-fs @tauri-apps/plugin-shell
pnpm add -D tailwindcss @tailwindcss/vite

# 4. 添加 Rust 依赖 (src-tauri/Cargo.toml 的 [dependencies])
# rusqlite = { version = "0.31", features = ["bundled"] }
# uuid = { version = "1", features = ["v4"] }
# serde = { version = "1", features = ["derive"] }
# serde_json = "1"
# chrono = "0.4"
# rand = "0.8"
# csv = "1"
# tauri-plugin-global-shortcut = "2"
# tauri-plugin-dialog = "2"
# tauri-plugin-fs = "2"
# tauri-plugin-shell = "2"

# 5. 开发模式验证
pnpm tauri dev
```

### 健康检查

```bash
rustc --version && cargo --version
node --version && pnpm --version
cargo tauri --version
pnpm tauri dev  # 窗口打开、无 panic、控制台无红色错误
```

### E2E 可开始条件
- `pnpm tauri dev` 成功打开窗口
- SQLite 数据库文件在 AppData 中创建
- 基础 Tauri command 可从前端调用并返回数据

## Failure Recovery Runbook

### 1. Tauri dev 启动失败（Rust 编译错误）
- **故障信号**: `pnpm tauri dev` 报 Rust 编译错误
- **自救命令**: `cd src-tauri && cargo check 2>&1 | head -50` 定位错误；`cargo update` 更新依赖
- **验证命令**: `cargo check` 无错误
- **失败后下一步**: 检查 Cargo.toml 依赖版本兼容性，查看 crates.io 最新版本

### 2. 前端 Vite 构建失败
- **故障信号**: `pnpm build` 报 TypeScript 或 Vite 错误
- **自救命令**: `pnpm tsc --noEmit` 定位 TS 错误；`pnpm install` 确认依赖完整
- **验证命令**: `pnpm build` 成功
- **失败后下一步**: 检查 tsconfig.json 和 vite.config.ts 配置

### 3. SQLite 数据库初始化失败
- **故障信号**: 应用启动时 `db_init` 返回错误
- **自救命令**: 检查 AppData 目录权限；删除损坏的 db 文件重新初始化
- **验证命令**: 应用启动后 `get_today()` 返回有效数据
- **失败后下一步**: 检查 rusqlite bundled feature 是否正确启用

### 4. 全局快捷键注册失败
- **故障信号**: Quick Capture 面板无法通过快捷键呼出
- **自救命令**: 检查 Tauri globalShortcut 插件配置和 capabilities；检查是否有快捷键冲突
- **验证命令**: 按 Cmd/Ctrl+Shift+L 面板出现
- **失败后下一步**: 尝试其他快捷键组合；检查系统快捷键冲突

### 5. 导出文件写入失败
- **故障信号**: export_data 命令返回 IO 错误
- **自救命令**: 检查导出目录权限；使用 Tauri dialog 让用户选择目录
- **验证命令**: 导出后文件存在且 JSON/CSV 内容正确可解析
- **失败后下一步**: fallback 到 AppData 目录下导出

## Out of Scope (v0.1)

- 统计视图/图表（v0.2）
- 加密导出 zip（v0.2）
- System tray 快捷按钮（v0.2）
- Panic Lock（v0.2）
- 轻提示（discomfort 提醒等）（v0.2）
- 拖拽排序任务（v0.2）
- 云同步
- 媒体文件存储
- 多语言

## Additional Implementation Notes

### Port Configuration
- Dev server must use port **1422** (avoid 3000/1420/5173/8080)

### Git
- Commit all changes when complete
