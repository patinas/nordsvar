//! Session dispatch: poll the API for unclaimed active sessions, claim
//! them, and run each on its own pipeline task (pooled per tenant, D-003).

use crate::adapters::{OllamaEmbedder, OllamaLlm, PiperHttpTts, WhisperHttpStt};
use crate::gateway::{MediaGateway, SessionDescriptor};
use crate::runtime::{self};
use nordsvar_ai_core::SupportPipeline;
use nordsvar_kb_ingest::{QdrantIndex, RetrieverOverIndex};
use nordsvar_tenancy::TenantId;
use std::sync::Arc;
use std::time::Duration;

#[derive(Debug, Clone)]
pub struct WorkerConfig {
    pub api_url: String,
    pub internal_token: String,
    pub livekit_url: String,
    pub livekit_api_key: String,
    pub livekit_api_secret: String,
    pub stt_url: String,
    pub llm_url: String,
    pub llm_model: String,
    pub tts_url: String,
    pub embed_url: String,
    pub embed_model: String,
    pub qdrant_url: String,
    pub stt_language: String,
    pub poll_interval: Duration,
    /// Identity used for session claims/heartbeats. Per-instance so a
    /// crashed worker's stale claims are reclaimable without a survivor
    /// accidentally fencing a live one. NORDSVAR_WORKER_ID overrides;
    /// defaults to HOSTNAME, then the legacy constant.
    pub worker_id: String,
}

impl WorkerConfig {
    pub fn from_env() -> Self {
        Self {
            api_url: std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:8080".into()),
            internal_token: std::env::var("INTERNAL_TOKEN").unwrap_or_default(),
            livekit_url: std::env::var("LIVEKIT_URL")
                .unwrap_or_else(|_| "ws://localhost:7880".into()),
            livekit_api_key: std::env::var("LIVEKIT_API_KEY").unwrap_or_else(|_| "devkey".into()),
            livekit_api_secret: std::env::var("LIVEKIT_API_SECRET")
                .unwrap_or_else(|_| "devsecret-change-me".into()),
            stt_url: std::env::var("STT_URL").unwrap_or_else(|_| "http://localhost:8000".into()),
            llm_url: std::env::var("LLM_URL").unwrap_or_else(|_| "http://localhost:11434".into()),
            llm_model: std::env::var("LLM_MODEL").unwrap_or_else(|_| "llama3".into()),
            tts_url: std::env::var("TTS_URL").unwrap_or_else(|_| "http://localhost:5000".into()),
            embed_url: std::env::var("EMBED_URL")
                .unwrap_or_else(|_| "http://localhost:11434".into()),
            embed_model: std::env::var("EMBED_MODEL").unwrap_or_else(|_| "nomic-embed-text".into()),
            qdrant_url: std::env::var("QDRANT_URL")
                .unwrap_or_else(|_| "http://localhost:6333".into()),
            stt_language: std::env::var("STT_LANGUAGE").unwrap_or_else(|_| "da".into()),
            poll_interval: Duration::from_secs(2),
            worker_id: std::env::var("NORDSVAR_WORKER_ID")
                .or_else(|_| std::env::var("HOSTNAME"))
                .unwrap_or_else(|_| "nordsvar-ai-worker".into()),
        }
    }
}

#[derive(Debug, serde::Deserialize)]
struct UnclaimedSession {
    id: String,
    // tenant and room come back from the claim response after a won race.
}

#[derive(Debug, serde::Deserialize)]
struct ClaimResponse {
    tenant: String,
    room: String,
    /// Operator-managed per-tenant AI overrides (None = env default).
    #[serde(default)]
    settings: TenantSettingsWire,
}

#[derive(Debug, Default, serde::Deserialize)]
pub struct TenantSettingsWire {
    pub llm_model: Option<String>,
    pub embed_model: Option<String>,
    pub stt_language: Option<String>,
    /// OpenAI-compatible endpoint override; when set, chat-completions
    /// replaces the Ollama default for this session.
    pub llm_base_url: Option<String>,
    /// Decrypted provider key, delivered over the internal claim channel.
    pub llm_api_key: Option<String>,
}

/// Effective AI parameters for a session: operator overrides win, env
/// defaults otherwise.
fn effective_ai_params(
    config: &WorkerConfig,
    settings: &TenantSettingsWire,
) -> (String, String, String) {
    (
        settings
            .llm_model
            .clone()
            .unwrap_or_else(|| config.llm_model.clone()),
        settings
            .embed_model
            .clone()
            .unwrap_or_else(|| config.embed_model.clone()),
        settings
            .stt_language
            .clone()
            .unwrap_or_else(|| config.stt_language.clone()),
    )
}

/// Build the tenant-bound pipeline from configured local model endpoints.
pub fn build_pipeline(
    config: &WorkerConfig,
    tenant: TenantId,
    settings: &TenantSettingsWire,
) -> Arc<SupportPipeline> {
    let (llm_model, embed_model, stt_language) = effective_ai_params(config, settings);
    let index = QdrantIndex::new(&config.qdrant_url);
    let llm: Arc<dyn nordsvar_ai_core::ports::Llm> = match &settings.llm_base_url {
        Some(base_url) => Arc::new(crate::adapters::OpenAiCompatLlm::new(
            base_url,
            &llm_model,
            settings.llm_api_key.clone(),
        )),
        None => Arc::new(OllamaLlm::new(&config.llm_url, &llm_model)),
    };
    Arc::new(
        SupportPipeline::new(
            tenant,
            Arc::new(WhisperHttpStt::new(&config.stt_url, &stt_language)),
            Arc::new(RetrieverOverIndex::new(
                OllamaEmbedder::new(&config.embed_url, &embed_model),
                index,
            )),
            llm,
            Arc::new(PiperHttpTts::new(&config.tts_url)),
        )
        .with_min_score(nordsvar_ai_core::pipeline::min_score_from_env()),
    )
}

/// How often the worker refreshes its claim on a running session. The API
/// treats a claim as dead after store::CLAIM_STALE_AFTER_SECS (3x this)
/// without a heartbeat, letting a surviving worker reclaim the session.
const HEARTBEAT_INTERVAL: std::time::Duration = std::time::Duration::from_secs(30);

/// Refresh the session claim until the session task ends. If the API says
/// the claim is no longer ours (session ended, or reclaimed while we were
/// silent), stop heartbeating - the session task unwinds itself when the
/// room closes.
fn spawn_heartbeat(
    config: &WorkerConfig,
    client: &reqwest::Client,
    session_id: String,
    session_task: tokio::task::JoinHandle<()>,
) {
    let url = format!(
        "{}/v1/internal/sessions/{}/heartbeat",
        config.api_url, session_id
    );
    let token = config.internal_token.clone();
    let worker_id = config.worker_id.clone();
    let client = client.clone();
    tokio::spawn(async move {
        loop {
            tokio::time::sleep(HEARTBEAT_INTERVAL).await;
            if session_task.is_finished() {
                break;
            }
            match client
                .post(&url)
                .header("x-internal-token", &token)
                .header("x-worker-id", &worker_id)
                .send()
                .await
            {
                Ok(r) if r.status().is_success() => match r.json::<serde_json::Value>().await {
                    Ok(v) if v.get("alive").and_then(|a| a.as_bool()) == Some(true) => {}
                    _ => {
                        tracing::warn!(
                            "heartbeat rejected: claim no longer ours, stopping heartbeats"
                        );
                        break;
                    }
                },
                Ok(r) => {
                    tracing::warn!(status = %r.status(), "heartbeat failed, retrying next tick")
                }
                Err(e) => {
                    tracing::warn!(error = %e, "heartbeat request failed, retrying next tick")
                }
            }
        }
    });
}

/// One poll+claim cycle. Returns the number of sessions claimed this cycle.
/// The media gateway for each session comes from `gateway_factory` - the
/// LiveKit adapter in production, the scripted gateway in tests.
///
/// Consecutive session-task failures, so a session whose room can never be
/// joined (dead room, stale database row) is not reclaimed in a hot loop.
/// Each failure doubles the skip window (capped); after MAX_SESSION_FAILURES
/// consecutive failures the session is skipped for the worker's lifetime -
/// an operator ends it from the admin side. A finished session clears its
/// record.
#[derive(Default)]
pub struct SessionFailures {
    counts: std::collections::HashMap<String, u32>,
    skip_until: std::collections::HashMap<String, std::time::Instant>,
}

/// Consecutive failures after which a session is never reclaimed by this
/// worker process again.
const MAX_SESSION_FAILURES: u32 = 3;

/// Cap for the per-session skip window.
const MAX_SKIP: std::time::Duration = std::time::Duration::from_secs(300);

impl SessionFailures {
    fn record_failure(&mut self, session_id: &str, poll_interval: std::time::Duration) {
        let count = self.counts.get(session_id).copied().unwrap_or(0) + 1;
        self.counts.insert(session_id.to_string(), count);
        let window = if count >= MAX_SESSION_FAILURES {
            // Effectively forever for this process: one year.
            std::time::Duration::from_secs(365 * 24 * 3600)
        } else {
            poll_interval
                .saturating_mul(1u32 << count.min(8))
                .min(MAX_SKIP)
        };
        self.skip_until
            .insert(session_id.to_string(), std::time::Instant::now() + window);
        tracing::warn!(
            session_id,
            failures = count,
            "session task failed; backing off reclaim"
        );
    }

    fn record_success(&mut self, session_id: &str) {
        self.counts.remove(session_id);
        self.skip_until.remove(session_id);
    }

    fn is_skipped(&self, session_id: &str) -> bool {
        match self.skip_until.get(session_id) {
            Some(until) => std::time::Instant::now() < *until,
            None => false,
        }
    }
}

pub async fn dispatch_once<F>(
    config: &WorkerConfig,
    client: &reqwest::Client,
    gateway_factory: F,
    failures: &std::sync::Arc<std::sync::Mutex<SessionFailures>>,
) -> Result<usize, String>
where
    F: Fn() -> Arc<dyn MediaGateway>,
{
    let unclaimed: Vec<UnclaimedSession> = client
        .get(format!("{}/v1/internal/sessions/unclaimed", config.api_url))
        .header("x-internal-token", &config.internal_token)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    tracing::debug!(unclaimed = unclaimed.len(), "poll returned");
    let mut claimed = 0;
    for session in unclaimed {
        if failures.lock().unwrap().is_skipped(&session.id) {
            tracing::debug!(session_id = %session.id, "skipping session in failure backoff");
            continue;
        }
        let claim: ClaimResponse = match client
            .post(format!(
                "{}/v1/internal/sessions/{}/claim",
                config.api_url, session.id
            ))
            .header("x-internal-token", &config.internal_token)
            .header("x-worker-id", &config.worker_id)
            .send()
            .await
        {
            Ok(r) if r.status().is_success() => r.json().await.map_err(|e| e.to_string())?,
            _ => continue, // lost the claim race; another worker took it
        };
        let tenant = TenantId::parse(&claim.tenant).map_err(|_| "bad tenant in claim")?;
        let token = mint_worker_token(config, &claim.room, tenant);
        let descriptor = SessionDescriptor {
            room: claim.room,
            join_token: token,
            livekit_url: config.livekit_url.clone(),
            tenant,
        };
        let pipeline = build_pipeline(config, tenant, &claim.settings);
        let gateway = gateway_factory();
        let footprints: Arc<dyn runtime::FootprintReporter> = Arc::new(HttpFootprintReporter {
            client: client.clone(),
            api_url: config.api_url.clone(),
            internal_token: config.internal_token.clone(),
            worker_id: config.worker_id.clone(),
            session_id: session.id.clone(),
        });
        let failures_for_task = failures.clone();
        let session_id_for_task = session.id.clone();
        let poll_interval = config.poll_interval;
        let session_task = tokio::spawn(async move {
            match runtime::run_session(gateway, pipeline, &descriptor, Some(footprints)).await {
                Ok(outcome) => {
                    tracing::info!(
                        room = %outcome.room,
                        utterances = outcome.utterances_handled,
                        answers = outcome.answers_spoken,
                        pipeline_failures = outcome.pipeline_failures,
                        "session finished"
                    );
                    failures_for_task
                        .lock()
                        .unwrap()
                        .record_success(&session_id_for_task);
                }
                Err(e) => {
                    tracing::error!(error = %e, "session failed");
                    failures_for_task
                        .lock()
                        .unwrap()
                        .record_failure(&session_id_for_task, poll_interval);
                }
            }
        });
        spawn_heartbeat(config, client, session.id.clone(), session_task);
        claimed += 1;
    }
    Ok(claimed)
}

/// Posts one query footprint per processed utterance to the API, which
/// writes it into the tenant's audit log. Reporting is best-effort: a
/// failed POST is logged and dropped, never fatal to the session.
struct HttpFootprintReporter {
    client: reqwest::Client,
    api_url: String,
    internal_token: String,
    worker_id: String,
    session_id: String,
}

#[async_trait::async_trait]
impl runtime::FootprintReporter for HttpFootprintReporter {
    async fn report(&self, question: &str, citations: &[String], answered: bool) {
        let result = self
            .client
            .post(format!(
                "{}/v1/internal/sessions/{}/footprint",
                self.api_url, self.session_id
            ))
            .header("x-internal-token", &self.internal_token)
            .header("x-worker-id", &self.worker_id)
            .json(&serde_json::json!({
                "question": question,
                "citations": citations,
                "answered": answered,
            }))
            .send()
            .await;
        match result {
            Ok(r) if r.status().is_success() => {}
            Ok(r) => tracing::warn!(status = %r.status(), "footprint report rejected"),
            Err(e) => tracing::warn!(error = %e, "footprint report failed"),
        }
    }
}

/// Mint the AI participant's own LiveKit token. The worker holds the same
/// LiveKit keys as the API (both are inside the boundary); the AI joins as
/// a clearly labelled participant in the session room.
fn mint_worker_token(config: &WorkerConfig, room: &str, tenant: TenantId) -> String {
    // Local HS256 minting keeps a round-trip out of the hot path. The token
    // shape mirrors services/api's livekit_token module.
    #[derive(serde::Serialize)]
    struct Grant {
        #[serde(rename = "roomJoin")]
        room_join: bool,
        room: String,
        #[serde(rename = "canPublish")]
        can_publish: bool,
        #[serde(rename = "canSubscribe")]
        can_subscribe: bool,
    }
    #[derive(serde::Serialize)]
    struct Claims {
        iss: String,
        sub: String,
        nbf: u64,
        exp: u64,
        metadata: String,
        video: Grant,
    }
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let claims = Claims {
        iss: config.livekit_api_key.clone(),
        sub: "nordsvar-ai".into(),
        nbf: now,
        exp: now + 3600,
        metadata: serde_json::json!({ "tenant_id": tenant }).to_string(),
        video: Grant {
            room_join: true,
            room: room.to_string(),
            can_publish: true,
            can_subscribe: true,
        },
    };
    jsonwebtoken::encode(
        &jsonwebtoken::Header::new(jsonwebtoken::Algorithm::HS256),
        &claims,
        &jsonwebtoken::EncodingKey::from_secret(config.livekit_api_secret.as_bytes()),
    )
    .expect("HS256 signing cannot fail")
}

/// Run the dispatch loop forever.
pub async fn run<F>(config: WorkerConfig, gateway_factory: F) -> !
where
    F: Fn() -> Arc<dyn MediaGateway>,
{
    // A bounded timeout: a hung poll must surface as a warn and retry,
    // never silently stall the dispatch loop forever.
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .unwrap_or_else(|_| reqwest::Client::new());
    let mut consecutive_errors: u32 = 0;
    let failures = std::sync::Arc::new(std::sync::Mutex::new(SessionFailures::default()));
    loop {
        match dispatch_once(&config, &client, &gateway_factory, &failures).await {
            Ok(0) => consecutive_errors = 0,
            Ok(n) => {
                consecutive_errors = 0;
                tracing::info!(claimed = n, "claimed sessions");
            }
            Err(e) => {
                consecutive_errors = consecutive_errors.saturating_add(1);
                tracing::warn!(
                    error = %e,
                    consecutive_errors,
                    "dispatch poll failed"
                );
            }
        }
        tokio::time::sleep(backoff_delay(config.poll_interval, consecutive_errors)).await;
    }
}

/// Exponential backoff on consecutive poll failures: 1x, 2x, 4x ... of
/// the poll interval, capped at 60 s. Success resets to the base
/// interval, so a recovered API returns to full responsiveness on the
/// next tick.
fn backoff_delay(base: Duration, consecutive_errors: u32) -> Duration {
    if consecutive_errors == 0 {
        return base;
    }
    let factor = 1u64 << consecutive_errors.min(5);
    base.saturating_mul(factor as u32)
        .min(Duration::from_secs(60))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn worker_token_carries_room_and_tenant_metadata() {
        let config = WorkerConfig {
            api_url: String::new(),
            internal_token: String::new(),
            livekit_url: String::new(),
            livekit_api_key: "k".into(),
            livekit_api_secret: "s".into(),
            stt_url: String::new(),
            llm_url: String::new(),
            llm_model: String::new(),
            tts_url: String::new(),
            embed_url: String::new(),
            embed_model: String::new(),
            qdrant_url: String::new(),
            stt_language: "da".into(),
            poll_interval: Duration::from_secs(1),
            worker_id: "test-worker".into(),
        };
        let tenant = TenantId::new();
        let token = mint_worker_token(&config, "room-9", tenant);
        let data = jsonwebtoken::decode::<serde_json::Value>(
            &token,
            &jsonwebtoken::DecodingKey::from_secret(b"s"),
            &jsonwebtoken::Validation::new(jsonwebtoken::Algorithm::HS256),
        )
        .unwrap();
        assert_eq!(data.claims["sub"], "nordsvar-ai");
        assert_eq!(data.claims["video"]["room"], "room-9");
        let meta: serde_json::Value =
            serde_json::from_str(data.claims["metadata"].as_str().unwrap()).unwrap();
        assert_eq!(meta["tenant_id"], tenant.to_string());
    }

    #[test]
    fn session_failure_backoff_skips_then_expires() {
        let mut f = SessionFailures::default();
        let poll = Duration::from_millis(10);
        assert!(!f.is_skipped("s1"));
        f.record_failure("s1", poll);
        assert!(f.is_skipped("s1"));
        f.record_success("s1");
        assert!(!f.is_skipped("s1"));
    }

    #[test]
    fn session_permanently_skipped_after_max_failures() {
        let mut f = SessionFailures::default();
        let poll = Duration::from_millis(1);
        for _ in 0..MAX_SESSION_FAILURES {
            f.record_failure("dead", poll);
        }
        // Window is a year: still skipped even if we pretend time passed a lot.
        assert!(f.is_skipped("dead"));
        // Other sessions are unaffected.
        assert!(!f.is_skipped("other"));
    }

    #[test]
    fn config_defaults_to_danish_stt() {
        let config = WorkerConfig::from_env();
        assert_eq!(config.stt_language, "da");
    }

    #[test]
    fn tenant_settings_override_env_defaults() {
        let config = WorkerConfig {
            api_url: String::new(),
            internal_token: String::new(),
            livekit_url: String::new(),
            livekit_api_key: "k".into(),
            livekit_api_secret: "s".into(),
            stt_url: String::new(),
            llm_url: String::new(),
            llm_model: "env-llm".into(),
            tts_url: String::new(),
            embed_url: String::new(),
            embed_model: "env-embed".into(),
            qdrant_url: String::new(),
            stt_language: "da".into(),
            poll_interval: Duration::from_secs(1),
            worker_id: "test-worker".into(),
        };
        let defaults = TenantSettingsWire::default();
        let (llm, embed, lang) = effective_ai_params(&config, &defaults);
        assert_eq!(
            (llm.as_str(), embed.as_str(), lang.as_str()),
            ("env-llm", "env-embed", "da")
        );
        let overrides = TenantSettingsWire {
            llm_model: Some("llama3.1:8b".into()),
            embed_model: None,
            stt_language: Some("en".into()),
            llm_base_url: None,
            llm_api_key: None,
        };
        let (llm, embed, lang) = effective_ai_params(&config, &overrides);
        assert_eq!(
            (llm.as_str(), embed.as_str(), lang.as_str()),
            ("llama3.1:8b", "env-embed", "en")
        );
    }

    #[test]
    fn backoff_grows_and_caps() {
        let base = Duration::from_secs(2);
        assert_eq!(backoff_delay(base, 0), base);
        assert_eq!(backoff_delay(base, 1), Duration::from_secs(4));
        assert_eq!(backoff_delay(base, 3), Duration::from_secs(16));
        assert_eq!(backoff_delay(base, 6), Duration::from_secs(60)); // capped
        assert_eq!(backoff_delay(base, 100), Duration::from_secs(60));
    }
}
