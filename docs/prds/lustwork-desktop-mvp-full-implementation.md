# LustWork Desktop MVP — Full Implementation

## Background

Implement the complete LustWork Desktop MVP per the existing PRD at `docs/prds/lust-work-desktop-n-of-1-experiment-tracker-tauri-v0-1-mvp.md`. This is a Tauri v2 + React + TypeScript + Vite + Zustand + Tailwind CSS desktop app for N-of-1 self-experimentation tracking.

The current branch was reset to a clean slate. The existing task T1772004986755 covers project scaffold + Rust backend. Additional tasks are needed for frontend components, Quick Capture, Export/Settings, and integration polish.

## Target Users & Scenarios

- Individual N-of-1 experiment researchers tracking work-reward patterns
- Daily workflow: open app -> roll dice -> work timer -> event logging -> end-of-day ratings -> export

## User Flow

See PRD sections R1-R9 for complete user flow. Key paths:
1. Today Dashboard (single-screen daily workflow)
2. Quick Capture (global shortcut command palette)
3. Data Export (JSON/CSV)

## Core Requirements

Covered by PRD R1-R9. Task split follows PRD section order:
- T1: Project scaffold + full Rust backend (14 Tauri commands, 6 SQLite tables, all DTOs)
- T2: Today Dashboard frontend (Header, WorkTimer, RewardPanel, TaskList, RatingsPanel, NotesSection) + Zustand store
- T3: Quick Capture command palette (global shortcut, command parser, overlay UI)
- T4: ExportDialog + SettingsPage (JSON/CSV export, settings management)
- T5: Integration test, Vite port config, build verification, polish

## Design / Constraints

- **Tech stack**: Tauri v2, React 19, TypeScript, Vite 6, Zustand 5, Tailwind CSS 4
- **Fully offline**: No network calls
- **Vite dev server**: Port 1425 (HMR 1426) to avoid conflicts
- **SQLite**: rusqlite with bundled feature, stored in system AppData
- **Target**: macOS + Windows

## Environment Bootstrap

```bash
# Prerequisites: Rust stable (>=1.75), Node.js >=18, pnpm >=8
rustup update stable
cargo install tauri-cli

# Project is at /Users/k/MyPlayground/LustWork
# Scaffold Tauri v2 + React + TS if not already done
# Install frontend deps
pnpm install
pnpm add zustand @tauri-apps/api @tauri-apps/plugin-global-shortcut @tauri-apps/plugin-dialog @tauri-apps/plugin-fs @tauri-apps/plugin-shell
pnpm add -D tailwindcss @tailwindcss/vite

# Rust deps in src-tauri/Cargo.toml:
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

# Vite config: set server.port = 1425, server.strictPort = true
# HMR port: 1426

# Verify
pnpm tauri dev
```

## Failure Recovery Runbook

1. **Rust compile error**: `cd src-tauri && cargo check 2>&1 | head -50`; fix type errors; `cargo update` if dependency conflict
2. **Vite build fail**: `pnpm tsc --noEmit` to find TS errors; verify vite.config.ts
3. **SQLite init fail**: Check AppData dir permissions; delete corrupted db; re-run app
4. **Global shortcut fail**: Check Tauri plugin capabilities config; try alternate key combo
5. **Port conflict**: Ensure port 1425 free (`lsof -i :1425`); kill conflicting process

## Out of Scope

See PRD Out of Scope section (stats views, encryption, tray, panic lock, drag-sort, cloud sync, media storage, i18n).
