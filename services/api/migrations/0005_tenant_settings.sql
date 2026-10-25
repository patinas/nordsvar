-- Per-tenant AI settings: operator overrides managed from the admin UI.
-- NULL means "use the deployment default" (the worker's env config).
CREATE TABLE IF NOT EXISTS tenant_settings (
    tenant_id UUID PRIMARY KEY,
    llm_model TEXT,
    embed_model TEXT,
    stt_language TEXT,
    updated_at_unix BIGINT NOT NULL DEFAULT 0
);
