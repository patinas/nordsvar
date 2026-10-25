//! Session storage. The trait is keyed by `TenantId` at every entry point;
//! the in-memory implementation keeps a physically separate map per tenant
//! so a cross-tenant lookup cannot even reach the wrong row.

use async_trait::async_trait;
use nordsvar_tenancy::TenantId;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::sync::RwLock;
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct SessionId(Uuid);

impl SessionId {
    pub fn new() -> Self {
        Self(Uuid::new_v4())
    }

    pub fn from_uuid(uuid: Uuid) -> Self {
        Self(uuid)
    }

    pub fn parse(raw: &str) -> Result<Self, uuid::Error> {
        Uuid::parse_str(raw.trim()).map(Self)
    }

    pub fn as_uuid(&self) -> &Uuid {
        &self.0
    }
}

impl Default for SessionId {
    fn default() -> Self {
        Self::new()
    }
}

impl std::fmt::Display for SessionId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SessionStatus {
    Active,
    Ended,
}

/// A claim without a heartbeat for this long is considered dead. The
/// worker heartbeats every 30 s, so this is 3x the heartbeat interval.
pub const CLAIM_STALE_AFTER_SECS: u64 = 90;

/// Operator-managed per-tenant AI overrides. `None` means "use the
/// deployment default" (the worker's env config); the API stores and
/// forwards overrides, the worker resolves the effective value at
/// session start.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TenantSettings {
    /// Ollama/vLLM model name, e.g. "llama3.1:8b".
    pub llm_model: Option<String>,
    /// Embedding model name, e.g. "nomic-embed-text".
    pub embed_model: Option<String>,
    /// Whisper language code, e.g. "da".
    pub stt_language: Option<String>,
    /// OpenAI-compatible endpoint base URL, e.g. "https://api.openai.com/v1"
    /// or a local vLLM. When set, the worker uses chat-completions instead
    /// of the Ollama default.
    pub llm_base_url: Option<String>,
    /// Provider API key, AES-256-GCM ciphertext (see crypto.rs). Never
    /// serialized - plaintext leaves the API only over the internal claim
    /// route to the worker.
    #[serde(skip)]
    pub llm_api_key_enc: Option<Vec<u8>>,
    /// Website embed widget enabled for this tenant.
    pub embed_enabled: Option<bool>,
    /// Public embed key (pk_...). Public by design: identifies the tenant
    /// in page source, grants nothing by itself. NOT a secret.
    pub embed_public_key: Option<String>,
    /// Comma-separated allowed website origins (hosts; subdomains match).
    pub embed_allowed_domains: Option<String>,
    /// Widget theme color, e.g. "#1a7f5a".
    pub embed_theme_color: Option<String>,
    /// Widget position: "right" or "left".
    pub embed_position: Option<String>,
    /// Widget language: "da" or "en".
    pub embed_language: Option<String>,
    /// Whether embed visitors may start a voice session.
    pub embed_voice_enabled: Option<bool>,
    /// Telephony (SIP) intent, stored pre-activation. Nothing connects to a
    /// provider until the operator deploys the SIP gateway (docs/TELEPHONY.md).
    pub telephony_enabled: Option<bool>,
    /// Free-form provider label chosen by the tenant, e.g. "twilio".
    pub telephony_provider: Option<String>,
    /// Inbound phone number in E.164, once the tenant has one.
    pub telephony_inbound_number: Option<String>,
}

/// Tenant settings persistence. Tenant-scoped like everything else.
#[async_trait]
pub trait SettingsStore: Send + Sync {
    async fn get_settings(&self, tenant: TenantId) -> Result<TenantSettings, StoreError>;
    async fn put_settings(
        &self,
        tenant: TenantId,
        settings: &TenantSettings,
    ) -> Result<(), StoreError>;
    /// Reverse lookup for the public embed surface: which tenant owns this
    /// embed key. Returns None for unknown keys.
    async fn find_tenant_by_embed_key(&self, key: &str) -> Result<Option<TenantId>, StoreError>;
}

#[derive(Debug, Default)]
pub struct InMemorySettingsStore {
    inner: Arc<RwLock<HashMap<TenantId, TenantSettings>>>,
}

#[async_trait]
impl SettingsStore for InMemorySettingsStore {
    async fn get_settings(&self, tenant: TenantId) -> Result<TenantSettings, StoreError> {
        let guard = self.inner.read().await;
        Ok(guard.get(&tenant).cloned().unwrap_or_default())
    }

    async fn put_settings(
        &self,
        tenant: TenantId,
        settings: &TenantSettings,
    ) -> Result<(), StoreError> {
        let mut guard = self.inner.write().await;
        guard.insert(tenant, settings.clone());
        Ok(())
    }

    async fn find_tenant_by_embed_key(&self, key: &str) -> Result<Option<TenantId>, StoreError> {
        let guard = self.inner.read().await;
        Ok(guard
            .iter()
            .find(|(_, s)| s.embed_public_key.as_deref() == Some(key))
            .map(|(t, _)| *t))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: SessionId,
    pub tenant: TenantId,
    /// LiveKit room name: derived from the session id, never client-supplied.
    pub room: String,
    pub created_by: String,
    pub created_at_unix: u64,
    pub status: SessionStatus,
    pub ended_at_unix: Option<u64>,
    /// Worker instance that claimed the AI seat in this session.
    pub claimed_by: Option<String>,
    /// Last claim/heartbeat time. A claim older than
    /// [`CLAIM_STALE_AFTER_SECS`] without a heartbeat means the worker
    /// died; the session becomes claimable again.
    pub claimed_at_unix: Option<u64>,
}

impl Session {
    pub fn new(tenant: TenantId, created_by: &str) -> Self {
        let id = SessionId::new();
        Self {
            id,
            tenant,
            room: format!("session-{id}"),
            created_by: created_by.to_string(),
            created_at_unix: now_unix(),
            status: SessionStatus::Active,
            ended_at_unix: None,
            claimed_by: None,
            claimed_at_unix: None,
        }
    }
}

fn now_unix() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

/// Storage failure. Carries the driver error text for logs; routes map it
/// to a generic 500 - never leak backend detail to callers.
#[derive(Debug, thiserror::Error)]
#[error("store error: {0}")]
pub struct StoreError(String);

impl StoreError {
    pub fn new(message: impl Into<String>) -> Self {
        Self(message.into())
    }
}

impl From<sqlx::Error> for StoreError {
    fn from(e: sqlx::Error) -> Self {
        Self(e.to_string())
    }
}

#[async_trait]
pub trait SessionStore: Send + Sync {
    async fn create(&self, tenant: TenantId, session: Session) -> Result<Session, StoreError>;
    /// Returns None both for unknown sessions and for sessions owned by a
    /// different tenant - the two cases are indistinguishable by design.
    async fn get(&self, tenant: TenantId, id: SessionId) -> Result<Option<Session>, StoreError>;
    /// Tenant-free lookup for internal worker routes (footprints); the
    /// caller resolves the tenant from the row and scopes from there.
    async fn get_by_id(&self, id: SessionId) -> Result<Option<Session>, StoreError>;
    async fn end(&self, tenant: TenantId, id: SessionId) -> Result<Option<Session>, StoreError>;
    async fn list(&self, tenant: TenantId) -> Result<Vec<Session>, StoreError>;
    /// Internal (worker dispatch) only: active sessions across ALL
    /// tenants that need an AI participant - never claimed, or claimed by
    /// a worker whose heartbeat has gone stale (worker died mid-call).
    /// Never expose through a tenant-scoped route.
    async fn list_unclaimed(&self) -> Result<Vec<Session>, StoreError>;
    /// Atomically claim a session for a worker. Returns the session on
    /// success; None when already claimed (with a live heartbeat) or
    /// unknown/ended. Reclaiming a stale claim is allowed and expected.
    async fn claim(&self, id: SessionId, worker: &str) -> Result<Option<Session>, StoreError>;
    /// Worker liveness: refresh the claim timestamp. Returns false when
    /// the session is not actively claimed by this worker (ended, or
    /// reclaimed after this worker went silent), which tells the worker
    /// its session is no longer its own.
    async fn heartbeat(&self, id: SessionId, worker: &str) -> Result<bool, StoreError>;
}

#[derive(Debug, Default)]
pub struct InMemorySessionStore {
    inner: Arc<RwLock<HashMap<TenantId, HashMap<SessionId, Session>>>>,
}

#[async_trait]
impl SessionStore for InMemorySessionStore {
    async fn create(&self, tenant: TenantId, session: Session) -> Result<Session, StoreError> {
        let mut guard = self.inner.write().await;
        guard
            .entry(tenant)
            .or_default()
            .insert(session.id, session.clone());
        Ok(session)
    }

    async fn get(&self, tenant: TenantId, id: SessionId) -> Result<Option<Session>, StoreError> {
        Ok(self
            .inner
            .read()
            .await
            .get(&tenant)
            .and_then(|m| m.get(&id).cloned()))
    }

    async fn get_by_id(&self, id: SessionId) -> Result<Option<Session>, StoreError> {
        Ok(self
            .inner
            .read()
            .await
            .values()
            .find_map(|m| m.get(&id).cloned()))
    }

    async fn end(&self, tenant: TenantId, id: SessionId) -> Result<Option<Session>, StoreError> {
        let mut guard = self.inner.write().await;
        let Some(session) = guard.get_mut(&tenant).and_then(|m| m.get_mut(&id)) else {
            return Ok(None);
        };
        if session.status == SessionStatus::Active {
            session.status = SessionStatus::Ended;
            session.ended_at_unix = Some(now_unix());
        }
        Ok(Some(session.clone()))
    }

    async fn list(&self, tenant: TenantId) -> Result<Vec<Session>, StoreError> {
        let guard = self.inner.read().await;
        let mut sessions: Vec<Session> = guard
            .get(&tenant)
            .map(|m| m.values().cloned().collect())
            .unwrap_or_default();
        sessions.sort_by_key(|s| s.created_at_unix);
        Ok(sessions)
    }

    async fn list_unclaimed(&self) -> Result<Vec<Session>, StoreError> {
        let guard = self.inner.read().await;
        Ok(guard
            .values()
            .flat_map(|m| m.values())
            .filter(|s| {
                s.status == SessionStatus::Active
                    && (s.claimed_by.is_none() || claim_is_stale(s.claimed_at_unix))
            })
            .cloned()
            .collect())
    }

    async fn claim(&self, id: SessionId, worker: &str) -> Result<Option<Session>, StoreError> {
        let mut guard = self.inner.write().await;
        for sessions in guard.values_mut() {
            if let Some(session) = sessions.get_mut(&id) {
                if session.status != SessionStatus::Active {
                    return Ok(None);
                }
                if session.claimed_by.is_some() && !claim_is_stale(session.claimed_at_unix) {
                    return Ok(None); // live claim held by another worker
                }
                session.claimed_by = Some(worker.to_string());
                session.claimed_at_unix = Some(now_unix());
                return Ok(Some(session.clone()));
            }
        }
        Ok(None)
    }

    async fn heartbeat(&self, id: SessionId, worker: &str) -> Result<bool, StoreError> {
        let mut guard = self.inner.write().await;
        for sessions in guard.values_mut() {
            if let Some(session) = sessions.get_mut(&id) {
                if session.status == SessionStatus::Active
                    && session.claimed_by.as_deref() == Some(worker)
                {
                    session.claimed_at_unix = Some(now_unix());
                    return Ok(true);
                }
                return Ok(false);
            }
        }
        Ok(false)
    }
}

/// Dead-worker detector: a claim with no heartbeat within the staleness
/// window, or (pre-heartbeat deployments) no timestamp at all.
fn claim_is_stale(claimed_at_unix: Option<u64>) -> bool {
    match claimed_at_unix {
        Some(at) => now_unix().saturating_sub(at) > CLAIM_STALE_AFTER_SECS,
        None => true,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn cross_tenant_get_returns_none() {
        let store = InMemorySessionStore::default();
        let a = TenantId::new();
        let b = TenantId::new();
        let session = store.create(a, Session::new(a, "alice")).await.unwrap();
        assert!(store.get(a, session.id).await.unwrap().is_some());
        assert!(store.get(b, session.id).await.unwrap().is_none());
        assert!(store.list(b).await.unwrap().is_empty());
    }

    #[tokio::test]
    async fn stale_claim_is_listed_and_reclaimable() {
        let store = InMemorySessionStore::default();
        let t = TenantId::new();
        let mut session = Session::new(t, "alice");
        // A worker that died two staleness windows ago.
        session.claimed_by = Some("dead-worker".into());
        session.claimed_at_unix = Some(now_unix() - 2 * CLAIM_STALE_AFTER_SECS - 10);
        let session = store.create(t, session).await.unwrap();

        let unclaimed = store.list_unclaimed().await.unwrap();
        assert!(unclaimed.iter().any(|s| s.id == session.id));
        let reclaimed = store
            .claim(session.id, "live-worker")
            .await
            .unwrap()
            .unwrap();
        assert_eq!(reclaimed.claimed_by.as_deref(), Some("live-worker"));
        // The new claim is fresh: no longer listed, and a third worker
        // cannot steal it.
        assert!(store.list_unclaimed().await.unwrap().is_empty());
        assert!(store.claim(session.id, "thief").await.unwrap().is_none());
    }

    #[tokio::test]
    async fn live_claim_blocks_reclaim() {
        let store = InMemorySessionStore::default();
        let t = TenantId::new();
        let mut session = Session::new(t, "alice");
        session.claimed_by = Some("busy-worker".into());
        session.claimed_at_unix = Some(now_unix());
        let session = store.create(t, session).await.unwrap();
        assert!(store.list_unclaimed().await.unwrap().is_empty());
        assert!(store.claim(session.id, "other").await.unwrap().is_none());
    }

    #[tokio::test]
    async fn claim_without_timestamp_is_stale() {
        // Sessions claimed before heartbeats existed have no timestamp;
        // they must be recoverable, not orphaned forever.
        let store = InMemorySessionStore::default();
        let t = TenantId::new();
        let mut session = Session::new(t, "alice");
        session.claimed_by = Some("legacy-worker".into());
        session.claimed_at_unix = None;
        let session = store.create(t, session).await.unwrap();
        assert!(store
            .claim(session.id, "live-worker")
            .await
            .unwrap()
            .is_some());
    }

    #[tokio::test]
    async fn heartbeat_refreshes_only_for_the_owning_worker() {
        let store = InMemorySessionStore::default();
        let t = TenantId::new();
        let session = store.create(t, Session::new(t, "alice")).await.unwrap();
        // Unclaimed: nothing to refresh.
        assert!(!store.heartbeat(session.id, "w1").await.unwrap());
        store.claim(session.id, "w1").await.unwrap();
        assert!(store.heartbeat(session.id, "w1").await.unwrap());
        // Wrong worker must not keep someone else's claim alive.
        assert!(!store.heartbeat(session.id, "w2").await.unwrap());
        // Unknown session id: false, not an error.
        assert!(!store.heartbeat(SessionId::new(), "w1").await.unwrap());
        // Ended session: claim is over.
        store.end(t, session.id).await.unwrap();
        assert!(!store.heartbeat(session.id, "w1").await.unwrap());
    }

    #[tokio::test]
    async fn end_is_idempotent() {
        let store = InMemorySessionStore::default();
        let t = TenantId::new();
        let session = store.create(t, Session::new(t, "alice")).await.unwrap();
        let first = store.end(t, session.id).await.unwrap().unwrap();
        let second = store.end(t, session.id).await.unwrap().unwrap();
        assert_eq!(first.status, SessionStatus::Ended);
        assert_eq!(first.ended_at_unix, second.ended_at_unix);
    }
}

/// Metadata about one ingested knowledge document (vectors live in the
/// vector index; this is the registry).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentMeta {
    pub id: String,
    pub name: String,
    pub format: String,
    pub chunks_indexed: usize,
    pub ingested_by: String,
    pub ingested_at_unix: u64,
}

#[async_trait]
pub trait DocumentStore: Send + Sync {
    async fn record(&self, tenant: TenantId, doc: DocumentMeta) -> Result<(), StoreError>;
    async fn list(&self, tenant: TenantId) -> Result<Vec<DocumentMeta>, StoreError>;
    /// Returns the removed record so the caller can delete its vectors.
    async fn delete(
        &self,
        tenant: TenantId,
        doc_id: &str,
    ) -> Result<Option<DocumentMeta>, StoreError>;
}

#[derive(Debug, Default)]
pub struct InMemoryDocumentStore {
    inner: Arc<RwLock<HashMap<TenantId, HashMap<String, DocumentMeta>>>>,
}

#[async_trait]
impl DocumentStore for InMemoryDocumentStore {
    async fn record(&self, tenant: TenantId, doc: DocumentMeta) -> Result<(), StoreError> {
        self.inner
            .write()
            .await
            .entry(tenant)
            .or_default()
            .insert(doc.id.clone(), doc);
        Ok(())
    }

    async fn list(&self, tenant: TenantId) -> Result<Vec<DocumentMeta>, StoreError> {
        let guard = self.inner.read().await;
        let mut docs: Vec<DocumentMeta> = guard
            .get(&tenant)
            .map(|m| m.values().cloned().collect())
            .unwrap_or_default();
        docs.sort_by_key(|d| d.ingested_at_unix);
        Ok(docs)
    }

    async fn delete(
        &self,
        tenant: TenantId,
        doc_id: &str,
    ) -> Result<Option<DocumentMeta>, StoreError> {
        Ok(self
            .inner
            .write()
            .await
            .get_mut(&tenant)
            .and_then(|m| m.remove(doc_id)))
    }
}

#[cfg(test)]
mod document_tests {
    use super::*;

    fn meta(id: &str) -> DocumentMeta {
        DocumentMeta {
            id: id.into(),
            name: format!("{id}.md"),
            format: "markdown".into(),
            chunks_indexed: 3,
            ingested_by: "it".into(),
            ingested_at_unix: 1,
        }
    }

    #[tokio::test]
    async fn documents_are_tenant_partitioned() {
        let store = InMemoryDocumentStore::default();
        let a = TenantId::new();
        let b = TenantId::new();
        store.record(a, meta("d1")).await.unwrap();
        assert_eq!(store.list(a).await.unwrap().len(), 1);
        assert!(store.list(b).await.unwrap().is_empty());
        assert!(store.delete(b, "d1").await.unwrap().is_none());
        assert!(store.delete(a, "d1").await.unwrap().is_some());
        assert!(store.list(a).await.unwrap().is_empty());
    }
}
