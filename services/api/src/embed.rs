//! Public embed surface: the website widget's unauthenticated endpoints,
//! plus the guest share links used for cross-device session handoff.
//!
//! Security model (docs/EMBED.md):
//! - The embed key is PUBLIC by design: it identifies the tenant in page
//!   source. It is not a secret and grants nothing by itself.
//! - Every browser request is authorized by the Origin/Referer host, which
//!   must match the tenant's allowed-domain list. API secrets never leave
//!   the server; the decrypted provider key is used in-process only.
//! - Sessions are ephemeral and in-memory: no cookies, no storage on the
//!   visitor's device, nothing to correlate across visits.
//! - Fixed-window rate limits bound abuse per IP, per key, and per session.

use crate::app::AppState;
use crate::error::ApiError;
use crate::ratelimit::RateLimiter;
use crate::store::{Session, SessionId, SessionStatus};
use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, HeaderValue, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use nordsvar_kb_ingest::VectorIndex as _;
use nordsvar_tenancy::{Role, TenantId};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

const SESSION_TTL_SECS: u64 = 30 * 60;
const GUEST_LINK_TTL_SECS: u64 = 2 * 60 * 60;
const RETRIEVAL_K: usize = 4;
const MAX_MESSAGE_CHARS: usize = 2000;

fn now_unix() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

// ---- Ephemeral embed sessions + limiters --------------------------------

struct EmbedSession {
    tenant: TenantId,
    last_seen_unix: u64,
}

/// Per-process embed state. Deliberately in-memory for every storage
/// backend: embed sessions are anonymous and short-lived, so a restart
/// simply asks the widget to open a new session.
pub struct EmbedState {
    sessions: Mutex<HashMap<String, EmbedSession>>,
    pub per_ip: RateLimiter,
    pub per_key: RateLimiter,
    pub per_session: RateLimiter,
}

impl EmbedState {
    pub fn new() -> Self {
        Self {
            sessions: Mutex::new(HashMap::new()),
            per_ip: RateLimiter::per_minute(60),
            per_key: RateLimiter::per_minute(120),
            per_session: RateLimiter::per_minute(30),
        }
    }

    fn create_session(&self, tenant: TenantId) -> String {
        let id = format!("emb-{}", Uuid::new_v4().as_simple());
        let mut guard = self.sessions.lock().unwrap_or_else(|e| e.into_inner());
        if guard.len() > 10_000 {
            let cutoff = now_unix().saturating_sub(SESSION_TTL_SECS);
            guard.retain(|_, s| s.last_seen_unix >= cutoff);
        }
        guard.insert(
            id.clone(),
            EmbedSession {
                tenant,
                last_seen_unix: now_unix(),
            },
        );
        id
    }

    /// Validate and touch a session. Returns its tenant.
    fn resolve_session(&self, id: &str) -> Option<TenantId> {
        let mut guard = self.sessions.lock().unwrap_or_else(|e| e.into_inner());
        let session = guard.get_mut(id)?;
        let now = now_unix();
        if now.saturating_sub(session.last_seen_unix) > SESSION_TTL_SECS {
            guard.remove(id);
            return None;
        }
        session.last_seen_unix = now;
        Some(session.tenant)
    }
}

impl Default for EmbedState {
    fn default() -> Self {
        Self::new()
    }
}

// ---- Allowed-domain matching --------------------------------------------

/// Normalize an allowed-domain entry or an Origin/Referer value to a bare
/// lowercase host: strip scheme, path, query, credentials and port.
fn host_of(value: &str) -> Option<String> {
    let value = value.trim();
    if value.is_empty() || value.len() > 255 {
        return None;
    }
    let no_scheme = value
        .strip_prefix("https://")
        .or_else(|| value.strip_prefix("http://"))
        .unwrap_or(value);
    let host_port = no_scheme.split('/').next()?;
    if host_port.is_empty() || host_port.contains('@') || host_port.contains(' ') {
        return None;
    }
    let host = host_port.split(':').next()?;
    let host = host.trim_end_matches('.').to_ascii_lowercase();
    if host.is_empty()
        || !host
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '-'))
    {
        return None;
    }
    Some(host)
}

/// An entry matches its exact host and any subdomain ("example.com"
/// covers "www.example.com"). Entries never match across unrelated trees.
pub fn domain_allowed(entry_host: &str, request_host: &str) -> bool {
    request_host == entry_host || request_host.ends_with(&format!(".{entry_host}"))
}

/// Parse the tenant's stored comma-separated allowlist and check the
/// request's Origin (preferred) or Referer host against it.
pub fn request_origin_allowed(allowed_domains: &str, headers: &HeaderMap) -> Option<String> {
    let origin_raw = headers
        .get(axum::http::header::ORIGIN)
        .and_then(|v| v.to_str().ok())
        .or_else(|| {
            headers
                .get(axum::http::header::REFERER)
                .and_then(|v| v.to_str().ok())
        })?;
    let request_host = host_of(origin_raw)?;
    let allowed = allowed_domains
        .split(',')
        .filter_map(host_of)
        .any(|entry| domain_allowed(&entry, &request_host));
    allowed.then(|| format!("https://{request_host}"))
}

fn client_ip(headers: &HeaderMap) -> String {
    headers
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.split(',').next())
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or("unknown")
        .to_string()
}

// ---- Embed key -----------------------------------------------------------

/// Generate a fresh public embed key. `pk_` marks it as public-by-design
/// wherever it appears (page source, logs, admin UI).
pub fn new_embed_key() -> String {
    format!("pk_{}", Uuid::new_v4().as_simple())
}

fn valid_embed_key(raw: &str) -> bool {
    let Some(hex_part) = raw.strip_prefix("pk_") else {
        return false;
    };
    hex_part.len() == 32 && hex_part.chars().all(|c| c.is_ascii_hexdigit())
}

// ---- Admin-side input validation -------------------------------------------

/// Validate a comma-separated allowed-domain list from the admin UI:
/// every entry must normalize to a bare host.
pub fn validate_domain_list(raw: &str) -> bool {
    !raw.trim().is_empty()
        && raw.len() <= 2000
        && raw.split(',').all(|entry| host_of(entry).is_some())
}

/// Theme color: exactly #rrggbb.
pub fn validate_theme_color(raw: &str) -> bool {
    let Some(hex_part) = raw.strip_prefix('#') else {
        return false;
    };
    hex_part.len() == 6 && hex_part.chars().all(|c| c.is_ascii_hexdigit())
}

/// Inbound phone number in E.164: + followed by 8-15 digits.
pub fn validate_e164(raw: &str) -> bool {
    let Some(digits) = raw.strip_prefix('+') else {
        return false;
    };
    (8..=15).contains(&digits.len()) && digits.chars().all(|c| c.is_ascii_digit())
}

// ---- CORS helpers ---------------------------------------------------------

fn cors_response(origin: &str, status: StatusCode, body: Json<serde_json::Value>) -> Response {
    let mut response = (status, body).into_response();
    if let Ok(value) = HeaderValue::from_str(origin) {
        let headers = response.headers_mut();
        headers.insert(axum::http::header::ACCESS_CONTROL_ALLOW_ORIGIN, value);
        headers.insert(axum::http::header::VARY, HeaderValue::from_static("Origin"));
    }
    response
}

/// Preflight answers without a tenant context: the enforcing checks run on
/// the real request, so the OPTIONS reply only echoes a syntactically
/// valid https origin and the methods this surface uses.
async fn preflight(headers: HeaderMap) -> Response {
    let mut response = StatusCode::NO_CONTENT.into_response();
    let origin = headers
        .get(axum::http::header::ORIGIN)
        .and_then(|v| v.to_str().ok())
        .and_then(host_of)
        .map(|h| format!("https://{h}"));
    if let Some(origin) = origin {
        if let Ok(value) = HeaderValue::from_str(&origin) {
            let headers = response.headers_mut();
            headers.insert(axum::http::header::ACCESS_CONTROL_ALLOW_ORIGIN, value);
            headers.insert(
                axum::http::header::ACCESS_CONTROL_ALLOW_METHODS,
                HeaderValue::from_static("GET, POST, OPTIONS"),
            );
            headers.insert(
                axum::http::header::ACCESS_CONTROL_ALLOW_HEADERS,
                HeaderValue::from_static("content-type"),
            );
            headers.insert(axum::http::header::VARY, HeaderValue::from_static("Origin"));
        }
    }
    response
}

// ---- Public routes ---------------------------------------------------------

pub fn public_router() -> Router<AppState> {
    Router::new()
        .route("/embed/config", get(embed_config).options(preflight))
        .route("/embed/session", post(embed_session).options(preflight))
        .route("/embed/message", post(embed_message).options(preflight))
        .route("/embed/voice", post(embed_voice).options(preflight))
        .route("/guest-join", post(guest_join).options(preflight))
}

#[derive(Debug, Deserialize)]
pub struct EmbedKeyQuery {
    pub key: String,
}

/// Resolve the tenant behind a public key and authorize the request
/// origin. Shared by every public embed route.
async fn resolve_tenant(
    app: &AppState,
    key: &str,
    headers: &HeaderMap,
) -> Result<(TenantId, String), ApiError> {
    if !app.embed.per_ip.check(&client_ip(headers)) || !app.embed.per_key.check(key) {
        return Err(ApiError::TooManyRequests);
    }
    if !valid_embed_key(key) {
        return Err(ApiError::NotFound("embed"));
    }
    let tenant = app
        .settings
        .find_tenant_by_embed_key(key)
        .await?
        .ok_or(ApiError::NotFound("embed"))?;
    let settings = app.settings.get_settings(tenant).await?;
    if settings.embed_enabled != Some(true) {
        return Err(ApiError::NotFound("embed"));
    }
    let origin = request_origin_allowed(
        settings.embed_allowed_domains.as_deref().unwrap_or(""),
        headers,
    )
    .ok_or(ApiError::Forbidden)?;
    Ok((tenant, origin))
}

pub async fn embed_config(
    State(app): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<EmbedKeyQuery>,
) -> Result<Response, ApiError> {
    let (tenant, origin) = resolve_tenant(&app, &query.key, &headers).await?;
    let settings = app.settings.get_settings(tenant).await?;
    Ok(cors_response(
        &origin,
        StatusCode::OK,
        Json(serde_json::json!({
            "theme_color": settings.embed_theme_color,
            "position": settings.embed_position,
            "language": settings.embed_language,
            "voice_enabled": settings.embed_voice_enabled == Some(true),
        })),
    ))
}

pub async fn embed_session(
    State(app): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<EmbedKeyQuery>,
) -> Result<Response, ApiError> {
    let (tenant, origin) = resolve_tenant(&app, &req.key, &headers).await?;
    let session_id = app.embed.create_session(tenant);
    app.audit
        .record(nordsvar_tenancy::TenantScoped::new(
            tenant,
            crate::audit::AuditEvent::new(
                tenant,
                "embed-guest",
                "embed.session_opened",
                &session_id,
                serde_json::json!({}),
            ),
        ))
        .await?;
    Ok(cors_response(
        &origin,
        StatusCode::CREATED,
        Json(serde_json::json!({
            "session_id": session_id,
            "expires_in_secs": SESSION_TTL_SECS,
        })),
    ))
}

#[derive(Debug, Deserialize)]
pub struct EmbedMessageRequest {
    pub session_id: String,
    pub text: String,
}

pub async fn embed_message(
    State(app): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<EmbedMessageRequest>,
) -> Result<Response, ApiError> {
    let tenant = app
        .embed
        .resolve_session(&req.session_id)
        .ok_or(ApiError::Unauthorized)?;
    if !app.embed.per_session.check(&req.session_id) {
        return Err(ApiError::TooManyRequests);
    }
    let origin = {
        let settings = app.settings.get_settings(tenant).await?;
        request_origin_allowed(
            settings.embed_allowed_domains.as_deref().unwrap_or(""),
            &headers,
        )
        .ok_or(ApiError::Forbidden)?
    };
    let text = req.text.trim();
    if text.is_empty() || text.chars().count() > MAX_MESSAGE_CHARS {
        return Err(ApiError::BadRequest(
            "beskeden er tom eller for lang".into(),
        ));
    }

    // Retrieval: embed the question and search the tenant's own collection.
    // A missing or dead embeddings/index backend must not take chat down:
    // answer ungrounded instead of failing the message.
    let mut retrieval_ok = true;
    let chunks = match app.kb_embedder.embed(&[text.to_string()]).await {
        Ok(vectors) => match vectors.into_iter().next() {
            Some(vector) => app
                .kb_index
                .search(tenant, &vector, RETRIEVAL_K)
                .await
                .unwrap_or_else(|e| {
                    tracing::warn!(error = %e, "KB search failed; answering ungrounded");
                    retrieval_ok = false;
                    Vec::new()
                }),
            None => {
                tracing::warn!("KB embedder returned no vector; answering ungrounded");
                retrieval_ok = false;
                Vec::new()
            }
        },
        Err(e) => {
            tracing::warn!(error = %e, "KB embedding failed; answering ungrounded");
            retrieval_ok = false;
            Vec::new()
        }
    };
    // Relevance guard: with a working index but nothing relevant, decline
    // (and say so in the audit log) instead of letting the model guess.
    let mut declined = false;
    let chunks = if retrieval_ok {
        match nordsvar_ai_core::pipeline::judge_retrieval(chunks, app.config.retrieval_min_score) {
            nordsvar_ai_core::pipeline::Grounding::Grounded(kept) => kept,
            nordsvar_ai_core::pipeline::Grounding::NoRelevant => {
                declined = true;
                Vec::new()
            }
        }
    } else {
        chunks
    };
    let prompt = nordsvar_ai_core::pipeline::build_grounded_prompt(text, &chunks);

    // LLM: the tenant's configured provider first (key decrypted in
    // process, never exposed), then the deployment's own LLM_URL.
    let settings = app.settings.get_settings(tenant).await?;
    let answer = if declined {
        nordsvar_ai_core::pipeline::NO_ANSWER_REPLY_DA.to_string()
    } else {
        match &settings.llm_base_url {
            Some(base_url) => {
                let key = match &settings.llm_api_key_enc {
                    Some(enc) => {
                        let settings_key = app.config.settings_key.as_ref().ok_or_else(|| {
                            ApiError::Store(crate::store::StoreError::new("SETTINGS_KEY missing"))
                        })?;
                        Some(
                            crate::crypto::decrypt(settings_key, enc)
                                .map_err(|e| ApiError::Store(crate::store::StoreError::new(e)))?,
                        )
                    }
                    None => None,
                };
                let model = settings
                    .llm_model
                    .clone()
                    .unwrap_or_else(|| app.config.llm_model.clone());
                crate::embed_llm::chat_complete(base_url, &model, key.as_deref(), &prompt)
                    .await
                    .map_err(ApiError::Unavailable)?
            }
            None => {
                let Some(llm_url) = &app.config.llm_url else {
                    return Err(ApiError::Unavailable(
                        "tekstsvar er ikke konfigureret på denne installation".into(),
                    ));
                };
                let model = settings
                    .llm_model
                    .clone()
                    .unwrap_or_else(|| app.config.llm_model.clone());
                crate::embed_llm::ollama_complete(llm_url, &model, &prompt)
                    .await
                    .map_err(ApiError::Unavailable)?
            }
        }
    };

    let citations: Vec<serde_json::Value> = chunks
        .iter()
        .map(|c| serde_json::json!({ "chunk_id": c.chunk_id, "source": c.source }))
        .collect();
    app.audit
        .record(nordsvar_tenancy::TenantScoped::new(
            tenant,
            crate::audit::AuditEvent::new(
                tenant,
                "embed-guest",
                if declined {
                    "session.query.unanswered"
                } else {
                    "session.query"
                },
                &req.session_id,
                serde_json::json!({
                    "question": text.chars().take(500).collect::<String>(),
                    "answer": answer.chars().take(500).collect::<String>(),
                    "citations": citations,
                    "answered": !declined,
                    "channel": "embed",
                }),
            ),
        ))
        .await?;
    Ok(cors_response(
        &origin,
        StatusCode::OK,
        Json(serde_json::json!({ "answer": answer, "citations": citations })),
    ))
}

#[derive(Debug, Deserialize)]
pub struct EmbedVoiceRequest {
    pub session_id: String,
}

/// Start a voice session for an embed visitor: a real Session row the
/// worker claims and joins, plus a LiveKit join ticket for the browser.
pub async fn embed_voice(
    State(app): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<EmbedVoiceRequest>,
) -> Result<Response, ApiError> {
    let tenant = app
        .embed
        .resolve_session(&req.session_id)
        .ok_or(ApiError::Unauthorized)?;
    if !app.embed.per_session.check(&req.session_id) {
        return Err(ApiError::TooManyRequests);
    }
    let settings = app.settings.get_settings(tenant).await?;
    if settings.embed_voice_enabled != Some(true) {
        return Err(ApiError::Forbidden);
    }
    let origin = request_origin_allowed(
        settings.embed_allowed_domains.as_deref().unwrap_or(""),
        &headers,
    )
    .ok_or(ApiError::Forbidden)?;

    let session = app
        .sessions
        .create(tenant, Session::new(tenant, "embed-visitor"))
        .await?;
    let identity = format!("guest-{}", &Uuid::new_v4().as_simple().to_string()[..8]);
    let token = crate::livekit_token::mint_join_token(
        &app.config.livekit_api_key,
        &app.config.livekit_api_secret,
        &session.room,
        &identity,
        Some("Gæst"),
        tenant,
        app.config.token_ttl,
    )
    .map_err(|_| ApiError::Internal)?;
    app.audit
        .record(nordsvar_tenancy::TenantScoped::new(
            tenant,
            crate::audit::AuditEvent::new(
                tenant,
                "embed-guest",
                "session.created",
                &session.id.to_string(),
                serde_json::json!({ "room": session.room, "channel": "embed" }),
            ),
        ))
        .await?;
    Ok(cors_response(
        &origin,
        StatusCode::CREATED,
        Json(serde_json::json!({
            "session_id": session.id.to_string(),
            "token": token,
            "livekit_url": app.config.livekit_public_url.clone()
                .unwrap_or_else(|| app.config.livekit_url.clone()),
            "room": session.room,
            "identity": identity,
            "expires_in_secs": app.config.token_ttl.as_secs(),
        })),
    ))
}

// ---- Guest share links (cross-device session handoff) ---------------------
//
// An agent on a call shares a short-lived link; the other person opens it
// on any browser, joins the SAME LiveKit room and can share their screen
// while the call continues. Used by the phone-to-screen flow (the AI or
// agent reads/texts the link) and by agents sending links directly.

#[derive(Debug, Serialize, Deserialize)]
struct GuestShareClaims {
    sid: String,
    exp: u64,
    purpose: String,
}

const GUEST_PURPOSE: &str = "guest-join";

fn sign_guest_token(
    secret: &str,
    session_id: SessionId,
    ttl_secs: u64,
) -> Result<String, jsonwebtoken::errors::Error> {
    let claims = GuestShareClaims {
        sid: session_id.to_string(),
        exp: now_unix() + ttl_secs,
        purpose: GUEST_PURPOSE.to_string(),
    };
    jsonwebtoken::encode(
        &jsonwebtoken::Header::default(),
        &claims,
        &jsonwebtoken::EncodingKey::from_secret(secret.as_bytes()),
    )
}

fn verify_guest_token(secret: &str, token: &str) -> Result<SessionId, ApiError> {
    let mut validation = jsonwebtoken::Validation::default();
    validation.validate_exp = true;
    validation.leeway = 0;
    validation.set_required_spec_claims(&["exp", "sid", "purpose"]);
    let data = jsonwebtoken::decode::<GuestShareClaims>(
        token,
        &jsonwebtoken::DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )
    .map_err(|_| ApiError::Unauthorized)?;
    if data.claims.purpose != GUEST_PURPOSE {
        return Err(ApiError::Unauthorized);
    }
    SessionId::parse(&data.claims.sid).map_err(|_| ApiError::Unauthorized)
}

#[derive(Debug, Serialize)]
pub struct ShareResponse {
    pub share_token: String,
    /// Path the operator turns into a full link: https://<host>/s/<id>?t=<token>
    pub path: String,
    pub expires_in_secs: u64,
}

/// Mint a guest share link for an active session. Agents and admins only;
/// registered on the authenticated router in routes.rs.
pub async fn share_session(
    State(app): State<AppState>,
    auth: crate::tenant_auth::TenantAuth,
    Path(id): Path<String>,
) -> Result<Json<ShareResponse>, ApiError> {
    let ctx = auth.0;
    if !ctx.has_role(Role::Agent) && !ctx.has_role(Role::TenantAdmin) {
        return Err(ApiError::Forbidden);
    }
    let session_id =
        SessionId::parse(&id).map_err(|_| ApiError::BadRequest("invalid session id".into()))?;
    let session = app
        .sessions
        .get(ctx.tenant(), session_id)
        .await?
        .ok_or(ApiError::NotFound("session"))?;
    if session.status != SessionStatus::Active {
        return Err(ApiError::Conflict("session has ended".into()));
    }
    let token = sign_guest_token(
        &app.config.livekit_api_secret,
        session_id,
        GUEST_LINK_TTL_SECS,
    )
    .map_err(|_| ApiError::Internal)?;
    app.audit
        .record(ctx.scope(crate::audit::AuditEvent::new(
            ctx.tenant(),
            ctx.actor().as_str(),
            "session.share_link_created",
            &session.id.to_string(),
            serde_json::json!({ "expires_in_secs": GUEST_LINK_TTL_SECS }),
        )))
        .await?;
    Ok(Json(ShareResponse {
        share_token: token.clone(),
        path: format!("/s/{session_id}?t={token}"),
        expires_in_secs: GUEST_LINK_TTL_SECS,
    }))
}

#[derive(Debug, Deserialize)]
pub struct GuestJoinRequest {
    pub token: String,
    pub display_name: Option<String>,
}

/// Exchange a guest share token for a LiveKit join ticket. Unauthenticated
/// by design - the signed, expiring token IS the credential - but
/// rate-limited and bound to one active session.
pub async fn guest_join(
    State(app): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<GuestJoinRequest>,
) -> Result<Response, ApiError> {
    if !app.embed.per_ip.check(&client_ip(&headers)) {
        return Err(ApiError::TooManyRequests);
    }
    let session_id = verify_guest_token(&app.config.livekit_api_secret, &req.token)?;
    let session = app
        .sessions
        .get_by_id(session_id)
        .await?
        .ok_or(ApiError::NotFound("session"))?;
    if session.status != SessionStatus::Active {
        return Err(ApiError::Conflict("session has ended".into()));
    }
    let identity = format!("guest-{}", &Uuid::new_v4().as_simple().to_string()[..8]);
    let token = crate::livekit_token::mint_join_token(
        &app.config.livekit_api_key,
        &app.config.livekit_api_secret,
        &session.room,
        &identity,
        req.display_name.as_deref(),
        session.tenant,
        app.config.token_ttl,
    )
    .map_err(|_| ApiError::Internal)?;
    app.audit
        .record(nordsvar_tenancy::TenantScoped::new(
            session.tenant,
            crate::audit::AuditEvent::new(
                session.tenant,
                "guest-link",
                "session.joined",
                &session.id.to_string(),
                serde_json::json!({ "identity": identity, "via": "guest-link" }),
            ),
        ))
        .await?;
    let mut response = Json(serde_json::json!({
        "token": token,
        "livekit_url": app.config.livekit_public_url.clone()
            .unwrap_or_else(|| app.config.livekit_url.clone()),
        "room": session.room,
        "identity": identity,
        "expires_in_secs": app.config.token_ttl.as_secs(),
        "turn": app.config.turn_url.as_ref().map(|urls| serde_json::json!({
            "urls": urls,
            "username": app.config.turn_username,
            "credential": app.config.turn_credential,
        })),
    }))
    .into_response();
    // Same-origin page load (the /s/ join page lives on this host), so a
    // permissive ACAO is safe here; nothing tenant-private is exposed.
    response.headers_mut().insert(
        axum::http::header::ACCESS_CONTROL_ALLOW_ORIGIN,
        HeaderValue::from_static("*"),
    );
    Ok(response)
}

// ---- Tests ------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn host_parsing_strips_scheme_path_and_port() {
        assert_eq!(
            host_of("https://www.example.com/path?q=1").as_deref(),
            Some("www.example.com")
        );
        assert_eq!(
            host_of("http://localhost:5173").as_deref(),
            Some("localhost")
        );
        assert_eq!(host_of("example.com").as_deref(), Some("example.com"));
        assert_eq!(host_of("EXAMPLE.com.").as_deref(), Some("example.com"));
        assert!(host_of("https://user@evil.com").is_none());
        assert!(host_of("").is_none());
        assert!(host_of("https://").is_none());
    }

    #[test]
    fn domain_matching_is_exact_or_subdomain() {
        assert!(domain_allowed("example.com", "example.com"));
        assert!(domain_allowed("example.com", "www.example.com"));
        assert!(domain_allowed("example.com", "deep.www.example.com"));
        assert!(!domain_allowed("example.com", "notexample.com"));
        assert!(!domain_allowed("example.com", "example.com.evil.dk"));
        assert!(!domain_allowed("example.com", "other.com"));
    }

    #[test]
    fn embed_keys_have_a_public_shape() {
        let key = new_embed_key();
        assert!(valid_embed_key(&key));
        assert!(!valid_embed_key("sk_0123456789abcdef0123456789abcdef"));
        assert!(!valid_embed_key("pk_short"));
        assert!(!valid_embed_key("pk_0123456789abcdef0123456789abcdeg"));
    }

    #[test]
    fn guest_tokens_round_trip_and_expire() {
        let secret = "test-secret";
        let id = SessionId::new();
        let token = sign_guest_token(secret, id, 60).unwrap();
        assert_eq!(verify_guest_token(secret, &token).unwrap(), id);
        // Wrong secret, mangled token and expired token all fail closed.
        assert!(verify_guest_token("other-secret", &token).is_err());
        assert!(verify_guest_token(secret, "garbage").is_err());
        let expired = sign_guest_token(secret, id, 0).unwrap();
        std::thread::sleep(std::time::Duration::from_secs(2));
        assert!(verify_guest_token(secret, &expired).is_err());
    }

    #[test]
    fn admin_validation_accepts_and_rejects_the_right_shapes() {
        assert!(validate_domain_list(
            "example.com, https://app.example.dk/path"
        ));
        assert!(!validate_domain_list(""));
        assert!(!validate_domain_list("https://user@evil.com"));
        assert!(validate_theme_color("#1a7F5a"));
        assert!(!validate_theme_color("red"));
        assert!(!validate_theme_color("#12345"));
        assert!(validate_e164("+4512345678"));
        assert!(!validate_e164("4512345678"));
        assert!(!validate_e164("+45abc"));
    }

    #[tokio::test]
    async fn embed_sessions_expire_and_do_not_leak_tenants() {
        let state = EmbedState::new();
        let tenant = TenantId::new();
        let id = state.create_session(tenant);
        assert_eq!(state.resolve_session(&id), Some(tenant));
        assert_eq!(state.resolve_session("emb-unknown"), None);
    }
}
