-- Nordsvar core schema. Every row is tenant-owned; both tables key on
-- tenant_id and there is no cross-tenant query path in the application.

CREATE TABLE IF NOT EXISTS sessions (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    room            TEXT NOT NULL UNIQUE,
    created_by      TEXT NOT NULL,
    created_at_unix BIGINT NOT NULL,
    status          TEXT NOT NULL CHECK (status IN ('active', 'ended')),
    ended_at_unix   BIGINT
);
CREATE INDEX IF NOT EXISTS sessions_tenant_idx ON sessions (tenant_id);

CREATE TABLE IF NOT EXISTS audit_events (
    id         UUID PRIMARY KEY,
    tenant_id  UUID NOT NULL,
    actor      TEXT NOT NULL,
    action     TEXT NOT NULL,
    target     TEXT NOT NULL,
    detail     JSONB NOT NULL DEFAULT '{}'::jsonb,
    at_unix    BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS audit_events_tenant_idx ON audit_events (tenant_id, at_unix);

-- Knowledge documents registry (metadata; vectors live in Qdrant).
CREATE TABLE IF NOT EXISTS kb_documents (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    name            TEXT NOT NULL,
    format          TEXT NOT NULL,
    chunks_indexed  INT NOT NULL,
    ingested_by     TEXT NOT NULL,
    ingested_at_unix BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS kb_documents_tenant_idx ON kb_documents (tenant_id);
