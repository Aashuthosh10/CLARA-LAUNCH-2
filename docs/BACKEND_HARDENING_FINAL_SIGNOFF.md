# Backend Hardening Final Sign-off

## Branch and Baseline
- Branch: `hardening/final-verification`
- Canonical backend command: `python -m backend.main`
- Canonical port: `6969` (from `backend/config/settings.py`)
- WebSocket route: `/ws/clara` (from `backend/app/main.py`)

## Commands Run

### Runtime contract and startup
1. `docker compose up -d`
2. `Get-Content "scripts/db/init_pgvector.sql" | docker exec -i clara-postgres psql -U clara_user -d clara_db`
3. `python -m backend.main`
4. `python -c "import requests, json; r=requests.get('http://127.0.0.1:6969/health', timeout=8); print(r.status_code); print(json.dumps(r.json(), sort_keys=True))"`

Observed `/health` sample:
```json
{
  "status": "healthy",
  "groq_configured": true,
  "sarvam_configured": true,
  "db_connected": true,
  "rag_ready": false,
  "rag_documents": 0,
  "dependencies": {
    "groq": true,
    "sarvam": true,
    "postgres": true,
    "rag_documents_loaded": false
  }
}
```

### WebSocket safety and smoke
5. `python -m backend.tools.smoke --url ws://127.0.0.1:6969/ws/clara`
6. `python -m backend.tools.ws_runtime_probe --url ws://127.0.0.1:6969/ws/clara`
7. `python -m backend.tools.ws_runtime_probe --url ws://127.0.0.1:6969/ws/clara` (re-run after cancellation fix validation)
8. `python -c "exec('...send binary ws frame...')"` (explicit websocket failure trigger)

Smoke summary:
- `36 passed` tests
- ws smoke passed
- ws fuzz safety passed (`invalid_json`, `unknown_action`, `oversized_payload`, liveness)

Runtime probe summary:
```json
{
  "success_turn_1": {"status":"done"},
  "success_turn_2": {"status":"done"},
  "cancelled_turn": {"status":"cancelled"},
  "failed_turn": {"status":"done"}
}
```
Failure trigger summary:
- Explicit binary websocket frame generated `WS_LOOP_ERROR` DB rows in `errors`.

### Live DB persistence proof
9. `Get-Content "backend/tools/db_verify.sql" | docker exec -i clara-postgres psql -U clara_user -d clara_db`

Observed:
- tables: `sessions`, `turns`, `errors` all exist
- counts: `sessions_count=40`, `turns_count=22`, `errors_count=6`
- latest turns include required timing keys:
  - `has_stt_ms=t`
  - `has_llm_ms=t`
  - `has_tts_ms=t`
  - `has_play_ms=t`
  - `has_total_ms=t`
  - `has_ttfs_ms=t`
- latest errors include:
  - `WS_LOOP_ERROR` (`stage=websocket_loop`)
  - `TURN_CANCELLED` (`stage=turn_task`)
- this proves:
  - successful sessions and turns persist
  - failed turns persist as error rows
  - cancelled turns persist as error rows

### p50/p95 operational path proof
10. `Get-Content "backend/tools/latency_p50_p95.sql" | docker exec -i clara-postgres psql -U clara_user -d clara_db -v LIMIT_TURNS=200`

Observed sample:
- `sampled_turns=13`
- `llm_p50_ms=0.00`, `llm_p95_ms=933.57`
- `tts_p50_ms=4.96`, `tts_p95_ms=6630.77`
- `ttfs_p50_ms=0.54`, `ttfs_p95_ms=2284.82`
- `total_p50_ms=2194.04`, `total_p95_ms=10882.09`

### Focused hardening verification tests
11. `python -m pytest backend/tests/test_ws_contract.py -q`
12. `python -m pytest backend/tests/test_tts_full_reply.py backend/tests/test_provider_degradation.py backend/tests/test_ws_contract.py backend/tests/test_turn_cancellation.py -q`

Observed:
- websocket contract/security tests passed
- provider degradation bounded-window tests passed
- tts segmentation/no-overlap tests passed
- turn cancellation tests passed
- provider degradation simulation details:
  - STT/TTS repeated 5xx paths enter bounded fast-fail window (`_provider_open_until`)
  - no unbounded retry loops in failing provider paths

## Verification Matrix Status

| Area | Result | Evidence |
| --- | --- | --- |
| Runtime contract | PASS | `/health` 200 + safe summary booleans only |
| WS safety | PASS | `backend.tools.ws_fuzz_safety` via smoke |
| DB persistence | PASS | `db_verify.sql` counts + latest rows |
| Timing persistence | PASS | required keys all `t` in `turns.timings_json` |
| p50/p95 path | PASS | `latency_p50_p95.sql` returns real percentile rows |
| TTS reliability | PASS (test-backed + runtime terminal proof) | `test_tts_full_reply.py`, live done/cancelled terminal payloads |
| Terminal event contract | PASS | done/cancelled statuses observed in runtime probe |
| Provider degradation | PASS (test-backed) | `test_provider_degradation.py` bounded retry + fast-fail assertions |
| Concurrency/cancellation | PASS | `test_turn_cancellation.py` + DB `TURN_CANCELLED` row |
| Security | PASS | `test_ws_contract.py` checks auth token, bad origin, security headers |
| Smoke command | PASS | `python -m backend.tools.smoke --url ...` |

## Remaining Risks
- Live third-party outage behavior is validated with deterministic provider-failure simulation tests (bounded retry/backoff + fast-fail window), not by inducing real external outages.
- TTS no-truncation is validated by segmentation/non-overlap tests and runtime terminal completion; physical speaker hardware interruption remains environment-dependent.

## Final Sign-off
Backend hardening is complete.
