# Backend Hardening Checklist

## Metadata
- Status: Approved
- Owner: Person 1 Backend
- Last Updated: 2026-04-24


## Transport + Validation
- [x] Stable `/ws/clara` behavior.
- [x] Boolean `/health` for readiness checks.
- [x] Strict schema validation for inbound/outbound WS messages.
- [x] Unknown action rejection and payload guards.
- [x] WS rate limiting and origin policy.

## Session and Turn Safety
- [x] One active turn per session.
- [x] Cancel support with deterministic cleanup.
- [x] Terminal `done/error` event completion.

## Security + Reliability
- [x] WS auth token and strict CORS/security headers.
- [x] Provider retry/backoff/degrade controls.
- [x] TTS no-overlap/no-truncation hardening.

## Observability
- [x] Sessions/turns/errors persistence.
- [x] Timings persistence for latency analysis.
- [x] Smoke tooling + final verification completed.
