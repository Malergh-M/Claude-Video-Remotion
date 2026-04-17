#!/usr/bin/env bash
# NVIDIA stock chart routine — runs every 5 minutes.
# Usage: bash scripts/start-nvidia-routine.sh
# Stop with:  Ctrl-C  (or kill the PID shown at startup)

set -euo pipefail

INTERVAL=300   # seconds (5 minutes)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"

echo "╔══════════════════════════════════════════╗"
echo "║   NVDA Stock Chart Routine — every 5 min  ║"
echo "╚══════════════════════════════════════════╝"
echo "  PID: $$  |  Stop with Ctrl-C"
echo ""

cd "$ROOT"

run_once() {
  node scripts/nvidia-stock-routine.mjs
}

# Run immediately, then loop
while true; do
  run_once || echo "  [WARN] Check failed — will retry next cycle"
  echo ""
  echo "  Next check in $((INTERVAL / 60)) minutes…"
  sleep "$INTERVAL"
done
