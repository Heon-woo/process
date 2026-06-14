#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "[PASS] Backend environment setup"
cd "$ROOT_DIR/backend"

PYTHON_BIN=""
for candidate in python3.11 python3.10 python3; do
  if command -v "$candidate" >/dev/null 2>&1; then
    if "$candidate" -c 'import sys; raise SystemExit(not ((3, 10) <= sys.version_info[:2] <= (3, 11)))'; then
      PYTHON_BIN="$candidate"
      break
    fi
  fi
done

if [ -z "$PYTHON_BIN" ]; then
  echo "Python 3.10 or 3.11 is required."
  exit 1
fi

"$PYTHON_BIN" -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt

echo "[PASS] Frontend environment setup"
cd "$ROOT_DIR/frontend"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20 is required. Install it from https://nodejs.org/ and run this file again."
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable
  corepack prepare pnpm@9.15.9 --activate
fi

pnpm install
echo "[PASS] Setup completed."
