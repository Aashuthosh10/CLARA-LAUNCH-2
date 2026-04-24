-- Operational latency percentiles from turns.timings_json
-- Usage:
--   psql -v LIMIT_TURNS=200 -f backend/tools/latency_p50_p95.sql
-- If LIMIT_TURNS is not provided, defaults to 200.

WITH scoped AS (
  SELECT
    turn_id,
    created_at,
    NULLIF(timings_json->>'stt_ms', '')::double precision AS stt_ms,
    NULLIF(timings_json->>'llm_ms', '')::double precision AS llm_ms,
    NULLIF(timings_json->>'tts_ms', '')::double precision AS tts_ms,
    NULLIF(timings_json->>'play_ms', '')::double precision AS play_ms,
    NULLIF(timings_json->>'total_ms', '')::double precision AS total_ms,
    NULLIF(timings_json->>'ttfs_ms', '')::double precision AS ttfs_ms
  FROM turns
  ORDER BY created_at DESC
  LIMIT COALESCE(NULLIF(:'LIMIT_TURNS', '')::int, 200)
)
SELECT
  COUNT(*) AS sampled_turns,
  ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY stt_ms)::numeric, 2) AS stt_p50_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY stt_ms)::numeric, 2) AS stt_p95_ms,
  ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY llm_ms)::numeric, 2) AS llm_p50_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY llm_ms)::numeric, 2) AS llm_p95_ms,
  ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY tts_ms)::numeric, 2) AS tts_p50_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY tts_ms)::numeric, 2) AS tts_p95_ms,
  ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY play_ms)::numeric, 2) AS play_p50_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY play_ms)::numeric, 2) AS play_p95_ms,
  ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY ttfs_ms)::numeric, 2) AS ttfs_p50_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY ttfs_ms)::numeric, 2) AS ttfs_p95_ms,
  ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY total_ms)::numeric, 2) AS total_p50_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_ms)::numeric, 2) AS total_p95_ms
FROM scoped
WHERE total_ms IS NOT NULL;
