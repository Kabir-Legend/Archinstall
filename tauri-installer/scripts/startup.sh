#!/usr/bin/env bash
# =============================================================================
# startup.sh — Installer environment startup script
# Launched by the init system or getty after boot.
# Initializes the environment, starts i3, and launches the installer fullscreen.
# =============================================================================

set -euo pipefail

INSTALLER_DIR="/installer"
BINARY="${INSTALLER_DIR}/bin/arch-installer"
LOG_DIR="${INSTALLER_DIR}/logs"
STARTUP_LOG="${LOG_DIR}/startup.log"

# ── 0. Redirect all output to startup log ────────────────────────────────
mkdir -p "$LOG_DIR"
exec > >(tee -a "$STARTUP_LOG") 2>&1
echo "[startup] $(date) — Starting installer environment"

# ── 1. Environment variables ──────────────────────────────────────────────
export DISPLAY=":0"
export XAUTHORITY="/root/.Xauthority"
export HOME="/root"
export XDG_RUNTIME_DIR="/tmp/runtime-root"
mkdir -p "$XDG_RUNTIME_DIR"
chmod 700 "$XDG_RUNTIME_DIR"

# Tauri / WebKit environment
export WEBKIT_DISABLE_DMABUF_RENDERER="1"
export GDK_BACKEND="x11"

# ── 2. Preflight checks ───────────────────────────────────────────────────
echo "[startup] Running preflight checks..."

# Check binary exists
if [[ ! -x "$BINARY" ]]; then
  echo "[startup] ERROR: Installer binary not found at $BINARY" >&2
  exit 1
fi

# Check X is available (wait up to 15 seconds)
for i in $(seq 1 15); do
  if xdpyinfo -display "$DISPLAY" &>/dev/null 2>&1; then
    echo "[startup] X server available on $DISPLAY"
    break
  fi
  if [[ $i -eq 15 ]]; then
    echo "[startup] ERROR: X server not available on $DISPLAY after 15s" >&2
    exit 1
  fi
  sleep 1
done

# ── 3. Initialize config state ────────────────────────────────────────────
mkdir -p "${INSTALLER_DIR}/configs"
if [[ ! -f "${INSTALLER_DIR}/configs/config.json" ]]; then
  echo '{}' > "${INSTALLER_DIR}/configs/config.json"
  echo "[startup] Initialized empty config.json"
fi

# ── 4. Launch i3 in the background ────────────────────────────────────────
echo "[startup] Launching i3..."
i3 --config /dev/null &
I3_PID=$!

# Wait for i3 to be ready
sleep 2

# Configure i3 workspace — no borders, no bar
i3-msg 'default_border none' 2>/dev/null || true
i3-msg 'hide_edge_borders both' 2>/dev/null || true

echo "[startup] i3 running (PID ${I3_PID})"

# ── 5. Launch installer fullscreen on workspace 1 ─────────────────────────
echo "[startup] Launching arch-installer..."
i3-msg 'workspace 1' 2>/dev/null || true

"$BINARY" &
INSTALLER_PID=$!
echo "[startup] Installer running (PID ${INSTALLER_PID})"

# Fullscreen after a short delay
sleep 1
i3-msg '[class="arch-installer"] fullscreen enable' 2>/dev/null || true

# ── 6. Wait for installer to exit ─────────────────────────────────────────
wait "$INSTALLER_PID"
EXIT_CODE=$?

echo "[startup] Installer exited with code ${EXIT_CODE}"

# After installer exits, keep i3/X session alive for install script terminal
wait "$I3_PID" 2>/dev/null || true
