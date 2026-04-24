# RAG Flow

## Metadata
- Status: In Review
- Owner: Person 3 Fullstack
- Last Updated: 2026-04-24


## Retrieval and Response Pipeline
1. Parse user intent and normalize query.
2. Retrieve candidate chunks from approved campus knowledge corpus.
3. Score candidates and apply confidence gating.
4. Generate concise receptionist answer with source attribution.
5. If below confidence threshold, provide safe fallback + escalation.

## Content Governance
- Sources must be traceable to owned institutional content.
- Outdated/contradictory chunks are flagged for curation.

## Quality Dependencies
- [[Knowledge Sources Index]]
- [[Department Content Mapping]]
- [[RAG Evaluation Plan]]
