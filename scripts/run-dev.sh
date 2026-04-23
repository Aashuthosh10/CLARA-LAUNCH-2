#!/bin/bash
# Start backend in background, then frontend.
# Backend port comes from .env (PORT=6969). Frontend must use same port in frontend/.env.local (VITE_WS_URL=ws://localhost:6969/ws/clara).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# Load PORT from .env (default 6969)
PORT=6969
if [ -f .env ]; then
  val=$(grep -E '^\s*PORT\s*=' .env | head -1 | sed 's/.*=\s*//')
  [ -n "$val" ] && PORT="$val"
fi
export PORT
# Use project Node if present (no system npm required)
if [ -d "$ROOT/.node/bin" ]; then
  export PATH="$ROOT/.node/bin:$PATH"
fi
if [ ! -d .venv ]; then
  echo "Creating virtualenv..."
  python3 -m venv .venv
  .venv/bin/pip install -q -r backend/requirements/requirements.txt
fi
if [ ! -d frontend/node_modules ]; then
  echo "Installing frontend dependencies..."
  (cd frontend && npm install)
fi
echo "Starting backend at http://localhost:$PORT ..."
.venv/bin/python backend/main.py &
BACKEND_PID=$!
trap "kill $BACKEND_PID 2>/dev/null" EXIT
sleep 2
echo "Starting frontend at http://localhost:5176 ..."
cd frontend && exec npm run dev
