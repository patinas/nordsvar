//! Application state and router assembly.

use crate::audit::{AuditLog, InMemoryAuditLog};
use crate::config::Config;
use crate::routes;
use crate::store::{
    DocumentStore, InMemoryDocumentStore, InMemorySessionStore, InMemorySettingsStore,
    SessionStore, SettingsStore,
};
use axum::Router;
use nordsvar_ai_core::fakes::FakeEmbedder;
use nordsvar_ai_core::ports::Embedder;
use nordsvar_kb_ingest::{InMemoryVectorIndex, Ingestor, QdrantIndex, VectorIndex};
use std::sync::Arc;

/// KB ingestion wiring. The stack is chosen at boot from Config::kb:
/// Qdrant + Ollama when QDRANT_URL is set, in-memory fakes otherwise.
pub type KbIngestor = Ingestor<Arc<dyn Embedder>, Arc<dyn VectorIndex>>;

#[derive(Clone)]
pub struct AppState {
    pub config: Arc<Config>,
    /// OIDC token validator. Some only in AuthMode::Oidc.
    pub oidc: Option<Arc<crate::oidc::OidcValidator>>,
    pub sessions: Arc<dyn SessionStore>,
    pub audit: Arc<dyn AuditLog>,
    pub kb_ingestor: Arc<KbIngestor>,
    pub kb_index: Arc<dyn VectorIndex>,
    pub documents: Arc<dyn DocumentStore>,
    /// Local username/password accounts. Used only in AuthMode::Local.
    pub local_auth: crate::local_auth::SharedLocalAuth,
    /// Operator-managed per-tenant AI overrides.
    pub settings: Arc<dyn SettingsStore>,
    /// Query embedder, shared with ingestion, for embed-widget retrieval.
    pub kb_embedder: Arc<dyn Embedder>,
    /// Ephemeral embed sessions and public-surface rate limiters.
    pub embed: Arc<crate::embed::EmbedState>,
}

impl AppState {
    /// Production wiring: PostgreSQL-backed stores.
    pub fn postgres(config: Config, pg: crate::store_pg::PgStore) -> Self {
        let shared = Arc::new(pg);
        let (embedder, kb_index) = kb_stack(&config);
        let oidc = Self::build_oidc(&config);
        Self {
            config: Arc::new(config),
            oidc,
            sessions: shared.clone(),
            audit: shared.clone(),
            kb_ingestor: Arc::new(Ingestor::new(embedder.clone(), kb_index.clone())),
            kb_index,
            documents: shared.clone(),
            local_auth: shared.clone(),
            settings: shared,
            kb_embedder: embedder,
            embed: Arc::new(crate::embed::EmbedState::new()),
        }
    }

    /// In-memory wiring with a caller-supplied OIDC validator (tests inject
    /// a static JWKS source instead of HTTP).
    pub fn in_memory_with_oidc(config: Config, validator: Arc<crate::oidc::OidcValidator>) -> Self {
        let mut state = Self::in_memory(config);
        state.oidc = Some(validator);
        state
    }

    fn build_oidc(config: &Config) -> Option<Arc<crate::oidc::OidcValidator>> {
        config.oidc.clone().map(|oidc_config| {
            let source = Arc::new(crate::oidc::HttpJwksSource::new(
                oidc_config.jwks_url.clone(),
            ));
            Arc::new(crate::oidc::OidcValidator::new(oidc_config, source))
        })
    }

    /// Development/test wiring: in-memory stores.
    pub fn in_memory(config: Config) -> Self {
        let kb_index: Arc<dyn VectorIndex> = Arc::new(InMemoryVectorIndex::default());
        let embedder: Arc<dyn Embedder> = Arc::new(FakeEmbedder { dim: 8 });
        let oidc = Self::build_oidc(&config);
        Self {
            config: Arc::new(config),
            oidc,
            sessions: Arc::new(InMemorySessionStore::default()),
            audit: Arc::new(InMemoryAuditLog::default()),
            kb_ingestor: Arc::new(Ingestor::new(embedder.clone(), kb_index.clone())),
            kb_index,
            documents: Arc::new(InMemoryDocumentStore::default()),
            local_auth: Arc::new(crate::local_auth::InMemoryLocalAuth::default()),
            settings: Arc::new(InMemorySettingsStore::default()),
            kb_embedder: embedder,
            embed: Arc::new(crate::embed::EmbedState::new()),
        }
    }
}

/// Pick the KB embedder + vector index from configuration. With QDRANT_URL
/// set, ingestion embeds via the operator's Ollama and stores in the same
/// per-tenant Qdrant collections the worker retrieves from, so documents
/// survive restarts and are searchable in calls. Without it, ingestion
/// falls back to the in-memory fakes (development only) with a loud warn.
pub fn kb_stack(config: &Config) -> (Arc<dyn Embedder>, Arc<dyn VectorIndex>) {
    match &config.kb.qdrant_url {
        Some(url) => {
            tracing::info!(qdrant = %url, embed_model = %config.kb.embed_model,
                "KB vector stack: Qdrant + Ollama");
            (
                Arc::new(nordsvar_ai_core::ollama::OllamaEmbedder::new(
                    config.kb.embed_url.clone(),
                    config.kb.embed_model.clone(),
                )),
                Arc::new(QdrantIndex::new(url.clone())),
            )
        }
        None => {
            tracing::warn!(
                "QDRANT_URL unset; KB ingestion is in-memory and loses documents on restart (development only)"
            );
            (
                Arc::new(FakeEmbedder { dim: 8 }),
                Arc::new(InMemoryVectorIndex::default()),
            )
        }
    }
}

pub fn build_router(state: AppState) -> Router {
    Router::new()
        .nest("/v1", routes::router())
        .nest("/v1", crate::routes_internal::router())
        .nest("/v1/public", crate::embed::public_router())
        .route("/healthz", axum::routing::get(routes::healthz))
        .with_state(state)
}
