# Latency Budget

## Metadata
- Status: Approved
- Owner: Person 1 Backend
- Last Updated: 2026-04-24


## Voice (P95 Targets)
- STT <= 1.2s
- Retrieval <= 0.5s
- LLM generation <= 1.8s
- TTS <= 1.2s
- End-to-end turn <= 4.5s

## Text (P95 Targets)
- Retrieval + generation <= 2.5s

## Monitoring Policy
- Capture stage-level timings in persistence for every turn.
- Break down by language and intent group.
- Trigger investigation when P95 breaches occur in consecutive windows.

Linked: [[DB Schema Overview]], [[RAG Evaluation Plan]]
