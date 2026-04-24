# Backend Runbook

## Metadata
- Status: In Review
- Owner: Person 3 Fullstack
- Last Updated: 2026-04-24


## Startup
- Run backend with canonical project command.
- Verify `/health` readiness before frontend integration tests.

## Health Checks
- Confirm websocket auth/origin enforcement.
- Run smoke websocket probe for schema/action handling.
- Confirm persistence writes for sessions/turns/errors/timings.

## Incident Triage
- Identify failure family via [[Error Taxonomy]].
- Check provider-stage failures vs validation/auth failures.
- Escalate recurring incidents to blocker tracking.

See: [[Smoke Test Runbook]], [[Failure Recovery]]
