# Arch Linux Graphical Installer — Setup Guide

A complete, step-by-step guide to building and deploying the Tauri-based graphical installer in your custom Arch Linux environment.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Repository Structure](#2-repository-structure)
3. [Environment Setup](#3-environment-setup)
4. [Development Workflow](#4-development-workflow)
5. [Production Build](#5-production-build)
6. [Boot Environment Configuration](#6-boot-environment-configuration)
7. [i3 & Startup Integration](#7-i3--startup-integration)
8. [Running the Installer](#8-running-the-installer)
9. [Install Script Details](#9-install-script-details)
10. [Troubleshooting](#10-troubleshooting)
11. [Verification Checklist](#11-verification-checklist)

---

## 1. Prerequisites

### Hardware & OS

- An x86_64, aarch64, or i686 Linux system
- At least 4 GB RAM (for building Rust)
- At least 10 GB disk space (for Rust toolchain + build artifacts)
- A running Arch Linux or Arch-based live environment

### Required System Tools

Install these before anything else:

```bash
sudo pacman -S --needed base-devel curl git webkit2gtk-4.1 gtk3 \
  librsvg openssl xdotool i3-wm ghostty lsblk util-linux
```

> **Note:** `ghostty` may not be in the official repos. Check the [Ghostty AUR package](https://aur.archlinux.org/packages/ghostty-git) or your custom live image.

---

## 2. Repository Structure

```text
tauri-installer/
├── src/                        # Frontend (React + TypeScript)
│   ├── main.tsx                # React entry point
│   ├── App.tsx                 # Root component — page routing
│   ├── index.css               # Global styles (Windows 11 OOBE theme)
│   ├── store/
│   │   └── installer.ts        # Zustand state — all wizard config
│   ├── tauri/
│   │   └── commands.ts         # Tauri IPC bindings + dev mocks
│   ├── components/
│   │   ├── Layout.tsx          # Shared card layout
│   │   ├── Footer.tsx          # Navigation footer with progress dots
│   │   └── SearchableSelect.tsx # Filterable option list
│   └── pages/
│       ├── Welcome.tsx
│       ├── RegionTimezone.tsx
│       ├── KeyboardLayout.tsx
│       ├── DiskSelection.tsx
│       ├── Filesystems.tsx
│       ├── Bootloader.tsx
│       ├── InstallType.tsx
│       ├── DesktopEnvironments.tsx
│       ├── LoginManager.tsx
│       ├── Authentication.tsx
│       ├── Services.tsx
│       ├── Summary.tsx
│       └── secondary/
│           ├── InstallerHelp.tsx
│           ├── RootPassword.tsx
│           ├── UserAccounts.tsx
│           └── AddUser.tsx
├── src-tauri/                  # Rust backend
│   ├── Cargo.toml
│   ├── build.rs
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs
│       └── commands/
│           ├── mod.rs
│           ├── system.rs       # Architecture, timezone, keyboard, network, FS
│           ├── disk.rs         # lsblk integration, cfdisk launcher
│           └── config.rs       # Config save, install script launcher
├── scripts/
│   ├── setup.sh                # One-time environment setup
│   ├── dev.sh                  # Start development server
│   ├── build.sh                # Production build + deploy to /installer
│   ├── startup.sh              # Boot-time startup: i3 + installer launcher
│   └── install.sh              # Full Arch Linux installation executor
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

---

## 3. Environment Setup

### Step 1 — Clone / extract the project

Place the `tauri-installer/` directory somewhere accessible, e.g.:

```bash
mkdir -p /opt/installer
cp -r tauri-installer/ /opt/installer/
cd /opt/installer/tauri-installer
```

### Step 2 — Run the automated setup script

```bash
chmod +x scripts/setup.sh
sudo scripts/setup.sh
```

This script will:

- Install all required system packages via `pacman`
- Install the Rust toolchain via `rustup` (if not present)
- Install Node.js and pnpm (if not present)
- Install the Tauri CLI via `cargo install`
- Install frontend npm dependencies via `pnpm install`
- Create `/installer/{bin,configs,scripts,logs}` directories
- Copy scripts to `/installer/scripts/`
- Write the system architecture to `/info/architexture`

### Step 3 — Verify the setup

```bash
rustc --version          # Rust 1.75+ recommended
cargo tauri --version    # Should print tauri-cli version
node --version           # Node 18+
pnpm --version           # pnpm 8+
ls /installer/           # bin/ configs/ scripts/ logs/
cat /info/architexture   # e.g. x86_64
```

---

## 4. Development Workflow

### Start the development server

```bash
cd /opt/installer/tauri-installer
./scripts/dev.sh
```

This runs `cargo tauri dev`, which:
- Starts Vite on `http://localhost:1420` (frontend with hot-reload)
- Compiles the Rust backend in debug mode
- Opens the Tauri window

### Frontend-only development (browser)

The frontend includes mock data that activates automatically when running outside Tauri. Open a browser:

```bash
pnpm run dev
# Then open http://localhost:1420 in your browser
```

All Tauri commands (`get_disks`, `get_keyboard_layouts`, etc.) return realistic mock data in this mode so you can develop the UI without a full Tauri build.

### Making changes

| File | What it controls |
|---|---|
| `src/store/installer.ts` | All wizard state and navigation logic |
| `src/tauri/commands.ts` | Tauri IPC bindings and mock data |
| `src/index.css` | All visual styling (CSS variables for theming) |
| `src/pages/*.tsx` | Individual wizard pages |
| `src-tauri/src/commands/system.rs` | Real system data detection (Rust) |
| `src-tauri/src/commands/disk.rs` | Disk/partition enumeration via lsblk |
| `src-tauri/src/commands/config.rs` | Config persistence and install launch |
| `scripts/install.sh` | The actual Arch installation pipeline |

---

## 5. Production Build

### Step 1 — Build and deploy

```bash
cd /opt/installer/tauri-installer
chmod +x scripts/build.sh
./scripts/build.sh
```

The build script:
1. Runs `pnpm build` (Vite + TypeScript compilation)
2. Runs `cargo tauri build` (Rust release binary)
3. Copies the binary to `/installer/bin/arch-installer`
4. Copies `install.sh` and `startup.sh` to `/installer/scripts/`

### Step 2 — Verify the binary

```bash
ls -lh /installer/bin/arch-installer
file /installer/bin/arch-installer
# Should show: ELF 64-bit LSB pie executable, x86-64
```

### Step 3 — Test launch manually

```bash
DISPLAY=:0 /installer/bin/arch-installer
```

---

## 6. Boot Environment Configuration

### Required: /info/architexture

The installer reads the system architecture from this file:

```bash
sudo mkdir -p /info
uname -m | sudo tee /info/architexture
# e.g. writes: x86_64
```

### Required: Installer directories

```bash
sudo mkdir -p /installer/{bin,configs,scripts,logs}
```

### Required: X server

The installer requires an X11 display. In your live environment, X must be started before `startup.sh` runs. Example with Xorg:

```bash
# In your init script or getty autologin:
Xorg :0 &
sleep 2
/installer/scripts/startup.sh
```

Or use `startx` with a `.xinitrc` that calls `startup.sh`.

### Optional: /etc/systemd/system/installer.service

If your live image uses systemd, create a service:

```ini
[Unit]
Description=Arch Linux Graphical Installer
After=graphical.target

[Service]
Type=simple
User=root
Environment=DISPLAY=:0
ExecStart=/installer/scripts/startup.sh
Restart=no

[Install]
WantedBy=graphical.target
```

```bash
sudo systemctl enable installer.service
```

---

## 7. i3 & Startup Integration

### How startup.sh works

`startup.sh` is the main entry point that:

1. Redirects all output to `/installer/logs/startup.log`
2. Sets required environment variables (`DISPLAY`, `XDG_RUNTIME_DIR`, WebKit flags)
3. Waits for the X server to become available (up to 15 seconds)
4. Launches i3 with no config (bare window manager)
5. Configures i3 — no borders, no status bar
6. Launches the installer binary and switches to workspace 1
7. Sends i3 a fullscreen command for the installer window
8. Waits for the installer to exit (which happens when "Start Installation" is clicked)

### cfdisk integration (Disk Selection page)

When the user clicks "Partition disks (cfdisk)":
1. Rust command `launch_cfdisk` sends i3 to workspace 2
2. Opens `ghostty` with `cfdisk` running inside
3. When cfdisk exits, the terminal closes
4. i3 switches back to workspace 1
5. The installer re-scans disks via `lsblk`

For this to work, `ghostty` must be installed and in `$PATH`:

```bash
which ghostty  # Should return a path
```

---

## 8. Running the Installer

### Development mode

```bash
./scripts/dev.sh
```

### Production mode (after build)

```bash
DISPLAY=:0 /installer/bin/arch-installer
```

### From boot (via startup.sh)

```bash
/installer/scripts/startup.sh
```

### Fullscreen mode

The `tauri.conf.json` is configured for fullscreen with no decorations. In development mode this is overridden for usability. In production, the window starts maximized and i3 makes it fullscreen.

---

## 9. Install Script Details

`install.sh` performs the full Arch Linux installation in 11 phases:

| Phase | Action |
|---|---|
| 1 | Format root (ext4/btrfs/xfs) and boot (FAT32) partitions |
| 2 | Mount `/mnt` (root) and `/mnt/boot` (EFI) |
| 3 | Update mirrorlist with `reflector` if network available |
| 4 | `pacstrap` — install base system |
| 5 | Generate `/etc/fstab` |
| 6 | Configure timezone, locale, keyboard, hostname, initramfs |
| 7 | Set root password, create user accounts, configure sudoers |
| 8 | Install bootloader (systemd-boot, GRUB, or EFI stub) |
| 9 | Install desktop environment(s) and login manager |
| 10 | Enable services: NetworkManager, Bluetooth, PipeWire/PulseAudio |
| 11 | Sync filesystem, save install config to `/mnt/etc/arch-installer/` |

The config file `/installer/configs/config.json` is the single source of truth for all phases.

---

## 10. Troubleshooting

### "Binary not found" after build

```bash
find src-tauri/target/release -maxdepth 1 -name "arch-installer"
# If empty, check the Rust build output for errors
cargo tauri build 2>&1 | grep -i error
```

### "X server not available" in startup.sh

```bash
# Check if Xorg is running
pgrep -a Xorg
# Check DISPLAY variable
echo $DISPLAY
# Try starting X manually
Xorg :0 -nolisten tcp &
sleep 2
DISPLAY=:0 xdpyinfo
```

### webkit2gtk errors at runtime

```bash
# Install all webkit2gtk dependencies
sudo pacman -S webkit2gtk-4.1 libayatana-appindicator
# Set fallback env var
export WEBKIT_DISABLE_DMABUF_RENDERER=1
DISPLAY=:0 /installer/bin/arch-installer
```

### lsblk returns empty / no disks

```bash
# Run lsblk manually to verify
lsblk --json --output NAME,TYPE,SIZE,MODEL,FSTYPE,LABEL,MOUNTPOINT --tree
# Ensure you have block devices
ls /dev/sd* /dev/nvme* /dev/vd* 2>/dev/null
```

### cfdisk / Ghostty doesn't open

```bash
which ghostty
# If not found, install from AUR:
# yay -S ghostty-git

# Verify i3-msg works
i3-msg workspace 2
```

### "Failed to load keyboard layouts" error

```bash
# Verify localectl is available
localectl list-keymaps | head -20
# Or check fallback directory
ls /usr/share/kbd/keymaps/
```

### Rust build fails: "Could not find WebKit"

```bash
sudo pacman -S webkit2gtk-4.1
# If 4.1 is not available, try:
sudo pacman -S webkit2gtk
# Then update Cargo.toml to use the available version
```

### Frontend TypeScript errors

```bash
pnpm run build
# Check for missing imports or type mismatches in output
```

### install.sh: "rootPartition is not set"

The config was not saved before calling `start_installation`. Verify:
```bash
cat /installer/configs/config.json
# Should contain all filled fields
```

---

## 11. Verification Checklist

Run through this checklist before using in production:

### Environment

- [ ] `/info/architexture` exists and contains the correct arch (e.g. `x86_64`)
- [ ] `/installer/bin/arch-installer` exists and is executable
- [ ] `/installer/scripts/install.sh` exists and is executable
- [ ] `/installer/scripts/startup.sh` exists and is executable
- [ ] X server starts successfully on `:0`
- [ ] i3 launches without errors
- [ ] ghostty is installed and accessible

### Installer UI

- [ ] Welcome page loads with network status indicator
- [ ] Region and timezone dropdowns populate from real system data
- [ ] Keyboard layouts load (from localectl or /usr/share/kbd/keymaps)
- [ ] Disk Selection page shows real block devices from lsblk
- [ ] cfdisk opens in a Ghostty terminal on workspace 2
- [ ] After cfdisk exits, disk list refreshes automatically
- [ ] Filesystem page shows filesystems supported by running kernel
- [ ] Bootloader page lists options based on detected architecture
- [ ] Authentication validates: root password required, at least one sudo user
- [ ] Summary page shows JSON preview of /installer/configs/config.json
- [ ] "Start Installation" writes config and launches install.sh in Ghostty

### Installation

- [ ] Partitions are formatted correctly (check with `lsblk -f` after)
- [ ] `/mnt` and `/mnt/boot` are mounted
- [ ] `pacstrap` completes successfully
- [ ] Bootloader is installed and grub/systemd-boot entry is created
- [ ] System reboots into the newly installed Arch environment

---

## Integration Notes

### Frontend ↔ Backend contract

All Tauri commands are declared in `src/tauri/commands.ts` and implemented in `src-tauri/src/commands/`. The interface contract is:

| Command | Input | Output |
|---|---|---|
| `get_disks` | none | `DiskInfo[]` |
| `get_keyboard_layouts` | none | `KeyboardLayout[]` |
| `get_regions` | none | `string[]` |
| `get_timezones` | `{ region: string }` | `string[]` |
| `get_architecture` | none | `string` |
| `check_network` | none | `NetworkStatus` |
| `get_supported_filesystems` | none | `string[]` |
| `get_bootloaders` | none | `BootloaderInfo[]` |
| `launch_cfdisk` | `{ partition?: string }` | `void` |
| `save_config` | `{ config: object }` | `void` |
| `start_installation` | none | `void` (app exits) |

### Adding new wizard pages

1. Create `src/pages/MyPage.tsx` using the `<Layout>` component
2. Add it to the `MAIN_PAGES` array in `src/App.tsx`
3. Update `TOTAL_STEPS` in `src/store/installer.ts`
4. Add any new state fields to the store
5. Add any new Rust commands to `src-tauri/src/commands/` and register them in `main.rs`

### Config schema

The config written to `/installer/configs/config.json` follows this shape:

```json
{
  "region": "Europe",
  "timezone": "London",
  "keyboardLayout": "us",
  "rootPartition": "/dev/sda2",
  "bootPartition": "/dev/sda1",
  "rootFilesystem": "ext4",
  "bootloader": "systemd-boot",
  "installType": "desktop",
  "desktopEnvironments": ["kde-plasma"],
  "loginManager": "sddm",
  "rootPassword": "...",
  "users": [
    { "username": "alice", "password": "...", "sudo": true }
  ],
  "bluetooth": true,
  "network": "networkmanager",
  "audio": "pipewire"
}
```
