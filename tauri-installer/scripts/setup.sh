#!/usr/bin/env bash
# =============================================================================
# setup.sh — Arch Installer development environment setup
# Run this once on your Arch Linux system to install all prerequisites.
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[setup]${NC} $*"; }
ok()    { echo -e "${GREEN}[setup]${NC} $*"; }
warn()  { echo -e "${YELLOW}[setup]${NC} $*"; }
die()   { echo -e "${RED}[setup]${NC} $*" >&2; exit 1; }

INSTALLER_DIR="/installer"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# ── 1. System packages ─────────────────────────────────────────────────────
info "Updating pacman and installing system dependencies..."
sudo pacman -Sy --noconfirm \
  base-devel \
  curl \
  webkit2gtk-4.1 \
  gtk3 \
  libayatana-appindicator \
  librsvg \
  openssl \
  xdotool \
  i3-wm \
  i3status \
  ghostty \
  cfdisk \
  lsblk \
  util-linux \
  networkmanager \
  pipewire \
  pipewire-pulse \
  bluez \
  || warn "Some packages may not be available. Continue anyway."

ok "System packages installed."

# ── 2. Rust toolchain ─────────────────────────────────────────────────────
if ! command -v rustc &>/dev/null; then
  info "Installing Rust via rustup..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
  source "$HOME/.cargo/env"
  ok "Rust installed: $(rustc --version)"
else
  ok "Rust already installed: $(rustc --version)"
fi

# ── 3. Node.js ────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  info "Installing Node.js via pacman..."
  sudo pacman -S --noconfirm nodejs npm
fi
ok "Node.js: $(node --version)"

# ── 4. pnpm ───────────────────────────────────────────────────────────────
if ! command -v pnpm &>/dev/null; then
  info "Installing pnpm..."
  npm install -g pnpm
fi
ok "pnpm: $(pnpm --version)"

# ── 5. Tauri CLI ──────────────────────────────────────────────────────────
if ! command -v cargo-tauri &>/dev/null; then
  info "Installing Tauri CLI..."
  cargo install tauri-cli --version "^2.0"
fi
ok "Tauri CLI installed."

# ── 6. Frontend dependencies ──────────────────────────────────────────────
info "Installing frontend npm dependencies..."
cd "$PROJECT_DIR"
pnpm install
ok "Frontend dependencies installed."

# ── 7. Installer directories ──────────────────────────────────────────────
info "Creating /installer directory structure..."
sudo mkdir -p \
  "${INSTALLER_DIR}/configs" \
  "${INSTALLER_DIR}/scripts" \
  "${INSTALLER_DIR}/logs"

# Copy scripts
sudo cp "$SCRIPT_DIR/"*.sh "${INSTALLER_DIR}/scripts/"
sudo chmod +x "${INSTALLER_DIR}/scripts/"*.sh
ok "Installer directories created."

# ── 8. /info directory (architecture) ─────────────────────────────────────
if [[ ! -f /info/architexture ]]; then
  sudo mkdir -p /info
  uname -m | sudo tee /info/architexture > /dev/null
  ok "Architecture detected: $(cat /info/architexture)"
fi

# ── Done ──────────────────────────────────────────────────────────────────
echo ""
ok "=== Setup complete ==="
echo -e "  Run ${CYAN}./scripts/dev.sh${NC} to start the development server"
echo -e "  Run ${CYAN}./scripts/build.sh${NC} to build for production"
