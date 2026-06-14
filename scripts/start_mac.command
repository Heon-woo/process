#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ ! -x "$ROOT_DIR/backend/.venv/bin/python" ]; then
  echo "Run scripts/setup_mac.command first."
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is not available. Run scripts/setup_mac.command first."
  exit 1
fi

cleanup() {
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

cd "$ROOT_DIR/backend"
.venv/bin/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

cd "$ROOT_DIR/frontend"
pnpm dev &
FRONTEND_PID=$!

echo "PASS is starting."
echo "Portal: http://localhost:5173"
echo "API docs: http://localhost:8000/docs"
echo "Press Ctrl+C to stop."

wait

