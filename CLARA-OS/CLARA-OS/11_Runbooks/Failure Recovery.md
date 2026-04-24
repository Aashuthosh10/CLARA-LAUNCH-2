# Failure Recovery

## Metadata
- Status: In Review
- Owner: Person 3 Fullstack
- Last Updated: 2026-04-24


## Common Failures
- Websocket disconnect mid-turn
- STT/LLM/TTS provider timeout
- Low-confidence RAG retrieval
- Frontend state desynchronization

## Recovery Actions
- WS drop: enter recover state, reconnect with backoff, reset active turn safely.
- Provider timeout: emit structured error; offer retry or text fallback.
- Low confidence: provide bounded response + escalate to staff.
- State desync: force controlled reset to canonical safe state.

## Escalation
- If repeated failures exceed threshold during pilot window, switch to staff-assisted mode and log incident summary in release notes.
