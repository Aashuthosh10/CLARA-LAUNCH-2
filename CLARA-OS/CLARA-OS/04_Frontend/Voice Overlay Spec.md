# Voice Overlay Spec

## Metadata
- Status: Draft
- Owner: Person 2 Frontend
- Last Updated: 2026-04-24


## Overlay States
- `Listening`: capturing user speech.
- `Thinking`: backend processing turn.
- `Speaking`: TTS playback active.
- `Error/Recover`: transient failure with next-step CTA.

## Transition Rules
- State transitions must be event-driven from backend turn lifecycle.
- Cancel immediately exits listening/thinking/speaking to ready state.
- Reconnect mid-turn enters recover state before retry or reset.

## UX Constraints
- Large touch targets for stop/cancel.
- High contrast and low cognitive load for lobby noise conditions.
- No decorative animations that obscure current state clarity.

See: [[Voice Pipeline]], [[Frontend Risks]]
