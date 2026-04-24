# DEC-005 RAG Scope

## Metadata
- Status: Approved
- Owner: Person 3 Fullstack
- Last Updated: 2026-04-24


## Decision
RAG answers must be confidence-gated with source attribution; low-confidence responses should escalate rather than speculate.

## Rationale
Receptionist domain requires factual reliability over answer breadth.

## Implications
- Evaluation must track escalation correctness, not just answer rate.
- Content governance remains ongoing operational responsibility.
