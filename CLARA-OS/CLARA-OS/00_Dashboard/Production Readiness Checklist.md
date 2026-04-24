# Production Readiness Checklist

## Metadata
- Status: In Review
- Owner: Person 3 Fullstack
- Last Updated: 2026-04-24


## Backend
- [x] Stable `/ws/clara` and boolean `/health`.
- [x] Strict WS schema validation, unknown action rejection, payload guards.
- [x] Rate limiting, origin policy, strict CORS, security headers, WS auth token.
- [x] Sessions/turns/errors persistence and timings persistence.
- [x] One active turn per session + cancellation handling.
- [x] Terminal `done/error` events and provider backoff/degrade controls.

## Frontend
- [ ] Strict state routing: Sleep -> Language -> Chat/Voice -> Result.
- [ ] Reconnect handling without interaction loss or visible instability.
- [ ] Voice overlay correctness for listen/think/speak states.
- [ ] Kiosk-safe CSS/touch behavior under pilot hardware constraints.

## Product Modules
- [ ] Directory module complete with validated content.
- [ ] Navigation module complete against 3 floorplan PNGs.
- [ ] Admin-lite panel usable for pilot operations.

## QA Gates
- [ ] `[[Smoke Test Checklist]]` passed.
- [ ] `[[Pilot Acceptance Test]]` passed on target kiosk.
- [ ] `[[Regression Checklist]]` run after final merge set.
