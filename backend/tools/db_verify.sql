-- Verify hardening persistence schema and recent audit writes.

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('sessions', 'turns', 'errors')
ORDER BY table_name;

SELECT
  COUNT(*) AS sessions_count
FROM sessions;

SELECT
  COUNT(*) AS turns_count
FROM turns;

SELECT
  COUNT(*) AS errors_count
FROM errors;

SELECT
  session_id,
  language,
  started_at,
  ended_at
FROM sessions
ORDER BY started_at DESC
LIMIT 10;

SELECT
  turn_id,
  session_id,
  language,
  created_at,
  (timings_json ? 'stt_ms') AS has_stt_ms,
  (timings_json ? 'llm_ms') AS has_llm_ms,
  (timings_json ? 'tts_ms') AS has_tts_ms,
  (timings_json ? 'play_ms') AS has_play_ms,
  (timings_json ? 'total_ms') AS has_total_ms,
  (timings_json ? 'ttfs_ms') AS has_ttfs_ms
FROM turns
ORDER BY created_at DESC
LIMIT 10;

SELECT
  id,
  session_id,
  turn_id,
  stage,
  code,
  created_at
FROM errors
ORDER BY created_at DESC
LIMIT 10;
