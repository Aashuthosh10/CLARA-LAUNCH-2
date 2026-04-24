# Frontend Risks

## Metadata
- Status: Draft
- Owner: Person 2 Frontend
- Last Updated: 2026-04-24


## High Risks
- WS connection flicker causing confusing status and duplicate user actions.
- Voice overlay desync from actual backend processing/playback lifecycle.
- Invalid state transitions creating dead-end or inconsistent kiosk screens.
- Kiosk CSS fragility on target display/touch environment.

## Medium Risks
- Over-animated transitions reducing clarity and responsiveness.
- Incomplete error-state UX leading to operator intervention.

## Mitigations
- Enforce `[[Frontend State Flow]]` invariants in state machine logic.
- Validate against `[[Regression Checklist]]` before release candidate.
- Add scenario coverage from `[[Voice Pipeline Test Cases]]`.
