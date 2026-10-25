-- Local username/password auth (AUTH_MODE=local). Passwords are argon2id
-- hashes; session tokens are stored as SHA-256 hashes so a database read
-- never reveals a usable credential.

CREATE TABLE IF NOT EXISTS local_users (
    tenant_id       UUID        NOT NULL,
    username        TEXT        NOT NULL,
    password_hash   TEXT        NOT NULL,
    role            TEXT        NOT NULL,
    created_at_unix BIGINT      NOT NULL,
    PRIMARY KEY (tenant_id, username)
);

CREATE TABLE IF NOT EXISTS local_sessions (
    token_hash      TEXT        PRIMARY KEY,
    tenant_id       UUID        NOT NULL,
    username        TEXT        NOT NULL,
    role            TEXT        NOT NULL,
    created_at_unix BIGINT      NOT NULL,
    expires_at_unix BIGINT      NOT NULL
);

CREATE INDEX IF NOT EXISTS local_sessions_expiry ON local_sessions (expires_at_unix);
