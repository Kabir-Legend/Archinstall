#!/usr/bin/env bash
# =============================================================================
# dev.sh — Start the Tauri development server
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Make sure Rust is in PATH
[[ -f "$HOME/.cargo/env" ]] && source "$HOME/.cargo/env"

echo "[dev] Starting Tauri dev server (Vite on :1420 + Rust backend)..."
cargo tauri dev
