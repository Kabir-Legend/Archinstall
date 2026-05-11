#!/usr/bin/env bash
# =============================================================================
# dev.sh — Start the Tauri development server
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

[[ -f "$HOME/.cargo/env" ]] && source "$HOME/.cargo/env"

# Refresh the Cargo lock file so the Rust crate versions match the npm packages.
# This is needed when Cargo.toml version specs have changed since last build.
echo "[dev] Updating Cargo dependencies..."
cargo update -p tauri -p tauri-build -p tauri-plugin-shell \
  --manifest-path src-tauri/Cargo.toml 2>/dev/null || true

echo "[dev] Starting Tauri dev server (Vite + Rust)..."
echo "[dev] Vite will start automatically on http://localhost:1420"
cargo tauri dev
