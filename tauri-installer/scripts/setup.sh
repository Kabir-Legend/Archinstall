#!/usr/bin/env bash
# =============================================================================
# setup.sh — One-time setup for the Arch installer development environment
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "[setup] Installing system dependencies..."
sudo pacman -S --noconfirm --needed \
  base-devel curl git \
  webkit2gtk-4.1 gtk3 librsvg openssl \
  util-linux \
  i3-wm ghostty \
  xdotool \
  networkmanager pipewire pipewire-pulse bluez

echo "[setup] System packages done."

# Rust
if ! command -v rustc &>/dev/null; then
  echo "[setup] Installing Rust..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
  source "$HOME/.cargo/env"
fi
echo "[setup] Rust: $(rustc --version)"

# Tauri CLI
if ! cargo tauri --version &>/dev/null 2>&1; then
  echo "[setup] Installing Tauri CLI..."
  cargo install tauri-cli --version "^2.0"
fi
echo "[setup] Tauri CLI: $(cargo tauri --version)"

# Node deps — run npm install directly inside tauri-installer/
# (avoids triggering any parent workspace preinstall guards)
echo "[setup] Installing frontend dependencies..."
cd "$PROJECT_DIR"
npm install
echo "[setup] Frontend dependencies done."

# Installer directories
echo "[setup] Creating /installer directories..."
sudo mkdir -p /installer/{bin,configs,scripts,logs}
sudo cp "$SCRIPT_DIR"/*.sh /installer/scripts/
sudo chmod +x /installer/scripts/*.sh

# Architecture file
if [[ ! -f /info/architexture ]]; then
  sudo mkdir -p /info
  uname -m | sudo tee /info/architexture > /dev/null
fi
echo "[setup] Architecture: $(cat /info/architexture)"

echo ""
echo "[setup] Done! Run ./scripts/dev.sh to start development."
