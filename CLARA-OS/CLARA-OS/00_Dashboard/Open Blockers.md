# Open Blockers

## Metadata
- Status: In Review
- Owner: Person 3 Fullstack
- Last Updated: 2026-04-24


## Current Blockers
- WS reconnect can cause visible UI flicker during active kiosk use.
- Voice overlay sometimes lags true backend turn state.
- Navigation accuracy depends on finalized room coordinate mapping.
- Admin-lite role boundaries and audit expectations are not frozen.
- Multilingual output tone is inconsistent across languages/intents.

## Owner Mapping
- Frontend stability: [[Person 2 Frontend]]
- Navigation data and wiring: [[Person 3 Fullstack]]
- Voice naturalness and content quality: [[Person 5 Research]]
- Admin controls and security posture: [[Person 1 Backend]] + [[Person 3 Fullstack]]

## Unblocking Decisions Needed
- Retry/fallback UX policy for WS drop mid-turn.
- Minimum viable admin permissions for pilot.
- Low-confidence response policy for RAG edge cases.
