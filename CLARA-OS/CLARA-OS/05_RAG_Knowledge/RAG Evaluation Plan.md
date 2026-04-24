# RAG Evaluation Plan

## Metadata
- Status: Draft
- Owner: Person 5 Research
- Last Updated: 2026-04-24


## Evaluation Dimensions
- Answer correctness against trusted source.
- Source attribution presence and relevance.
- Fallback behavior when confidence is low.
- Tone and brevity for receptionist context.

## Test Set
- Start with buckets from [[Top 100 Lobby Queries]].
- Include multilingual paraphrases for all six supported languages.
- Include adversarial/ambiguous prompts for safety behavior checks.

## Metrics
- Accuracy rate by intent bucket and language.
- Citation coverage rate.
- Escalation correctness rate for low-confidence cases.
- Median/P95 response latency impact from retrieval depth.

Related: [[Latency Budget]], [[Multilingual Style Notes]]
