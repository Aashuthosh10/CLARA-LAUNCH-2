# DB Schema Overview

## Metadata
- Status: Approved
- Owner: Person 1 Backend
- Last Updated: 2026-04-24


## Primary Tables
- `sessions`: session identity, language, timestamps, client metadata.
- `turns`: turn-level status, mode, lifecycle timestamps, output metadata.
- `errors`: structured error records with taxonomy and stage context.
- `timings`: stage timings (STT, retrieval, generation, TTS, total).

## Relationship Expectations
- One session -> many turns.
- One turn -> many timing entries (or one structured timing record).
- One turn -> zero/many error records.

## Consumers
- Admin session viewer reads sessions + turns + errors.
- Performance reporting reads timings for SLA and regression checks.

See: [[Session Viewer Requirements]], [[Latency Budget]]
