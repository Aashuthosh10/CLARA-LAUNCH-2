# Backend Hardening Verification

## Baseline
- Branch: `hardening/verify-and-finish`
- Canonical backend run command: `python -m backend.main`
- Canonical backend port (from code): `6969`
- WebSocket route: `/ws/clara`

## Verification Matrix

| PR | Goal | Verification command/tool | Expected |
| --- | --- | --- | --- |
| PR1 | `/health` booleans, canonical runtime contract | `curl http://127.0.0.1:6969/health` | `dependencies` booleans present; no secrets |
| PR2 | Invalid JSON / unknown action / oversized payload | `python -m backend.tools.ws_fuzz_safety` | Structured error payload, socket remains usable |
| PR3 | Rate limit + origin allowlist | `python -m backend.tools.ws_fuzz_safety --rate --origin` | Rate limit triggers; prod origin policy enforced |
| PR4 | Persistence tables + writes | `psql -f backend/tools/db_verify.sql` | sessions/turns/errors exist with recent rows |
| PR5 | Timings persisted | `psql -f backend/tools/db_verify.sql` | `timings_json` has `stt/llm/tts/play/total/ttfs` keys |
| PR6 | TTS no overlap/no truncation evidence | `pytest backend/tests/test_tts_full_reply.py` | Segment behavior stable; no duplicated overlap |
| PR7 | Terminal done/error + DB error row | `python -m backend.tools.ws_smoketest` + SQL verify | Every turn ends done/error; error row on failures |
| PR8 | Retry/backoff/degrade controls | `pytest backend/tests/test_provider_resilience.py` | Retries/backoff and degrade windows validated |
| PR9 | RAG confidence gate + sources | `python -m backend.tools.ws_smoketest` + tests | Low-confidence drops retrieval, sources included |
| PR10 | One active turn + cancellation | `pytest backend/tests/test_turn_cancellation.py` | In-flight turn cancelled cleanly; terminal payload emitted |
| PR11 | Prod WS auth + security headers | `pytest backend/tests/test_ws_contract.py` | Auth required in prod; security headers set |
| PR12 | One-command repeatable backend verification | `python -m backend.tools.smoke` | Fails loudly and prints actionable checks |

## Commands Run and Results
- `python -m pip install pytest` -> pass
- `python -m pytest backend/tests/test_ws_contract.py backend/tests/test_turn_cancellation.py backend/tests/test_tts_full_reply.py -q` -> pass (`8 passed`)
- `python -m pytest backend/tests/test_ws_contract.py backend/tests/test_turn_cancellation.py -q` -> pass (`7 passed`)
- `python -m backend.tools.ws_smoketest --url ws://127.0.0.1:6969/ws/clara --timeout 30` -> pass, terminal payload contains `status: done`
- `python -m backend.tools.ws_fuzz_safety --url ws://127.0.0.1:6969/ws/clara --timeout 20` -> pass (invalid JSON, unknown action, oversized payload, liveness)
- `python -m backend.tools.smoke --url ws://127.0.0.1:6969/ws/clara` -> pass (`34 passed` tests + smoke + fuzz)
- `python -c "import requests.../health"` -> pass (`200`, dependencies booleans present)
- `psql --version` -> fail on this machine (`psql` not installed)
- `psql -f backend/tools/db_verify.sql` -> blocked by missing `psql` binary on this machine
- `psql -f backend/tools/latency_p50_p95.sql` -> blocked by missing `psql` binary on this machine

## Fixes Applied
- Added strict live-flow WS smoke sequence (`wake -> language_selected -> conversation_started -> user_message`) and terminal status assertion in [`backend/tools/ws_smoketest.py`](c:/Users/aashu/OneDrive/Desktop/basic%20clara/CLARA-LAUNCH/backend/tools/ws_smoketest.py).
- Added fuzz safety verifier for malformed JSON, unknown action, oversized payload, and post-error connection liveness in [`backend/tools/ws_fuzz_safety.py`](c:/Users/aashu/OneDrive/Desktop/basic%20clara/CLARA-LAUNCH/backend/tools/ws_fuzz_safety.py).
- Added DB verification SQL in [`backend/tools/db_verify.sql`](c:/Users/aashu/OneDrive/Desktop/basic%20clara/CLARA-LAUNCH/backend/tools/db_verify.sql).
- Added operational latency percentile SQL in [`backend/tools/latency_p50_p95.sql`](c:/Users/aashu/OneDrive/Desktop/basic%20clara/CLARA-LAUNCH/backend/tools/latency_p50_p95.sql).
- Added cross-platform smoke command runner in [`backend/tools/smoke.py`](c:/Users/aashu/OneDrive/Desktop/basic%20clara/CLARA-LAUNCH/backend/tools/smoke.py) and wired [`scripts/smoke.ps1`](c:/Users/aashu/OneDrive/Desktop/basic%20clara/CLARA-LAUNCH/scripts/smoke.ps1) to it.
- Fixed cancellation correctness gap: websocket loop no longer blocks on active turn processing; cancellation now reliably emits terminal cancellation payload and writes DB error row in [`backend/app/main.py`](c:/Users/aashu/OneDrive/Desktop/basic%20clara/CLARA-LAUNCH/backend/app/main.py).
- Added required hardening verification tests:
  - [`backend/tests/test_ws_contract.py`](c:/Users/aashu/OneDrive/Desktop/basic%20clara/CLARA-LAUNCH/backend/tests/test_ws_contract.py)
  - [`backend/tests/test_turn_cancellation.py`](c:/Users/aashu/OneDrive/Desktop/basic%20clara/CLARA-LAUNCH/backend/tests/test_turn_cancellation.py)

## Final Status
- Hardening verification artifacts are implemented and passing locally where dependencies exist.
- Remaining environment blocker for full DB proof on this machine: `psql` CLI missing.
