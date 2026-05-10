#!/usr/bin/env bash
# =============================================================================
# build.sh — Build the Tauri installer for production
# Outputs a compiled binary and optional AppImage/deb bundle.
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

info() { echo -e "${CYAN}[build]${NC} $*"; }
ok()   { echo -e "${GREEN}[build]${NC} $*"; }
die()  { echo -e "${RED}[build]${NC} $*" >&2; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
INSTALLER_DIR="/installer"

cd "$PROJECT_DIR"

# Ensure Rust is in PATH
[[ -f "$HOME/.cargo/env" ]] && source "$HOME/.cargo/env"

# Verify required tools
command -v cargo &>/dev/null || die "cargo not found. Run scripts/setup.sh first."
command -v pnpm &>/dev/null  || die "pnpm not found. Run scripts/setup.sh first."

# ── Step 1: Frontend build ─────────────────────────────────────────────────
info "Step 1/3: Building frontend (Vite + TypeScript)..."
pnpm install --frozen-lockfile
pnpm run build
ok "Frontend build complete → dist/"

# ── Step 2: Tauri / Rust build ─────────────────────────────────────────────
info "Step 2/3: Building Tauri application (release mode)..."
cargo tauri build
ok "Tauri build complete."

# ── Step 3: Copy to /installer ─────────────────────────────────────────────
info "Step 3/3: Deploying to ${INSTALLER_DIR}..."

BINARY_PATH="$(find src-tauri/target/release -maxdepth 1 -name "arch-installer" -type f 2>/dev/null | head -1)"
if [[ -z "$BINARY_PATH" ]]; then
  die "Binary not found in src-tauri/target/release. Build may have failed."
fi

sudo mkdir -p "${INSTALLER_DIR}/bin"
sudo cp "$BINARY_PATH" "${INSTALLER_DIR}/bin/arch-installer"
sudo chmod +x "${INSTALLER_DIR}/bin/arch-installer"

sudo mkdir -p "${INSTALLER_DIR}/configs" "${INSTALLER_DIR}/logs"
sudo cp "$SCRIPT_DIR/install.sh" "${INSTALLER_DIR}/scripts/install.sh"
sudo cp "$SCRIPT_DIR/startup.sh" "${INSTALLER_DIR}/scripts/startup.sh"
sudo chmod +x "${INSTALLER_DIR}/scripts/"*.sh

ok "Deployed to ${INSTALLER_DIR}/bin/arch-installer"
echo ""
ok "=== Build complete ==="
echo -e "  Binary:       ${INSTALLER_DIR}/bin/arch-installer"
echo -e "  Startup:      ${INSTALLER_DIR}/scripts/startup.sh"
echo -e "  Install:      ${INSTALLER_DIR}/scripts/install.sh"
echo -e "  AppImage:     $(find src-tauri/target/release/bundle -name '*.AppImage' 2>/dev/null | head -1 || echo 'N/A')"
