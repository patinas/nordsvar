//! Internal worker-dispatch routes. Guarded by a shared secret
//! (X-Internal-Token), never by tenant auth. The worker uses these to find
//! and claim sessions that need an AI participant. Not for browsers.

use crate::app::AppState;
use crate::error::ApiError;
use crate::store::{Session, SessionId};
use axum::extract::{Path, State};
use axum::http::HeaderMap;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/internal/sessions/unclaimed", get(list_unclaimed))
        .route("/internal/sessions/{id}/claim", post(claim_session))
        .route("/internal/sessions/{id}/heartbeat", post(heartbeat_session))
        .route("/internal/sessions/{id}/footprint", post(record_footprint))
}

/// Default worker identity when the caller does not send X-Worker-Id.
const DEFAULT_WORKER_ID: &str = "nordsvar-ai-worker";

/// Claim ownership is per worker instance. Workers identify themselves
/// with the X-Worker-Id header so a crashed instance's stale claims can
/// be reclaimed by a survivor without fencing live ones. Missing header
/// keeps the legacy single-worker identity. Shape is constrained so the
/// id stays log- and SQL-safe.
fn worker_id(headers: &HeaderMap) -> Result<String, ApiError> {
    let id = headers
        .get("x-worker-id")
        .and_then(|v| v.to_str().ok())
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or(DEFAULT_WORKER_ID);
    if id.len() > 64
        || !id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.'))
    {
        return Err(ApiError::BadRequest("invalid x-worker-id".into()));
    }
    Ok(id.to_string())
}

/// Shared-secret check. The internal token comes from INTERNAL_TOKEN env;
/// when unset, internal routes are disabled entirely (fail closed).
fn require_internal_token(state: &AppState, headers: &HeaderMap) -> Result<(), ApiError> {
    let Some(expected) = state.config.internal_token.as_deref() else {
        return Err(ApiError::NotFound("internal routes disabled"));
    };
    let presented = headers
        .get("x-internal-token")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    if presented != expected {
        return Err(ApiError::Unauthorized);
    }
    Ok(())
}

#[derive(Serialize)]
pub struct UnclaimedSession {
    pub id: String,
    pub tenant: String,
    pub room: String,
    pub created_at_unix: u64,
}

impl From<Session> for UnclaimedSession {
    fn from(s: Session) -> Self {
        Self {
            id: s.id.to_string(),
            tenant: s.tenant.to_string(),
            room: s.room,
            created_at_unix: s.created_at_unix,
        }
    }
}

pub async fn list_unclaimed(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<UnclaimedSession>>, ApiError> {
    require_internal_token(&state, &headers)?;
    let sessions = state.sessions.list_unclaimed().await?;
    Ok(Json(sessions.into_iter().map(Into::into).collect()))
}

#[derive(Serialize)]
pub struct ClaimResponse {
    pub id: String,
    pub tenant: String,
    pub room: String,
    /// Operator-managed AI overrides for this tenant, resolved for the
    /// worker - including the DECRYPTED provider key. This route is
    /// internal-token-guarded and stays inside the deployment boundary;
    /// the tenant-facing routes never expose the plaintext key.
    pub settings: ClaimSettings,
}

#[derive(Serialize)]
pub struct ClaimSettings {
    pub llm_model: Option<String>,
    pub embed_model: Option<String>,
    pub stt_language: Option<String>,
    pub llm_base_url: Option<String>,
    pub llm_api_key: Option<String>,
}

pub async fn claim_session(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> Result<Json<ClaimResponse>, ApiError> {
    require_internal_token(&state, &headers)?;
    let session_id =
        SessionId::parse(&id).map_err(|_| ApiError::BadRequest("invalid session id".into()))?;
    let worker = worker_id(&headers)?;
    let claimed = state
        .sessions
        .claim(session_id, &worker)
        .await?
        .ok_or(ApiError::Conflict(
            "session already claimed or not active".into(),
        ))?;
    let settings = state.settings.get_settings(claimed.tenant).await?;
    // Decrypt the provider key for the worker. Fail the claim (500)
    // rather than silently run keyless against a keyed endpoint.
    let llm_api_key = match settings.llm_api_key_enc {
        Some(enc) => {
            let key = state.config.settings_key.as_ref().ok_or_else(|| {
                ApiError::Store(crate::store::StoreError::new("SETTINGS_KEY missing"))
            })?;
            Some(
                crate::crypto::decrypt(key, &enc)
                    .map_err(|e| ApiError::Store(crate::store::StoreError::new(e)))?,
            )
        }
        None => None,
    };
    Ok(Json(ClaimResponse {
        id: claimed.id.to_string(),
        tenant: claimed.tenant.to_string(),
        room: claimed.room,
        settings: ClaimSettings {
            llm_model: settings.llm_model,
            embed_model: settings.embed_model,
            stt_language: settings.stt_language,
            llm_base_url: settings.llm_base_url,
            llm_api_key,
        },
    }))
}

#[derive(Serialize)]
pub struct HeartbeatResponse {
    /// True while the worker's claim is live and the session is active.
    /// False tells the worker the session is no longer its own (ended,
    /// or reclaimed after this worker went silent), so it should wind
    /// down its side instead of trusting the room.
    pub alive: bool,
}

pub async fn heartbeat_session(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> Result<Json<HeartbeatResponse>, ApiError> {
    require_internal_token(&state, &headers)?;
    let session_id =
        SessionId::parse(&id).map_err(|_| ApiError::BadRequest("invalid session id".into()))?;
    let worker = worker_id(&headers)?;
    let alive = state.sessions.heartbeat(session_id, &worker).await?;
    Ok(Json(HeartbeatResponse { alive }))
}

/// Per-utterance query footprint reported by the worker after each
/// pipeline run. Fields are capped defensively: an audit write must
/// never fail (or blow up) because a transcription ran long.
#[derive(Deserialize)]
pub struct FootprintRequest {
    /// The caller's transcribed question. Truncated to 500 chars.
    pub question: String,
    /// KB sources the answer drew on (capped at 20 x 200 chars).
    pub citations: Vec<String>,
    /// Whether an answer was actually spoken (false on pipeline failure).
    pub answered: bool,
}

fn truncate_chars(value: &str, max: usize) -> String {
    value.chars().take(max).collect()
}

/// Record a query footprint into the session tenant's audit log
/// (PRD: the compliance logger tracks query footprints). Internal-token
/// guarded; the tenant is resolved from the session row, never from the
/// caller, so a worker cannot write into another tenant's log.
pub async fn record_footprint(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
    Json(req): Json<FootprintRequest>,
) -> Result<axum::http::StatusCode, ApiError> {
    require_internal_token(&state, &headers)?;
    let session_id =
        SessionId::parse(&id).map_err(|_| ApiError::BadRequest("invalid session id".into()))?;
    let worker = worker_id(&headers)?;
    let session = state
        .sessions
        .get_by_id(session_id)
        .await?
        .ok_or(ApiError::NotFound("unknown session"))?;
    let citations: Vec<String> = req
        .citations
        .iter()
        .take(20)
        .map(|c| truncate_chars(c, 200))
        .collect();
    state
        .audit
        .record(nordsvar_tenancy::TenantScoped::new(
            session.tenant,
            crate::audit::AuditEvent::new(
                session.tenant,
                &format!("worker:{worker}"),
                "session.query",
                &session_id.to_string(),
                serde_json::json!({
                    "question": truncate_chars(&req.question, 500),
                    "citations": citations,
                    "answered": req.answered,
                }),
            ),
        ))
        .await?;
    Ok(axum::http::StatusCode::CREATED)
}
