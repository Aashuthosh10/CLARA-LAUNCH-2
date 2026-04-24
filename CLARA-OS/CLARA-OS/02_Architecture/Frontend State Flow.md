# Frontend State Flow

## Metadata
- Status: In Review
- Owner: Person 3 Fullstack
- Last Updated: 2026-04-24


## Canonical States
`Sleep` -> `Wake` -> `Language` -> `Interaction` -> `Result` -> `Reset`

## Routing Rules
- Never enter interaction state without selected language.
- Voice overlay mirrors backend turn stage, not only local timer state.
- On WS drop, enter recover state before allowing next turn.
- Reset clears ephemeral UI state without losing required session identity.

## Edge Cases
- Mid-turn cancel
- Mid-turn reconnect
- Provider timeout and fallback to text

See: [[Chat UI Spec]], [[Voice Overlay Spec]], [[Frontend Risks]]
