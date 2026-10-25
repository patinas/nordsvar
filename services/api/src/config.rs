//! Runtime configuration, loaded from the environment.

use std::time::Duration;

/// Authentication mode. Dev mode trusts static headers and exists for local
/// development and tests only; production uses OIDC (see docs/SECURITY.md).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AuthMode {
    Dev,
    Oidc,
    /// Local username/password accounts (self-hosting without an IdP).
    Local,
}

#[derive(Debug, Clone)]
pub struct Config {
    pub bind_addr: String,
    pub livekit_url: String,
    /// Client-facing LiveKit URL handed to browsers in join tickets.
    /// LIVEKIT_URL is the internal address the api/worker use; browsers
    /// cannot reach it when it is a compose DNS name, so deployments set
    /// this to the externally reachable (wss) address. None falls back to
    /// livekit_url (single-host development).
    pub livekit_public_url: Option<String>,
    /// TURN relay advertised to browsers in join tickets. Needed when the
    /// LiveKit media ports are unreachable from clients (e.g. the
    /// TCP/443-only Codespaces tunnel): browsers then relay via TURN.
    /// None advertises no TURN server (direct connectivity expected).
    pub turn_url: Option<String>,
    pub turn_username: Option<String>,
    pub turn_credential: Option<String>,
    pub livekit_api_key: String,
    pub livekit_api_secret: String,
    pub token_ttl: Duration,
    pub auth_mode: AuthMode,
    /// OIDC settings. Present exactly when auth_mode is Oidc.
    pub oidc: Option<crate::oidc::OidcConfig>,
    /// Shared secret for the internal worker-dispatch routes. None disables
    /// those routes entirely (fail closed).
    pub internal_token: Option<String>,
    /// Knowledge-base vector stack. None keeps ingestion in-memory
    /// (development only); production sets QDRANT_URL + EMBED_URL.
    pub kb: KbConfig,
    /// Deployment-default LLM endpoint (Ollama/vLLM) for the embed text
    /// path, mirroring the worker's LLM_URL. None disables embed text
    /// answers unless the tenant configured its own provider.
    pub llm_url: Option<String>,
    /// Default model name used with llm_url, and the fallback model for
    /// tenant provider overrides that do not name one.
    pub llm_model: String,
    /// AES-256 key for encrypting operator-provided secrets at rest
    /// (provider API keys). From SETTINGS_KEY as 64 hex chars. Required
    /// to store or use an API key; without it the settings routes that
    /// need it fail closed.
    pub settings_key: Option<[u8; 32]>,
    /// Relevance floor for embed chat answers (RETRIEVAL_MIN_SCORE; None = off).
    pub retrieval_min_score: Option<f32>,
}

/// Where ingestion embeds and stores vectors. Mirrors the worker's
/// EMBED_URL/EMBED_MODEL/QDRANT_URL so both sides share one Ollama and one
/// Qdrant with per-tenant collections.
#[derive(Debug, Clone)]
pub struct KbConfig {
    /// Durable vector store URL (Qdrant). Empty means the in-memory index.
    pub qdrant_url: Option<String>,
    pub embed_url: String,
    pub embed_model: String,
}

impl Config {
    pub fn from_env() -> Self {
        let config = Self {
            bind_addr: std::env::var("BIND_ADDR").unwrap_or_else(|_| "0.0.0.0:8080".into()),
            livekit_url: std::env::var("LIVEKIT_URL")
                .unwrap_or_else(|_| "ws://localhost:7880".into()),
            livekit_public_url: std::env::var("LIVEKIT_PUBLIC_URL")
                .ok()
                .filter(|v| !v.trim().is_empty()),
            turn_url: std::env::var("TURN_URL")
                .ok()
                .filter(|v| !v.trim().is_empty()),
            turn_username: std::env::var("TURN_USERNAME")
                .ok()
                .filter(|v| !v.trim().is_empty()),
            turn_credential: std::env::var("TURN_CREDENTIAL")
                .ok()
                .filter(|v| !v.trim().is_empty()),
            // Dev keys match docker-compose.yml. Production installs inject
            // keys from the enterprise secret store.
            livekit_api_key: std::env::var("LIVEKIT_API_KEY").unwrap_or_else(|_| "devkey".into()),
            livekit_api_secret: std::env::var("LIVEKIT_API_SECRET")
                .unwrap_or_else(|_| "devsecret-change-me".into()),
            token_ttl: Duration::from_secs(
                std::env::var("JOIN_TOKEN_TTL_SECS")
                    .ok()
                    .and_then(|v| v.parse().ok())
                    .unwrap_or(900),
            ),
            auth_mode: match std::env::var("AUTH_MODE").as_deref() {
                Ok("oidc") => AuthMode::Oidc,
                Ok("local") => AuthMode::Local,
                _ => AuthMode::Dev,
            },
            internal_token: std::env::var("INTERNAL_TOKEN")
                .ok()
                .filter(|t| !t.is_empty()),
            llm_url: std::env::var("LLM_URL").ok().filter(|t| !t.is_empty()),
            llm_model: std::env::var("LLM_MODEL").unwrap_or_else(|_| "llama3".into()),
            retrieval_min_score: nordsvar_ai_core::pipeline::min_score_from_env(),
            settings_key: std::env::var("SETTINGS_KEY")
                .ok()
                .and_then(|v| crate::crypto::parse_key(&v)),
            kb: KbConfig {
                qdrant_url: std::env::var("QDRANT_URL").ok().filter(|t| !t.is_empty()),
                embed_url: std::env::var("EMBED_URL")
                    .unwrap_or_else(|_| "http://localhost:11434".into()),
                embed_model: std::env::var("EMBED_MODEL")
                    .unwrap_or_else(|_| "nomic-embed-text".into()),
            },
            oidc: None,
        };
        let mut config = config;
        config.oidc = crate::oidc::OidcConfig::from_env(config.auth_mode)
            .unwrap_or_else(|e| panic!("invalid OIDC configuration: {e}"));
        config
    }

    /// Fixed configuration for tests.
    pub fn test() -> Self {
        Self {
            bind_addr: "127.0.0.1:0".into(),
            livekit_url: "ws://livekit.test:7880".into(),
            livekit_public_url: None,
            turn_url: None,
            turn_username: None,
            turn_credential: None,
            livekit_api_key: "testkey".into(),
            livekit_api_secret: "testsecret".into(),
            token_ttl: Duration::from_secs(900),
            auth_mode: AuthMode::Dev,
            oidc: None,
            internal_token: None,
            llm_url: None,
            llm_model: "llama3".into(),
            settings_key: Some([9u8; 32]),
            retrieval_min_score: None,
            kb: KbConfig {
                qdrant_url: None,
                embed_url: "http://ollama.test:11434".into(),
                embed_model: "nomic-embed-text".into(),
            },
        }
    }

    /// Test configuration in OIDC mode with the given static settings.
    pub fn test_oidc(oidc: crate::oidc::OidcConfig) -> Self {
        let mut config = Self::test();
        config.auth_mode = AuthMode::Oidc;
        config.oidc = Some(oidc);
        config
    }

    /// Test configuration with the internal dispatch token enabled.
    pub fn test_with_internal_token(token: &str) -> Self {
        let mut config = Self::test();
        config.internal_token = Some(token.to_string());
        config
    }
}
