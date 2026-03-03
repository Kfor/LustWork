# Testing Environment

## Prerequisites
- Rust stable >= 1.75 (`rustup update stable`)
- Node.js >= 18 LTS
- pnpm >= 8
- Tauri CLI (`@tauri-apps/cli` in devDependencies)
- macOS or Windows (for desktop app testing)

## Setup
```bash
pnpm install
```

## Running Tests

### Unit Tests (Command Parser)
```bash
npx vitest run
```

### Rust Integration Tests
```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

### TypeScript Type Check
```bash
npx tsc -b
```

### Frontend Build
```bash
pnpm build
```

### Full Tauri Dev (requires display)
```bash
npx tauri dev
```

## Manual E2E Testing
1. Run `npx tauri dev`
2. Press `Cmd+Shift+L` (macOS) or `Ctrl+Shift+L` (Windows) to open Quick Capture
3. Test commands: `reward L2 60`, `ejac`, `discomfort pain`, `lube`, `note test`, `task add test`, `work start`, `work stop`, `break start`
4. Verify ESC closes palette
5. Verify auto-close after command execution
6. Verify error display on invalid commands

## Notes
- E2E tests requiring Tauri window interaction cannot be automated in CI without a display server
- Rust integration tests cover DB operations, export logic, and settings CRUD
- Frontend build verification covers TypeScript correctness
