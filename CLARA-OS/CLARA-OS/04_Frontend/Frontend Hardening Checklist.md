# Frontend Hardening Checklist

## Metadata
- Status: Draft
- Owner: Person 2 Frontend
- Last Updated: 2026-04-24


## State and Routing
- [ ] Enforce strict flow transitions and guard invalid state jumps.
- [ ] Ensure language state is required before interaction start.
- [ ] Implement deterministic reset behavior after terminal events.

## WebSocket Reliability
- [ ] Reconnect strategy with clear UX and no duplicate sends.
- [ ] Backoff and retry caps for unstable networks.
- [ ] Preserve/restore safe UI state after reconnect.

## Voice UI Correctness
- [ ] Overlay state mirrors backend turn lifecycle.
- [ ] Cancel and interruption behavior is consistent.
- [ ] No stuck listening/speaking indicators.

## Kiosk UX Stability
- [ ] Touch targets and layout robustness at kiosk resolution.
- [ ] Animation and transitions avoid frame drops/disorientation.
- [ ] Visual fallback for temporary backend unavailability.
