# Arch Linux Graphical Installer

A bootable, fullscreen Tauri-based graphical installer for Arch Linux. Runs inside i3, provides a Windows 11 OOBE-style wizard UI, and writes a complete installation config that drives a real Arch install script.

## Run & Operate

### Tauri Installer (desktop app — take to your Arch environment)

- `cd tauri-installer && ./scripts/setup.sh` — one-time setup (Rust, Node, Tauri CLI, system deps)
- `cd tauri-installer && ./scripts/dev.sh` — start Tauri dev server (hot-reload)
- `cd tauri-installer && pnpm run dev` — frontend-only (browser, mock data)
- `cd tauri-installer && ./scripts/build.sh` — production build → deploys to /installer/bin/
- `/installer/scripts/startup.sh` — boot-time launcher: starts i3 + installer fullscreen

### Workspace API server (placeholder, not used by the installer)

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages

## Stack

### Tauri installer

- Tauri 2 (desktop app shell)
- React 18 + TypeScript 5 (frontend)
- Vite 5 (frontend build)
- Zustand (state management — all wizard config)
- CSS custom properties — no UI library (Windows 11 OOBE theme)
- Rust backend: lsblk, localectl, ping, i3-msg, ghostty integration

### Workspace (pre-existing scaffold)

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5, DB: PostgreSQL + Drizzle ORM

## Where things live

- `tauri-installer/` — complete Tauri desktop application
- `tauri-installer/src/pages/` — all 12 wizard pages + 4 secondary pages
- `tauri-installer/src/store/installer.ts` — Zustand store (single source of truth for all config)
- `tauri-installer/src/tauri/commands.ts` — Tauri IPC bindings + browser mock data
- `tauri-installer/src-tauri/src/commands/` — Rust backend: system.rs, disk.rs, config.rs
- `tauri-installer/scripts/install.sh` — 11-phase Arch installation executor
- `tauri-installer/scripts/startup.sh` — boot-time startup: X check, i3 launch, installer fullscreen
- `tauri-installer/SETUP.md` — complete setup guide

## Architecture decisions

- Zustand flat store holds all installer config + navigation state. Secondary pages (RootPassword, AddUser, etc.) are rendered as overlay replacements of the main card, not modals, to keep the single-card layout consistent.
- Tauri command bindings in `commands.ts` include browser-mode mock data that activates automatically when `__TAURI_INTERNALS__` is absent — enabling pure-frontend development without a Rust build.
- All backend data (disks, keyboard layouts, timezones, bootloaders) is read from real Linux system sources. The Rust commands read from `/proc`, `/usr/share/zoneinfo`, `lsblk --json`, `localectl`, `ping`, and `/info/architexture`. No hardcoded lists.
- DesktopEnvironments step is skipped in navigation when `installType === 'minimal'` — handled in the Zustand store's `getNextStep`/`getPrevStep` functions.
- `install.sh` is a standalone bash script driven entirely by `/installer/configs/config.json`. It uses Python 3 (available in all Arch live envs) to parse JSON without extra deps.

## Product

A 12-step graphical wizard that configures and installs Arch Linux:
1. Welcome (network status) → 2. Region/Timezone → 3. Keyboard Layout → 4. Disk Selection (with cfdisk integration) → 5. Filesystems → 6. Bootloader → 7. Install Type → 8. Desktop Environments → 9. Login Manager → 10. Authentication → 11. Services → 12. Summary + Install

Secondary pages: Installer Help, Root Password, User Accounts, Add User Account.

## Gotchas

- The installer is a Tauri desktop app — it cannot run in the Replit browser preview. Take the `tauri-installer/` folder to an Arch Linux system and follow SETUP.md.
- Run `scripts/setup.sh` before `scripts/dev.sh` or `scripts/build.sh` — it installs Rust, pnpm, Tauri CLI, and system webkit2gtk dependencies.
- `/info/architexture` must exist on the target system (setup.sh creates it).
- `ghostty` must be installed for the cfdisk disk partitioning integration to work.
- The Rust `launch_cfdisk` command uses `i3-msg` — the installer must be running inside i3 for cfdisk to open on workspace 2 and return to workspace 1.

## Pointers

- Full setup guide: `tauri-installer/SETUP.md`
- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
