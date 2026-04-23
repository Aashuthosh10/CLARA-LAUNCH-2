#!/bin/bash
# Run CLARA backend (API + WebSocket). Port from .env (default 6969).
# Frontend: cd frontend && npm install && npm run dev; set VITE_WS_URL=ws://localhost:6969/ws/clara in frontend/.env.local
set -e
cd "$(dirname "$0")/.."
PORT=6969
if [ -f .env ]; then
  val=$(grep -E '^\s*PORT\s*=' .env | head -1 | sed 's/.*=\s*//')
  [ -n "$val" ] && PORT="$val"
fi
if [ ! -d .venv ]; then
  echo "Creating virtualenv..."
  python3 -m venv .venv
  .venv/bin/pip install -q -r backend/requirements/requirements.txt
fi
echo "Starting CLARA backend at http://localhost:$PORT"
export PORT
exec .venv/bin/python backend/main.py
