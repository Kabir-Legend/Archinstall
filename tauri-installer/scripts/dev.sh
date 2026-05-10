#!/usr/bin/env bash
# =============================================================================
# dev.sh — Start the Tauri development server with hot-reload
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Ensure Rust is in PATH
[[ -f "$HOME/.cargo/env" ]] && source "$HOME/.cargo/env"

echo "[dev] Starting Tauri development server..."
echo "[dev] Frontend: http://localhost:1420 (Vite)"
echo "[dev] Backend:  Rust (src-tauri/)"
echo ""

cargo tauri dev
