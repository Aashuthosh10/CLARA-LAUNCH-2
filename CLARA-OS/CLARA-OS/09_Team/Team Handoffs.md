# Team Handoffs

## Metadata
- Status: In Review
- Owner: Person 3 Fullstack
- Last Updated: 2026-04-24


## Dependency Chain
1. Research finalizes trusted content and query coverage -> consumed by backend/fullstack.
2. Backend exposes stable contract + telemetry -> consumed by frontend/fullstack.
3. Fullstack wires data modules and admin-lite integration -> consumed by frontend/UI/QA.
4. UI defines/polishes visual behavior -> consumed by frontend implementation.
5. QA validates end-to-end behavior -> defects routed back to owning function.

## Critical Interfaces
- Websocket events and error codes: backend -> frontend/fullstack.
- rooms/departments content schemas: research/fullstack -> frontend/navigation.
- Pilot readiness decisions: all owners -> release summary.

## Handoff Artifacts
- Updated checklists ([[Production Readiness Checklist]]).
- Owner-tagged blockers ([[Open Blockers]]).
- Decision records ([[Decision Index]]).
