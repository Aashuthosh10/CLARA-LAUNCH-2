# Error Taxonomy

## Metadata
- Status: Approved
- Owner: Person 1 Backend
- Last Updated: 2026-04-24


## Families
- `VALIDATION_*`: schema and payload violations.
- `AUTH_*`: token/origin/security policy failures.
- `RATE_LIMIT_*`: request volume controls triggered.
- `PROVIDER_STT_*` / `PROVIDER_LLM_*` / `PROVIDER_TTS_*`: upstream failures.
- `RAG_LOW_CONFIDENCE`: safe fallback required.
- `TURN_CANCELLED`: user/system cancellation.
- `INTERNAL_*`: unexpected orchestration/runtime errors.

## Response Contract
- Every terminal failure emits structured `error` event with code and retryability.
- User-facing copy should be concise and actionable.
- Error-to-UI mapping is deterministic to avoid ambiguous kiosk behavior.

Related: [[WebSocket Contract]], [[Frontend Risks]], [[Failure Recovery]]
