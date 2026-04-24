# System Architecture

## Metadata
- Status: In Review
- Owner: Person 3 Fullstack
- Last Updated: 2026-04-24


## Major Components
- Frontend kiosk app: React + Vite + Tailwind + Framer Motion.
- Backend API/orchestrator: FastAPI + WebSocket endpoint `/ws/clara`.
- AI services: Groq (generation), Sarvam STT/TTS, RAG retrieval layer.
- Data persistence: sessions, turns, errors, timings for ops and QA.

## Request Lifecycle
1. Frontend opens authenticated websocket and initializes session context.
2. User submits text/voice turn action.
3. Backend validates payload and executes orchestrated pipeline.
4. Backend emits progress/terminal events; frontend renders output and voice playback.
5. Turn ends with deterministic `done` or structured `error`.

## Reliability Design
- One active turn per session.
- Provider retry/backoff with degradation controls.
- Strict schema and action handling to avoid undefined behavior.

See: [[WebSocket Contract]], [[Voice Pipeline]], [[RAG Flow]], [[Frontend State Flow]]
