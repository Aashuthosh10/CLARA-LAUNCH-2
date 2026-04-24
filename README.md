# CLARA-LAUNCH

AI receptionist kiosk with a React/Vite frontend, FastAPI WebSocket backend, PostgreSQL/pgvector RAG store, LLM replies, and Sarvam speech services.

## Canonical Runtime

| Service | Default | Source |
| --- | --- | --- |
| Backend HTTP | `http://localhost:6969` | `backend/config/settings.py` |
| Backend WebSocket | `ws://localhost:6969/ws/clara` | `frontend/src/App.tsx`, `frontend/.env.example` |
| Frontend dev server | `http://localhost:5176` | `frontend/package.json`, `frontend/vite.config.ts` |
| PostgreSQL | `127.0.0.1:5432` | `docker-compose.yml` |

## Project Structure

```text
backend/              FastAPI app, WebSocket transport, RAG, LLM, TTS, audio pipeline
frontend/             React 19 kiosk UI
config/               Runtime UI config
docs/                 Hardware, Postgres, voice, and baseline notes
scripts/              Local launch and data helper scripts
scripts/db/           PostgreSQL/pgvector schema
docker-compose.yml    Local PostgreSQL + pgvector service
college_knowledge.txt Source knowledge file for ingestion workflows
```

## Setup

1. Copy `.env.example` to `.env`.
2. Fill in `GROQ_API_KEY`, `SARVAM_API_KEY`, and `POSTGRES_PASSWORD`.
3. Install backend dependencies:

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r backend/requirements/requirements.txt
```

For local test runs, install the dev requirements after the backend dependencies:

```bash
pip install -r backend/requirements/requirements-dev.txt
```

4. Install frontend dependencies:

```bash
cd frontend
npm install
```

## Run Locally

Start the database:

```bash
docker compose up -d
docker exec -i clara-postgres psql -U clara_user -d clara_db < scripts/db/init_pgvector.sql
```

Start the backend:

```bash
. .venv/bin/activate
python -m backend.main
```

Canonical backend run command is `python -m backend.main` (keeps import paths stable).

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open `http://localhost:5176`. The frontend uses `VITE_WS_URL=ws://localhost:6969/ws/clara` by default.

## Knowledge Ingestion

After PostgreSQL is running and the schema is applied, ingest the college knowledge store:

```bash
python -m backend.tools.ingest_college_knowledge_pg
```

## Verification

Backend health:

```bash
curl http://localhost:6969/health
```

Frontend build:

```bash
cd frontend
npm run build
```

Backend tests:

```bash
python -m pytest backend/tests
```

WebSocket smoke test:

```bash
python -m backend.tools.ws_smoketest
```

End-to-end smoke bundle:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/smoke.ps1
```

Cross-platform backend smoke:

```bash
python -m backend.tools.smoke --url ws://127.0.0.1:6969/ws/clara
```

## How To Verify Backend Hardening

1. Start PostgreSQL:

```bash
docker compose up -d
```

2. Apply idempotent schema:

```bash
docker exec -i clara-postgres psql -U clara_user -d clara_db < scripts/db/init_pgvector.sql
```

3. Start backend (canonical):

```bash
python -m backend.main
```

4. Run one-command backend smoke:

```bash
python -m backend.tools.smoke --url ws://127.0.0.1:6969/ws/clara
```

5. Verify persistence tables and recent writes:

```bash
psql -h 127.0.0.1 -p 5432 -U clara_user -d clara_db -f backend/tools/db_verify.sql
```

6. Compute latency p50/p95 from persisted timings:

```bash
psql -h 127.0.0.1 -p 5432 -U clara_user -d clara_db -v LIMIT_TURNS=200 -f backend/tools/latency_p50_p95.sql
```

## Notes

- Keep `.env` private; do not commit secrets.
- The WebSocket protocol is `state` plus `payload`; the route remains `/ws/clara`.
- If `POSTGRES_PASSWORD` is missing or the DB is down, `/health` reports degraded status and RAG falls back gracefully.
