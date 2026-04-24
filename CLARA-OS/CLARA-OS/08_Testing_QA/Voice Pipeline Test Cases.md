# Voice Pipeline Test Cases

## Metadata
- Status: In Review
- Owner: Person 3 Fullstack
- Last Updated: 2026-04-24


## Functional Cases
- Start voice turn in each supported language.
- Interrupt/cancel during listening, thinking, and speaking states.
- Recover from provider timeout with expected fallback behavior.

## Reliability Cases
- Reconnect during active voice turn.
- Back-to-back voice turns without playback overlap.
- Validate no truncated TTS on long but bounded responses.

## Validation Signals
- Terminal event correctness (`done` or `error`).
- Overlay state alignment with backend lifecycle.
- Persisted timings and errors present for traceability.
