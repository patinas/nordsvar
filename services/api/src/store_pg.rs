//! PostgreSQL-backed stores. All queries are tenant-keyed; there is no
//! cross-tenant code path. Timestamps are stored as epoch seconds to keep
//! the domain types chrono-free.

use crate::audit::{AuditEvent, AuditLog};
use crate::store::{
    DocumentMeta, DocumentStore, Session, SessionId, SessionStatus, SessionStore, SettingsStore,
    StoreError, TenantSettings,
};
use async_trait::async_trait;
use nordsvar_tenancy::TenantId;
use sqlx::postgres::PgPool;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone)]
pub struct PgStore {
    pool: PgPool,
}

impl PgStore {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn connect(url: &str) -> Result<Self, sqlx::Error> {
        let pool = PgPool::connect(url).await?;
        Ok(Self::new(pool))
    }

    /// Run migrations. Idempotent (IF NOT EXISTS throughout).
    pub async fn migrate(&self) -> Result<(), sqlx::Error> {
        // Serialize concurrent migrators (test suite, multi-replica deploys):
        // CREATE TABLE IF NOT EXISTS can still race on pg_type under
        // overlapping transactions, so gate on a transaction-scoped
        // advisory lock.
        let mut tx = self.pool.begin().await?;
        sqlx::raw_sql("SELECT pg_advisory_xact_lock(88442211)")
            .execute(&mut *tx)
            .await?;
        sqlx::raw_sql(include_str!("../migrations/0001_init.sql"))
            .execute(&mut *tx)
            .await?;
        sqlx::raw_sql(include_str!("../migrations/0002_session_claims.sql"))
            .execute(&mut *tx)
            .await?;
        sqlx::raw_sql(include_str!("../migrations/0003_local_auth.sql"))
            .execute(&mut *tx)
            .await?;
        sqlx::raw_sql(include_str!("../migrations/0004_claim_heartbeats.sql"))
            .execute(&mut *tx)
            .await?;
        sqlx::raw_sql(include_str!("../migrations/0005_tenant_settings.sql"))
            .execute(&mut *tx)
            .await?;
        sqlx::raw_sql(include_str!("../migrations/0006_llm_provider.sql"))
            .execute(&mut *tx)
            .await?;
        sqlx::raw_sql(include_str!("../migrations/0007_embed_telephony.sql"))
            .execute(&mut *tx)
            .await?;
        tx.commit().await?;
        Ok(())
    }
}

#[async_trait]
impl SessionStore for PgStore {
    async fn create(&self, tenant: TenantId, session: Session) -> Result<Session, StoreError> {
        sqlx::query(
            "INSERT INTO sessions (id, tenant_id, room, created_by, created_at_unix, status, ended_at_unix, claimed_by, claimed_at_unix)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        )
        .bind(*session.id.as_uuid())
        .bind(*tenant.as_uuid())
        .bind(&session.room)
        .bind(&session.created_by)
        .bind(session.created_at_unix as i64)
        .bind(match session.status {
            SessionStatus::Active => "active",
            SessionStatus::Ended => "ended",
        })
        .bind(session.ended_at_unix.map(|v| v as i64))
        .bind(session.claimed_by.as_deref())
        .bind(session.claimed_at_unix.map(|v| v as i64))
        .execute(&self.pool)
        .await?;
        Ok(session)
    }

    async fn get(&self, tenant: TenantId, id: SessionId) -> Result<Option<Session>, StoreError> {
        let row = sqlx::query_as::<_, SessionRow>(
            "SELECT id, tenant_id, room, created_by, created_at_unix, status, ended_at_unix, claimed_by, claimed_at_unix
             FROM sessions WHERE tenant_id = $1 AND id = $2",
        )
        .bind(*tenant.as_uuid())
        .bind(*id.as_uuid())
        .fetch_optional(&self.pool)
        .await?;
        Ok(row.map(SessionRow::into_session))
    }

    async fn end(&self, tenant: TenantId, id: SessionId) -> Result<Option<Session>, StoreError> {
        let Some(existing) = self.get(tenant, id).await? else {
            return Ok(None);
        };
        if existing.status == SessionStatus::Active {
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();
            sqlx::query(
                "UPDATE sessions SET status = 'ended', ended_at_unix = $3
                 WHERE tenant_id = $1 AND id = $2 AND status = 'active'",
            )
            .bind(*tenant.as_uuid())
            .bind(*id.as_uuid())
            .bind(now as i64)
            .execute(&self.pool)
            .await?;
        }
        self.get(tenant, id).await
    }

    async fn list_unclaimed(&self) -> Result<Vec<Session>, StoreError> {
        let stale_before = now_unix().saturating_sub(crate::store::CLAIM_STALE_AFTER_SECS) as i64;
        let rows = sqlx::query_as::<_, SessionRow>(
            "SELECT id, tenant_id, room, created_by, created_at_unix, status, ended_at_unix, claimed_by, claimed_at_unix
             FROM sessions
             WHERE status = 'active'
               AND (claimed_by IS NULL
                    OR claimed_at_unix IS NULL
                    OR claimed_at_unix < $1)",
        )
        .bind(stale_before)
        .fetch_all(&self.pool)
        .await?;
        Ok(rows.into_iter().map(SessionRow::into_session).collect())
    }

    async fn get_by_id(&self, id: SessionId) -> Result<Option<Session>, StoreError> {
        let row = sqlx::query_as::<_, SessionRow>(
            "SELECT id, tenant_id, room, created_by, created_at_unix, status, ended_at_unix, claimed_by, claimed_at_unix
             FROM sessions WHERE id = $1",
        )
        .bind(*id.as_uuid())
        .fetch_optional(&self.pool)
        .await?;
        Ok(row.map(SessionRow::into_session))
    }

    async fn claim(&self, id: SessionId, worker: &str) -> Result<Option<Session>, StoreError> {
        let now = now_unix() as i64;
        let stale_before = now.saturating_sub(crate::store::CLAIM_STALE_AFTER_SECS as i64);
        let row = sqlx::query_as::<_, SessionRow>(
            "UPDATE sessions SET claimed_by = $2, claimed_at_unix = $3
             WHERE id = $1 AND status = 'active'
               AND (claimed_by IS NULL
                    OR claimed_at_unix IS NULL
                    OR claimed_at_unix < $4)
             RETURNING id, tenant_id, room, created_by, created_at_unix, status, ended_at_unix, claimed_by, claimed_at_unix",
        )
        .bind(*id.as_uuid())
        .bind(worker)
        .bind(now)
        .bind(stale_before)
        .fetch_optional(&self.pool)
        .await?;
        Ok(row.map(SessionRow::into_session))
    }

    async fn heartbeat(&self, id: SessionId, worker: &str) -> Result<bool, StoreError> {
        let result = sqlx::query(
            "UPDATE sessions SET claimed_at_unix = $3
             WHERE id = $1 AND claimed_by = $2 AND status = 'active'",
        )
        .bind(*id.as_uuid())
        .bind(worker)
        .bind(now_unix() as i64)
        .execute(&self.pool)
        .await?;
        Ok(result.rows_affected() == 1)
    }

    async fn list(&self, tenant: TenantId) -> Result<Vec<Session>, StoreError> {
        let rows = sqlx::query_as::<_, SessionRow>(
            "SELECT id, tenant_id, room, created_by, created_at_unix, status, ended_at_unix, claimed_by, claimed_at_unix
             FROM sessions WHERE tenant_id = $1 ORDER BY created_at_unix",
        )
        .bind(*tenant.as_uuid())
        .fetch_all(&self.pool)
        .await?;
        Ok(rows.into_iter().map(SessionRow::into_session).collect())
    }
}

#[derive(sqlx::FromRow)]
struct SessionRow {
    id: uuid::Uuid,
    tenant_id: uuid::Uuid,
    room: String,
    created_by: String,
    created_at_unix: i64,
    status: String,
    ended_at_unix: Option<i64>,
    claimed_by: Option<String>,
    claimed_at_unix: Option<i64>,
}

impl SessionRow {
    fn into_session(self) -> Session {
        Session {
            id: SessionId::from_uuid(self.id),
            tenant: TenantId::from_uuid(self.tenant_id),
            room: self.room,
            created_by: self.created_by,
            created_at_unix: self.created_at_unix as u64,
            status: match self.status.as_str() {
                "ended" => SessionStatus::Ended,
                _ => SessionStatus::Active,
            },
            ended_at_unix: self.ended_at_unix.map(|v| v as u64),
            claimed_by: self.claimed_by,
            claimed_at_unix: self.claimed_at_unix.map(|v| v as u64),
        }
    }
}

#[async_trait]
impl SettingsStore for PgStore {
    async fn get_settings(&self, tenant: TenantId) -> Result<TenantSettings, StoreError> {
        let row = sqlx::query_as::<
            _,
            (
                Option<String>,
                Option<String>,
                Option<String>,
                Option<String>,
                Option<Vec<u8>>,
                Option<bool>,
                Option<String>,
                Option<String>,
                Option<String>,
                Option<String>,
                Option<String>,
                Option<bool>,
                Option<bool>,
                Option<String>,
                Option<String>,
            ),
        >(
            "SELECT llm_model, embed_model, stt_language, llm_base_url, llm_api_key_enc,
                    embed_enabled, embed_public_key, embed_allowed_domains, embed_theme_color,
                    embed_position, embed_language, embed_voice_enabled,
                    telephony_enabled, telephony_provider, telephony_inbound_number
             FROM tenant_settings WHERE tenant_id = $1",
        )
        .bind(*tenant.as_uuid())
        .fetch_optional(&self.pool)
        .await?;
        Ok(row
            .map(
                |(
                    llm_model,
                    embed_model,
                    stt_language,
                    llm_base_url,
                    llm_api_key_enc,
                    embed_enabled,
                    embed_public_key,
                    embed_allowed_domains,
                    embed_theme_color,
                    embed_position,
                    embed_language,
                    embed_voice_enabled,
                    telephony_enabled,
                    telephony_provider,
                    telephony_inbound_number,
                )| {
                    TenantSettings {
                        llm_model,
                        embed_model,
                        stt_language,
                        llm_base_url,
                        llm_api_key_enc,
                        embed_enabled,
                        embed_public_key,
                        embed_allowed_domains,
                        embed_theme_color,
                        embed_position,
                        embed_language,
                        embed_voice_enabled,
                        telephony_enabled,
                        telephony_provider,
                        telephony_inbound_number,
                    }
                },
            )
            .unwrap_or_default())
    }

    async fn put_settings(
        &self,
        tenant: TenantId,
        settings: &TenantSettings,
    ) -> Result<(), StoreError> {
        sqlx::query(
            "INSERT INTO tenant_settings (tenant_id, llm_model, embed_model, stt_language, llm_base_url, llm_api_key_enc,
                embed_enabled, embed_public_key, embed_allowed_domains, embed_theme_color,
                embed_position, embed_language, embed_voice_enabled,
                telephony_enabled, telephony_provider, telephony_inbound_number, updated_at_unix)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
             ON CONFLICT (tenant_id) DO UPDATE
             SET llm_model = $2, embed_model = $3, stt_language = $4,
                 llm_base_url = $5, llm_api_key_enc = $6,
                 embed_enabled = $7, embed_public_key = $8, embed_allowed_domains = $9,
                 embed_theme_color = $10, embed_position = $11, embed_language = $12,
                 embed_voice_enabled = $13, telephony_enabled = $14, telephony_provider = $15,
                 telephony_inbound_number = $16, updated_at_unix = $17",
        )
        .bind(*tenant.as_uuid())
        .bind(&settings.llm_model)
        .bind(&settings.embed_model)
        .bind(&settings.stt_language)
        .bind(&settings.llm_base_url)
        .bind(&settings.llm_api_key_enc)
        .bind(settings.embed_enabled)
        .bind(&settings.embed_public_key)
        .bind(&settings.embed_allowed_domains)
        .bind(&settings.embed_theme_color)
        .bind(&settings.embed_position)
        .bind(&settings.embed_language)
        .bind(settings.embed_voice_enabled)
        .bind(settings.telephony_enabled)
        .bind(&settings.telephony_provider)
        .bind(&settings.telephony_inbound_number)
        .bind(now_unix() as i64)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn find_tenant_by_embed_key(&self, key: &str) -> Result<Option<TenantId>, StoreError> {
        let row: Option<(uuid::Uuid,)> =
            sqlx::query_as("SELECT tenant_id FROM tenant_settings WHERE embed_public_key = $1")
                .bind(key)
                .fetch_optional(&self.pool)
                .await?;
        match row {
            Some((id,)) => Ok(Some(
                TenantId::parse(&id.to_string()).map_err(|e| StoreError::new(e.to_string()))?,
            )),
            None => Ok(None),
        }
    }
}

#[async_trait]
impl AuditLog for PgStore {
    async fn record(
        &self,
        event: nordsvar_tenancy::TenantScoped<AuditEvent>,
    ) -> Result<(), StoreError> {
        let event = event.into_inner();
        sqlx::query(
            "INSERT INTO audit_events (id, tenant_id, actor, action, target, detail, at_unix)
             VALUES ($1, $2, $3, $4, $5, $6, $7)",
        )
        .bind(event.id)
        .bind(*event.tenant.as_uuid())
        .bind(&event.actor)
        .bind(&event.action)
        .bind(&event.target)
        .bind(&event.detail)
        .bind(event.at_unix as i64)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn list(&self, tenant: TenantId) -> Result<Vec<AuditEvent>, StoreError> {
        let rows = sqlx::query_as::<_, AuditRow>(
            "SELECT id, tenant_id, actor, action, target, detail, at_unix
             FROM audit_events WHERE tenant_id = $1 ORDER BY at_unix",
        )
        .bind(*tenant.as_uuid())
        .fetch_all(&self.pool)
        .await?;
        Ok(rows
            .into_iter()
            .map(|r| AuditEvent {
                id: r.id,
                tenant: TenantId::from_uuid(r.tenant_id),
                actor: r.actor,
                action: r.action,
                target: r.target,
                detail: r.detail,
                at_unix: r.at_unix as u64,
            })
            .collect())
    }
}

#[derive(sqlx::FromRow)]
struct AuditRow {
    id: uuid::Uuid,
    tenant_id: uuid::Uuid,
    actor: String,
    action: String,
    target: String,
    detail: serde_json::Value,
    at_unix: i64,
}

#[async_trait]
impl DocumentStore for PgStore {
    async fn record(&self, tenant: TenantId, doc: DocumentMeta) -> Result<(), StoreError> {
        sqlx::query(
            "INSERT INTO kb_documents (id, tenant_id, name, format, chunks_indexed, ingested_by, ingested_at_unix)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO NOTHING",
        )
        .bind(uuid::Uuid::parse_str(&doc.id).map_err(|e| StoreError::new(e.to_string()))?)
        .bind(*tenant.as_uuid())
        .bind(&doc.name)
        .bind(&doc.format)
        .bind(doc.chunks_indexed as i32)
        .bind(&doc.ingested_by)
        .bind(doc.ingested_at_unix as i64)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn list(&self, tenant: TenantId) -> Result<Vec<DocumentMeta>, StoreError> {
        let rows = sqlx::query_as::<_, DocRow>(
            "SELECT id, name, format, chunks_indexed, ingested_by, ingested_at_unix
             FROM kb_documents WHERE tenant_id = $1 ORDER BY ingested_at_unix",
        )
        .bind(*tenant.as_uuid())
        .fetch_all(&self.pool)
        .await?;
        Ok(rows
            .into_iter()
            .map(|r| DocumentMeta {
                id: r.id.to_string(),
                name: r.name,
                format: r.format,
                chunks_indexed: r.chunks_indexed as usize,
                ingested_by: r.ingested_by,
                ingested_at_unix: r.ingested_at_unix as u64,
            })
            .collect())
    }

    async fn delete(
        &self,
        tenant: TenantId,
        doc_id: &str,
    ) -> Result<Option<DocumentMeta>, StoreError> {
        let uuid = uuid::Uuid::parse_str(doc_id).map_err(|e| StoreError::new(e.to_string()))?;
        let row = sqlx::query_as::<_, DocRow>(
            "DELETE FROM kb_documents WHERE tenant_id = $1 AND id = $2
             RETURNING id, name, format, chunks_indexed, ingested_by, ingested_at_unix",
        )
        .bind(*tenant.as_uuid())
        .bind(uuid)
        .fetch_optional(&self.pool)
        .await?;
        Ok(row.map(|row| DocumentMeta {
            id: row.id.to_string(),
            name: row.name,
            format: row.format,
            chunks_indexed: row.chunks_indexed as usize,
            ingested_by: row.ingested_by,
            ingested_at_unix: row.ingested_at_unix as u64,
        }))
    }
}

#[derive(sqlx::FromRow)]
struct DocRow {
    id: uuid::Uuid,
    name: String,
    format: String,
    chunks_indexed: i32,
    ingested_by: String,
    ingested_at_unix: i64,
}

// ---- Local auth (AUTH_MODE=local) ----------------------------------------

fn role_to_str(role: nordsvar_tenancy::Role) -> &'static str {
    match role {
        nordsvar_tenancy::Role::EndUser => "end_user",
        nordsvar_tenancy::Role::Agent => "agent",
        nordsvar_tenancy::Role::TenantAdmin => "tenant_admin",
    }
}

fn role_from_str(raw: &str) -> Option<nordsvar_tenancy::Role> {
    match raw {
        "end_user" => Some(nordsvar_tenancy::Role::EndUser),
        "agent" => Some(nordsvar_tenancy::Role::Agent),
        "tenant_admin" => Some(nordsvar_tenancy::Role::TenantAdmin),
        _ => None,
    }
}

#[async_trait]
impl crate::local_auth::LocalAuthStore for PgStore {
    async fn count_users(&self) -> Result<usize, StoreError> {
        let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM local_users")
            .fetch_one(&self.pool)
            .await?;
        Ok(row.0 as usize)
    }

    async fn create_user(&self, user: crate::local_auth::LocalUser) -> Result<(), StoreError> {
        let result = sqlx::query(
            "INSERT INTO local_users (tenant_id, username, password_hash, role, created_at_unix)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (tenant_id, username) DO NOTHING",
        )
        .bind(*user.tenant.as_uuid())
        .bind(&user.username)
        .bind(&user.password_hash)
        .bind(role_to_str(user.role))
        .bind(user.created_at_unix as i64)
        .execute(&self.pool)
        .await?;
        if result.rows_affected() == 0 {
            return Err(StoreError::new(format!(
                "user {} already exists",
                user.username
            )));
        }
        Ok(())
    }

    async fn get_user(
        &self,
        tenant: TenantId,
        username: &str,
    ) -> Result<Option<crate::local_auth::LocalUser>, StoreError> {
        let row = sqlx::query_as::<_, (uuid::Uuid, String, String, String, i64)>(
            "SELECT tenant_id, username, password_hash, role, created_at_unix
             FROM local_users WHERE tenant_id = $1 AND username = $2",
        )
        .bind(*tenant.as_uuid())
        .bind(username)
        .fetch_optional(&self.pool)
        .await?;
        row.map(|(t, username, password_hash, role, created_at_unix)| {
            let role = role_from_str(&role)
                .ok_or_else(|| StoreError::new(format!("unknown role {role}")))?;
            Ok(crate::local_auth::LocalUser {
                tenant: TenantId::from_uuid(t),
                username,
                password_hash,
                role,
                created_at_unix: created_at_unix as u64,
            })
        })
        .transpose()
    }

    async fn create_session(
        &self,
        token_hash: &str,
        session: crate::local_auth::LocalSession,
    ) -> Result<(), StoreError> {
        // Opportunistic cleanup keeps the table small without a cron.
        sqlx::query("DELETE FROM local_sessions WHERE expires_at_unix <= $1")
            .bind(crate::local_auth::now_unix() as i64)
            .execute(&self.pool)
            .await?;
        sqlx::query(
            "INSERT INTO local_sessions (token_hash, tenant_id, username, role, created_at_unix, expires_at_unix)
             VALUES ($1, $2, $3, $4, $5, $6)",
        )
        .bind(token_hash)
        .bind(*session.tenant.as_uuid())
        .bind(&session.username)
        .bind(role_to_str(session.role))
        .bind(crate::local_auth::now_unix() as i64)
        .bind(session.expires_at_unix as i64)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn resolve_session(
        &self,
        token_hash: &str,
    ) -> Result<Option<crate::local_auth::LocalSession>, StoreError> {
        let row = sqlx::query_as::<_, (uuid::Uuid, String, String, i64)>(
            "SELECT tenant_id, username, role, expires_at_unix
             FROM local_sessions WHERE token_hash = $1 AND expires_at_unix > $2",
        )
        .bind(token_hash)
        .bind(crate::local_auth::now_unix() as i64)
        .fetch_optional(&self.pool)
        .await?;
        row.map(|(t, username, role, expires_at_unix)| {
            let role = role_from_str(&role)
                .ok_or_else(|| StoreError::new(format!("unknown role {role}")))?;
            Ok(crate::local_auth::LocalSession {
                tenant: TenantId::from_uuid(t),
                username,
                role,
                expires_at_unix: expires_at_unix as u64,
            })
        })
        .transpose()
    }

    async fn tenants_with_users(&self) -> Result<Vec<TenantId>, StoreError> {
        let rows = sqlx::query_as::<_, (uuid::Uuid,)>("SELECT DISTINCT tenant_id FROM local_users")
            .fetch_all(&self.pool)
            .await?;
        Ok(rows
            .into_iter()
            .map(|(t,)| TenantId::from_uuid(t))
            .collect())
    }
}

fn now_unix() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}
