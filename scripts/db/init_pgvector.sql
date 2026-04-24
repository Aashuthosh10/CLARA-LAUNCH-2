-- Run once after first docker compose up.
-- Example: PGPASSWORD=yourpass psql -h 127.0.0.1 -U clara_user -d clara_db -f scripts/db/init_pgvector.sql

CREATE EXTENSION IF NOT EXISTS vector;

DROP TABLE IF EXISTS college_knowledge;

CREATE TABLE IF NOT EXISTS college_knowledge (
    id UUID PRIMARY KEY,
    content TEXT NOT NULL,
    embedding VECTOR(768),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_college_embedding
ON college_knowledge
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    device_id TEXT,
    language TEXT,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS turns (
    turn_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_text TEXT,
    assistant_text TEXT,
    timings_json JSONB DEFAULT '{}'::jsonb,
    providers_json JSONB DEFAULT '{}'::jsonb,
    rag_sources JSONB DEFAULT '[]'::jsonb,
    language TEXT,
    stt_confidence DOUBLE PRECISION NULL,
    retrieval_score DOUBLE PRECISION NULL,
    used_fallback BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_turns_session_id ON turns(session_id);

CREATE TABLE IF NOT EXISTS errors (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    turn_id TEXT,
    stage TEXT,
    code TEXT,
    message TEXT,
    stacktrace_hash TEXT,
    details_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_errors_session_id ON errors(session_id);
