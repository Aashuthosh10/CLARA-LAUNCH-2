# Smoke Test Checklist

## Metadata
- Status: In Review
- Owner: Person 3 Fullstack
- Last Updated: 2026-04-24


## Backend Smoke
- [ ] Backend starts with canonical command.
- [ ] `/health` returns expected boolean ready.
- [ ] `/ws/clara` accepts valid auth and rejects invalid schema/action.

## End-to-End Smoke
- [ ] Sleep -> language select -> chat turn -> result works.
- [ ] Voice turn reaches terminal `done` with audible playback.
- [ ] Cancel active turn and verify clean recovery.

## Regression-Sensitive Smoke
- [ ] Reconnect path does not corrupt UI state.
- [ ] Error path emits user-safe fallback messaging.

Use with: [[Smoke Test Runbook]]
