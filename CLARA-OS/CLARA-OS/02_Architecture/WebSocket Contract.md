# WebSocket Contract

## Metadata
- Status: In Review
- Owner: Person 3 Fullstack
- Last Updated: 2026-04-24


## Endpoint and Security
- Endpoint: `/ws/clara`
- Requirements: auth token, allowed origin, strict CORS/security policy.

## Contract Principles
- All messages must pass schema validation.
- Unknown actions are rejected with explicit error codes.
- Payload guards prevent unsafe or oversized requests.
- Turn lifecycle is serialized per session (single active turn).

## Client -> Server Actions
- Session initialize/update metadata
- Language selection
- Turn submit (text/voice)
- Turn cancel

## Server -> Client Events
- Ack/progress (optional by mode)
- Content/result payload
- Terminal `done`
- Terminal `error` with machine-readable taxonomy code

Related: [[Error Taxonomy]], [[Smoke Test Checklist]]
