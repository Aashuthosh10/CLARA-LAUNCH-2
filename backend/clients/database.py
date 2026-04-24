"""PostgreSQL connection and pooling for RAG (pgvector). Used by rag.py and ingest script."""

import json
import logging
import threading
import time
import uuid
from typing import Any, List, Optional

from backend.config.settings import (
    POSTGRES_DB,
    POSTGRES_HOST,
    POSTGRES_PASSWORD,
    POSTGRES_PORT,
    POSTGRES_USER,
)

logger = logging.getLogger(__name__)

# Sentinel when pool init failed; backend continues without DB. Never raise on init.
_POOL_FAILED = object()
_POOL_RETRY_INTERVAL_SEC = 10.0
_last_pool_failure_time: Optional[float] = None
_pool_lock = threading.Lock()

_pool: Optional[Any] = None


def _get_pool():
    """
    Lazy pool creation. On first success returns pool. On failure: do NOT raise,
    set _pool = _POOL_FAILED, log, return None. Retry every POOL_RETRY_INTERVAL_SEC
    on subsequent calls when pool is failed.
    """
    global _pool, _last_pool_failure_time
    with _pool_lock:
        if _pool is not None and _pool is not _POOL_FAILED:
            return _pool
        if _pool is _POOL_FAILED:
            now = time.time()
            if _last_pool_failure_time is not None and (now - _last_pool_failure_time) < _POOL_RETRY_INTERVAL_SEC:
                return None
        try:
            import psycopg2.pool as pg2pool
            from pgvector.psycopg2 import register_vector

            pool = pg2pool.SimpleConnectionPool(
                minconn=1,
                maxconn=5,
                host=POSTGRES_HOST,
                port=POSTGRES_PORT,
                dbname=POSTGRES_DB,
                user=POSTGRES_USER,
                password=POSTGRES_PASSWORD or None,
            )
            conn = pool.getconn()
            try:
                register_vector(conn)
            finally:
                pool.putconn(conn)
            _pool = pool
            _last_pool_failure_time = None
            return _pool
        except Exception as e:
            logger.warning("PostgreSQL pool init failed: %s", e, exc_info=True)
            logger.warning("PostgreSQL unavailable. Running in LLM-only fallback mode.")
            _pool = _POOL_FAILED
            _last_pool_failure_time = time.time()
            return None


def is_db_available() -> bool:
    """Return True if pool is initialized and usable. Triggers lazy init/retry."""
    return _get_pool() is not None


def log_db_status() -> None:
    """
    Log DB host, port, user, db name and whether pool was created successfully.
    Call on backend startup for diagnostics.
    """
    logger.info(
        "PostgreSQL config: host=%s port=%s user=%s dbname=%s",
        POSTGRES_HOST,
        POSTGRES_PORT,
        POSTGRES_USER,
        POSTGRES_DB,
    )
    pool = _get_pool()
    if pool is not None:
        logger.info("PostgreSQL pool created successfully.")
    else:
        logger.warning("PostgreSQL unavailable. Running in LLM-only fallback mode.")


def get_connection():
    """Get a connection from the pool. Raises RuntimeError if pool unavailable."""
    pool = _get_pool()
    if pool is None:
        raise RuntimeError("PostgreSQL not available (pool init failed)")
    try:
        from pgvector.psycopg2 import register_vector
        conn = pool.getconn()
        register_vector(conn)
        return conn
    except Exception as e:
        logger.debug("DB get_connection failed: %s", e)
        raise


def put_connection(conn: Any) -> None:
    """Return a connection to the pool."""
    if _pool is not None and _pool is not _POOL_FAILED and conn is not None:
        try:
            _pool.putconn(conn)
        except Exception:
            pass


def run_query(
    query: str,
    params: Optional[tuple] = None,
    fetch: bool = True,
) -> Optional[List[tuple]]:
    """
    Run a parameterized query. Returns list of rows or None on error.
    Does not log query text or params (security).
    """
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(query, params)
        if fetch:
            rows = cur.fetchall()
        else:
            conn.commit()
            rows = None
        cur.close()
        return rows
    except Exception as e:
        if conn:
            try:
                conn.rollback()
            except Exception:
                pass
        logger.warning("DB query failed: %s", e)
        return None
    finally:
        if conn:
            put_connection(conn)


def get_document_count() -> int:
    """Return count of rows in college_knowledge. Returns 0 on any error."""
    rows = run_query("SELECT COUNT(*) FROM college_knowledge", fetch=True)
    if not rows:
        return 0
    try:
        return int(rows[0][0])
    except (IndexError, TypeError, ValueError):
        return 0


def get_similar_contents(embedding: List[float], top_k: int, language: str | None = None) -> List[str]:
    """
    Return top_k content strings from college_knowledge by cosine similarity.
    Returns empty list on any error or if DB unavailable.
    """
    if not embedding or top_k <= 0:
        return []
    if not is_db_available():
        logger.warning("DB vector search skipped: PostgreSQL not available (pool init failed)")
        return []
    conn = None
    try:
        from pgvector.psycopg2 import register_vector
        from pgvector import Vector

        conn = get_connection()
        cur = conn.cursor()
        lang = (language or "").strip().lower()
        if lang not in {"en", "hi"}:
            lang = "en"
        cur.execute(
            """
            SELECT content
            FROM college_knowledge
            WHERE metadata->>'language' = %s
            ORDER BY embedding <-> %s
            LIMIT %s
            """,
            (lang, Vector(embedding), top_k),
        )
        rows = cur.fetchall()
        cur.close()
        return [r[0] for r in rows if r[0] is not None]
    except Exception as e:
        if conn:
            try:
                conn.rollback()
            except Exception:
                pass
        logger.warning("DB vector search failed: %s", e)
        return []
    finally:
        if conn:
            put_connection(conn)


def truncate_college_knowledge() -> bool:
    """Truncate college_knowledge table. Returns True on success."""
    if not is_db_available():
        return False
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("TRUNCATE college_knowledge")
        conn.commit()
        cur.close()
        return True
    except Exception as e:
        if conn:
            try:
                conn.rollback()
            except Exception:
                pass
        logger.warning("DB truncate failed: %s", e)
        return False
    finally:
        if conn:
            put_connection(conn)


def insert_college_chunk(
    doc_id: str,
    content: str,
    embedding: List[float],
    metadata: dict[str, Any] | None = None,
) -> bool:
    """Insert one row into college_knowledge. Returns True on success, False on error."""
    if not is_db_available():
        return False
    conn = None
    try:
        from pgvector.psycopg2 import register_vector
        from pgvector import Vector

        conn = get_connection()
        cur = conn.cursor()
        metadata_payload = json.dumps(metadata or {}, ensure_ascii=False)
        cur.execute(
            "INSERT INTO college_knowledge (id, content, embedding, metadata) VALUES (%s, %s, %s, %s::jsonb)",
            (doc_id, content, Vector(embedding), metadata_payload),
        )
        conn.commit()
        cur.close()
        return True
    except Exception as e:
        if conn:
            try:
                conn.rollback()
            except Exception:
                pass
        logger.warning("Insert failed: %s", e)
        return False
    finally:
        if conn:
            put_connection(conn)


def init_audit_tables() -> bool:
    """Create operational audit tables if they don't exist."""
    if not is_db_available():
        return False
    conn = None
    ddl = """
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
    """
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(ddl)
        conn.commit()
        cur.close()
        return True
    except Exception as e:
        if conn:
            try:
                conn.rollback()
            except Exception:
                pass
        logger.warning("Audit table init failed: %s", e)
        return False
    finally:
        if conn:
            put_connection(conn)


def start_session(session_id: str, device_id: str | None, language: str | None, metadata: dict[str, Any] | None = None) -> bool:
    if not is_db_available():
        return False
    return run_query(
        """
        INSERT INTO sessions(session_id, device_id, language, metadata)
        VALUES (%s, %s, %s, %s::jsonb)
        ON CONFLICT (session_id) DO NOTHING
        """,
        (session_id, device_id, language, json.dumps(metadata or {}, ensure_ascii=False)),
        fetch=False,
    ) is None


def end_session(session_id: str) -> bool:
    if not is_db_available():
        return False
    return run_query(
        "UPDATE sessions SET ended_at = NOW() WHERE session_id = %s",
        (session_id,),
        fetch=False,
    ) is None


def insert_turn(
    turn_id: str,
    session_id: str,
    *,
    user_text: str | None,
    assistant_text: str | None,
    timings_json: dict[str, Any] | None,
    providers_json: dict[str, Any] | None,
    rag_sources: list[dict[str, Any]] | None,
    language: str | None,
    stt_confidence: float | None,
    retrieval_score: float | None,
    used_fallback: bool,
) -> bool:
    if not is_db_available():
        return False
    return run_query(
        """
        INSERT INTO turns(turn_id, session_id, user_text, assistant_text, timings_json, providers_json, rag_sources,
                          language, stt_confidence, retrieval_score, used_fallback)
        VALUES (%s, %s, %s, %s, %s::jsonb, %s::jsonb, %s::jsonb, %s, %s, %s, %s)
        """,
        (
            turn_id,
            session_id,
            user_text,
            assistant_text,
            json.dumps(timings_json or {}, ensure_ascii=False),
            json.dumps(providers_json or {}, ensure_ascii=False),
            json.dumps(rag_sources or [], ensure_ascii=False),
            language,
            stt_confidence,
            retrieval_score,
            used_fallback,
        ),
        fetch=False,
    ) is None


def insert_error(
    *,
    session_id: str | None,
    turn_id: str | None,
    stage: str,
    code: str,
    message: str,
    stacktrace_hash: str | None,
    details_json: dict[str, Any] | None,
) -> bool:
    if not is_db_available():
        return False
    error_id = uuid.uuid4().hex
    return run_query(
        """
        INSERT INTO errors(id, session_id, turn_id, stage, code, message, stacktrace_hash, details_json)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s::jsonb)
        """,
        (
            error_id,
            session_id,
            turn_id,
            stage,
            code,
            message[:2000],
            stacktrace_hash,
            json.dumps(details_json or {}, ensure_ascii=False),
        ),
        fetch=False,
    ) is None
