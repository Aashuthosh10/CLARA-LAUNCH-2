# Session Viewer Requirements

## Metadata
- Status: Draft
- Owner: Person 3 Fullstack
- Last Updated: 2026-04-24


## Core Views
- Session timeline with start/end, language, and status summary.
- Turn-level breakdown including latency and terminal result.
- Error panel with taxonomy code, stage, and retryability.

## Filters
- Date/time range
- Language
- Error-only sessions
- High-latency sessions

## Data Dependencies
- `sessions`, `turns`, `errors`, `timings` from backend persistence model.

Related: [[DB Schema Overview]], [[Backend Final Status]]
