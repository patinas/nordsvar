//! HTTP routes. Handlers receive a [`TenantAuth`] extractor; every store
//! call is keyed by the context's tenant.

use crate::app::AppState;
use crate::error::ApiError;
use crate::livekit_token;
use crate::store::{Session, SessionId, SessionStatus};
use crate::tenant_auth::TenantAuth;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::routing::{get, post};
use axum::{Json, Router};
use nordsvar_kb_ingest::VectorIndex as _;
use nordsvar_tenancy::Role;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/sessions", post(create_session).get(list_sessions))
        .route("/sessions/{id}", get(get_session).delete(end_session))
        .route("/sessions/{id}/join", post(join_session))
        .route("/sessions/{id}/share", post(crate::embed::share_session))
        .route(
            "/kb/documents",
            post(upload_kb_document).get(list_kb_documents),
        )
        .route(
            "/kb/documents/{id}",
            axum::routing::delete(delete_kb_document),
        )
        .route("/audit", get(list_audit_events))
        // Local-auth first-run setup and login. These stay public by
        // design: setup is gated by "zero users exist", login issues the
        // bearer token everything else checks.
        .route("/setup/status", get(setup_status))
        .route("/setup/admin", post(setup_admin))
        .route("/auth/login", post(login))
        .route("/admin/users", post(create_local_user))
        .route("/settings", get(get_settings).put(put_settings))
        .route("/settings/llm/test", post(test_llm_connection))
        .route("/settings/embed/key", post(regenerate_embed_key))
}

/// Issue a fresh public embed key for the caller's tenant. The old key
/// stops working immediately; the admin UI makes that consequence explicit
/// before calling this.
pub async fn regenerate_embed_key(
    auth: TenantAuth,
    State(app): State<AppState>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let ctx = auth.0;
    if !ctx.roles().contains(&Role::TenantAdmin) {
        return Err(ApiError::Forbidden);
    }
    let mut settings = app.settings.get_settings(ctx.tenant()).await?;
    let key = crate::embed::new_embed_key();
    settings.embed_public_key = Some(key.clone());
    app.settings.put_settings(ctx.tenant(), &settings).await?;
    app.audit
        .record(ctx.scope(crate::audit::AuditEvent::new(
            ctx.tenant(),
            &ctx.actor().to_string(),
            "settings.embed_key_regenerated",
            "tenant_settings",
            serde_json::json!({}),
        )))
        .await?;
    Ok(Json(serde_json::json!({ "embed_public_key": key })))
}

// ---- Local auth: first-run setup and login (AUTH_MODE=local) -------------

#[derive(Debug, Serialize)]
pub struct SetupStatusResponse {
    pub needs_setup: bool,
    /// How the deployment authenticates: "dev", "oidc", or "local". The
    /// web app picks its sign-in flow from this.
    pub auth_mode: &'static str,
}

pub async fn setup_status(
    State(app): State<AppState>,
) -> Result<Json<SetupStatusResponse>, ApiError> {
    let needs_setup = match app.config.auth_mode {
        crate::config::AuthMode::Local => app.local_auth.count_users().await? == 0,
        _ => false,
    };
    let auth_mode = match app.config.auth_mode {
        crate::config::AuthMode::Dev => "dev",
        crate::config::AuthMode::Oidc => "oidc",
        crate::config::AuthMode::Local => "local",
    };
    Ok(Json(SetupStatusResponse {
        needs_setup,
        auth_mode,
    }))
}

#[derive(Debug, Deserialize)]
pub struct SetupAdminRequest {
    /// Optional tenant UUID; generated when absent (single-tenant
    /// self-hosters should not have to invent one).
    pub tenant_id: Option<String>,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LocalLoginResponse {
    pub tenant: String,
    pub username: String,
    pub roles: Vec<String>,
    pub token: String,
    pub expires_at_unix: u64,
}

fn validate_username(username: &str) -> Result<(), ApiError> {
    let ok = (1..=64).contains(&username.len())
        && username
            .chars()
            .all(|c| c.is_alphanumeric() || matches!(c, '.' | '-' | '_' | '@'));
    if ok {
        Ok(())
    } else {
        Err(ApiError::BadRequest(
            "brugernavn skal vaere 1-64 tegn: bogstaver, tal, . - _ @".into(),
        ))
    }
}

fn validate_password(password: &str) -> Result<(), ApiError> {
    if password.len() >= 12 {
        Ok(())
    } else {
        Err(ApiError::BadRequest(
            "adgangskode skal vaere mindst 12 tegn".into(),
        ))
    }
}

fn role_name(role: Role) -> String {
    match role {
        Role::EndUser => "end_user",
        Role::Agent => "agent",
        Role::TenantAdmin => "tenant_admin",
    }
    .to_string()
}

/// Issue a local session token for a validated user.
async fn issue_local_token(
    app: &AppState,
    user: &crate::local_auth::LocalUser,
) -> Result<LocalLoginResponse, ApiError> {
    let token = crate::local_auth::new_session_token();
    let expires_at_unix = crate::local_auth::now_unix() + crate::local_auth::SESSION_TTL_SECS;
    app.local_auth
        .create_session(
            &crate::local_auth::hash_token(&token),
            crate::local_auth::LocalSession {
                tenant: user.tenant,
                username: user.username.clone(),
                role: user.role,
                expires_at_unix,
            },
        )
        .await?;
    Ok(LocalLoginResponse {
        tenant: user.tenant.to_string(),
        username: user.username.clone(),
        roles: vec![role_name(user.role)],
        token,
        expires_at_unix,
    })
}

pub async fn setup_admin(
    State(app): State<AppState>,
    Json(req): Json<SetupAdminRequest>,
) -> Result<(StatusCode, Json<LocalLoginResponse>), ApiError> {
    if app.config.auth_mode != crate::config::AuthMode::Local {
        return Err(ApiError::NotFound("local auth is not enabled"));
    }
    validate_username(&req.username)?;
    validate_password(&req.password)?;
    let tenant = match req.tenant_id.as_deref() {
        Some(raw) => nordsvar_tenancy::TenantId::parse(raw)
            .map_err(|_| ApiError::BadRequest("ugyldigt tenant-id".into()))?,
        None => nordsvar_tenancy::TenantId::new(),
    };
    // Close the door before creating: if any user exists, setup is over.
    if app.local_auth.count_users().await? > 0 {
        return Err(ApiError::Conflict(
            "opsaetning er allerede gennemfoert".into(),
        ));
    }
    let user = crate::local_auth::LocalUser {
        tenant,
        username: req.username.clone(),
        password_hash: crate::local_auth::hash_password(&req.password)?,
        role: Role::TenantAdmin,
        created_at_unix: crate::local_auth::now_unix(),
    };
    app.local_auth
        .create_user(user.clone())
        .await
        .map_err(|e| {
            if e.to_string().contains("already exists") {
                ApiError::Conflict("opsaetning er allerede gennemfoert".into())
            } else {
                ApiError::Store(e)
            }
        })?;
    app.audit
        .record(nordsvar_tenancy::TenantScoped::new(
            tenant,
            crate::audit::AuditEvent::new(
                tenant,
                &req.username,
                "local_auth.setup_admin",
                &req.username,
                serde_json::json!({ "first_admin": true }),
            ),
        ))
        .await?;
    let response = issue_local_token(&app, &user).await?;
    Ok((StatusCode::CREATED, Json(response)))
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    /// Optional when exactly one tenant has local users (single-tenant
    /// self-hosters never handle a UUID).
    pub tenant_id: Option<String>,
    pub username: String,
    pub password: String,
}

pub async fn login(
    State(app): State<AppState>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<LocalLoginResponse>, ApiError> {
    if app.config.auth_mode != crate::config::AuthMode::Local {
        return Err(ApiError::NotFound("local auth is not enabled"));
    }
    let tenant = match req.tenant_id.as_deref() {
        Some(raw) => nordsvar_tenancy::TenantId::parse(raw).map_err(|_| ApiError::Unauthorized)?,
        None => match app.local_auth.tenants_with_users().await?.as_slice() {
            [only] => *only,
            [] => return Err(ApiError::Unauthorized),
            _ => {
                return Err(ApiError::BadRequest(
                    "tenant_id er paakraevet (flere tenants findes)".into(),
                ))
            }
        },
    };
    let user = app.local_auth.get_user(tenant, &req.username).await?;
    // Verify against a dummy hash when the user is unknown so the response
    // time does not reveal which usernames exist.
    let hash = user
        .as_ref()
        .map(|u| u.password_hash.clone())
        .unwrap_or_else(|| crate::local_auth::dummy_hash().to_string());
    if !crate::local_auth::verify_password(&req.password, &hash) || user.is_none() {
        return Err(ApiError::Unauthorized);
    }
    let user = user.expect("checked above");
    app.audit
        .record(nordsvar_tenancy::TenantScoped::new(
            tenant,
            crate::audit::AuditEvent::new(
                tenant,
                &req.username,
                "local_auth.login",
                &req.username,
                serde_json::json!({}),
            ),
        ))
        .await?;
    Ok(Json(issue_local_token(&app, &user).await?))
}

#[derive(Debug, Deserialize)]
pub struct CreateLocalUserRequest {
    pub username: String,
    pub password: String,
    /// "agent" or "end_user" or "tenant_admin".
    pub role: String,
}

pub async fn create_local_user(
    auth: TenantAuth,
    State(app): State<AppState>,
    Json(req): Json<CreateLocalUserRequest>,
) -> Result<StatusCode, ApiError> {
    if app.config.auth_mode != crate::config::AuthMode::Local {
        return Err(ApiError::NotFound("local auth is not enabled"));
    }
    let ctx = auth.0;
    if !ctx.roles().contains(&Role::TenantAdmin) {
        return Err(ApiError::Forbidden);
    }
    validate_username(&req.username)?;
    validate_password(&req.password)?;
    let role = match req.role.as_str() {
        "end_user" => Role::EndUser,
        "agent" => Role::Agent,
        "tenant_admin" => Role::TenantAdmin,
        _ => return Err(ApiError::BadRequest("ukendt rolle".into())),
    };
    let user = crate::local_auth::LocalUser {
        tenant: ctx.tenant(),
        username: req.username.clone(),
        password_hash: crate::local_auth::hash_password(&req.password)?,
        role,
        created_at_unix: crate::local_auth::now_unix(),
    };
    app.local_auth.create_user(user).await.map_err(|e| {
        if e.to_string().contains("already exists") {
            ApiError::Conflict("brugeren findes allerede".into())
        } else {
            ApiError::Store(e)
        }
    })?;
    app.audit
        .record(nordsvar_tenancy::TenantScoped::new(
            ctx.tenant(),
            crate::audit::AuditEvent::new(
                ctx.tenant(),
                &ctx.actor().to_string(),
                "local_auth.create_user",
                &req.username,
                serde_json::json!({ "role": req.role }),
            ),
        ))
        .await?;
    Ok(StatusCode::CREATED)
}

/// Model-name shape accepted for AI overrides: registry-style names like
/// "llama3.1:8b", "nomic-embed-text", or "mistralai/Mistral-7B". Kept
/// deliberately narrow - these strings end up in worker HTTP calls.
fn validate_model_name(value: &str) -> bool {
    (1..=128).contains(&value.len())
        && value
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | ':' | '/' | '_' | '+' | '-'))
}

/// Whisper language code: two lowercase letters ("da", "en", ...).
fn validate_stt_language(value: &str) -> bool {
    value.len() == 2 && value.chars().all(|c| c.is_ascii_lowercase())
}

#[derive(Serialize)]
pub struct SettingsResponse {
    /// Overrides only. None means the deployment default (the worker's
    /// env config) applies - the API does not know that default.
    pub llm_model: Option<String>,
    pub embed_model: Option<String>,
    pub stt_language: Option<String>,
    /// OpenAI-compatible endpoint override (e.g. a local vLLM or a cloud
    /// provider). When set, chat-completions is used instead of Ollama.
    pub llm_base_url: Option<String>,
    /// Whether a provider API key is stored. The key itself is never
    /// returned after save - it is write-only from the browser.
    pub llm_api_key_set: bool,
    pub embed_enabled: Option<bool>,
    /// Public by design (pk_...): identifies the tenant in page source.
    pub embed_public_key: Option<String>,
    pub embed_allowed_domains: Option<String>,
    pub embed_theme_color: Option<String>,
    pub embed_position: Option<String>,
    pub embed_language: Option<String>,
    pub embed_voice_enabled: Option<bool>,
    pub telephony_enabled: Option<bool>,
    pub telephony_provider: Option<String>,
    pub telephony_inbound_number: Option<String>,
}

impl From<crate::store::TenantSettings> for SettingsResponse {
    fn from(s: crate::store::TenantSettings) -> Self {
        Self {
            llm_model: s.llm_model,
            embed_model: s.embed_model,
            stt_language: s.stt_language,
            llm_base_url: s.llm_base_url,
            llm_api_key_set: s.llm_api_key_enc.is_some(),
            embed_enabled: s.embed_enabled,
            embed_public_key: s.embed_public_key,
            embed_allowed_domains: s.embed_allowed_domains,
            embed_theme_color: s.embed_theme_color,
            embed_position: s.embed_position,
            embed_language: s.embed_language,
            embed_voice_enabled: s.embed_voice_enabled,
            telephony_enabled: s.telephony_enabled,
            telephony_provider: s.telephony_provider,
            telephony_inbound_number: s.telephony_inbound_number,
        }
    }
}

pub async fn get_settings(
    auth: TenantAuth,
    State(app): State<AppState>,
) -> Result<Json<SettingsResponse>, ApiError> {
    let ctx = auth.0;
    if !ctx.roles().contains(&Role::TenantAdmin) {
        return Err(ApiError::Forbidden);
    }
    let settings = app.settings.get_settings(ctx.tenant()).await?;
    Ok(Json(settings.into()))
}

#[derive(Deserialize)]
pub struct PutSettingsRequest {
    pub llm_model: Option<String>,
    pub embed_model: Option<String>,
    pub stt_language: Option<String>,
    pub llm_base_url: Option<String>,
    /// API key semantics: absent/null keeps the stored key, empty string
    /// clears it, any other value replaces it. Stored encrypted; never
    /// echoed back.
    pub llm_api_key: Option<String>,
    /// Same merge semantics for the embed + telephony fields: null keeps
    /// the stored value, "" clears, anything else replaces.
    pub embed_enabled: Option<bool>,
    pub embed_allowed_domains: Option<String>,
    pub embed_theme_color: Option<String>,
    pub embed_position: Option<String>,
    pub embed_language: Option<String>,
    pub embed_voice_enabled: Option<bool>,
    pub telephony_enabled: Option<bool>,
    pub telephony_provider: Option<String>,
    pub telephony_inbound_number: Option<String>,
}

/// Base-URL validation: https everywhere, http only for parsed loopback
/// IPs or localhost (local vLLM). Rejects embedded credentials and
/// fragments outright. A domain that merely starts with "127." is not
/// loopback - DNS is not evidence.
fn validate_llm_base_url(value: &str) -> bool {
    let Some(rest) = value
        .strip_prefix("https://")
        .or_else(|| value.strip_prefix("http://"))
    else {
        return false;
    };
    if rest.is_empty()
        || rest.len() > 255
        || rest.contains(['@', '#', ' ', '\t'])
        || rest.contains("..")
    {
        return false;
    }
    // Authority = up to the first path/query delimiter; split host and
    // port, honoring bracketed IPv6 literals.
    let authority = rest.split(['/', '?']).next().unwrap_or("");
    let host = if let Some(bracketed) = authority.strip_prefix('[') {
        match bracketed.split(']').next() {
            Some(inner) => inner,
            None => return false,
        }
    } else {
        authority.split(':').next().unwrap_or("")
    };
    if host.is_empty() {
        return false;
    }
    if value.starts_with("http://") {
        // Plain HTTP only to loopback: a parsed IP that is_loopback, or
        // the literal name localhost. Anything else must be TLS.
        return host.eq_ignore_ascii_case("localhost")
            || host
                .parse::<std::net::IpAddr>()
                .map(|ip| ip.is_loopback())
                .unwrap_or(false);
    }
    true
}

pub async fn put_settings(
    auth: TenantAuth,
    State(app): State<AppState>,
    Json(req): Json<PutSettingsRequest>,
) -> Result<Json<SettingsResponse>, ApiError> {
    let ctx = auth.0;
    if !ctx.roles().contains(&Role::TenantAdmin) {
        return Err(ApiError::Forbidden);
    }
    // Trim; empty means "back to the deployment default".
    let clean = |v: Option<String>| v.map(|s| s.trim().to_string()).filter(|s| !s.is_empty());
    let llm_base_url = clean(req.llm_base_url);
    if let Some(url) = &llm_base_url {
        if !validate_llm_base_url(url) {
            return Err(ApiError::BadRequest(
                "ugyldig endpoint-URL (kræver https://; http:// kun til localhost)".into(),
            ));
        }
    }
    // API key merge: None keeps the stored key, Some("") clears it,
    // Some(value) replaces it. Replacing requires the deployment's
    // SETTINGS_KEY; without it we fail closed rather than store plain.
    let current = app.settings.get_settings(ctx.tenant()).await?;
    let had_stored_key = current.llm_api_key_enc.is_some();
    let api_key_updated = req.llm_api_key.is_some();
    let llm_api_key_enc = match req.llm_api_key.as_deref().map(str::trim) {
        None => current.llm_api_key_enc,
        Some("") => None,
        Some(value) => {
            let key = app.config.settings_key.ok_or_else(|| {
                ApiError::BadRequest(
                    "serveren mangler SETTINGS_KEY; kontakt driftsansvarlig".into(),
                )
            })?;
            Some(
                crate::crypto::encrypt(&key, value)
                    .map_err(|e| ApiError::Store(crate::store::StoreError::new(e)))?,
            )
        }
    };
    // Merge semantics for the newer fields: None keeps the stored value,
    // Some("") clears it, Some(value) replaces. The web UI sends partial
    // updates, so a settings save must never wipe a section it did not touch.
    let merge = |new: Option<String>, current: Option<String>| match new {
        None => current,
        Some(v) => clean(Some(v)),
    };
    let embed_allowed_domains = merge(req.embed_allowed_domains, current.embed_allowed_domains);
    if let Some(domains) = &embed_allowed_domains {
        if !crate::embed::validate_domain_list(domains) {
            return Err(ApiError::BadRequest(
                "ugyldigt domæne i listen over tilladte domæner".into(),
            ));
        }
    }
    let embed_theme_color = merge(req.embed_theme_color, current.embed_theme_color);
    if let Some(color) = &embed_theme_color {
        if !crate::embed::validate_theme_color(color) {
            return Err(ApiError::BadRequest("ugyldig farve (brug #rrggbb)".into()));
        }
    }
    let embed_position = merge(req.embed_position, current.embed_position);
    if let Some(position) = &embed_position {
        if position != "left" && position != "right" {
            return Err(ApiError::BadRequest(
                "ugyldig placering (left eller right)".into(),
            ));
        }
    }
    let embed_language = merge(req.embed_language, current.embed_language);
    if let Some(language) = &embed_language {
        if language != "da" && language != "en" {
            return Err(ApiError::BadRequest("ugyldigt sprog (da eller en)".into()));
        }
    }
    let telephony_provider = merge(req.telephony_provider, current.telephony_provider);
    let telephony_inbound_number = merge(
        req.telephony_inbound_number,
        current.telephony_inbound_number,
    );
    if let Some(number) = &telephony_inbound_number {
        if !crate::embed::validate_e164(number) {
            return Err(ApiError::BadRequest(
                "ugyldigt telefonnummer (brug E.164, fx +4512345678)".into(),
            ));
        }
    }
    let settings = crate::store::TenantSettings {
        llm_model: clean(req.llm_model),
        embed_model: clean(req.embed_model),
        stt_language: clean(req.stt_language),
        llm_base_url,
        llm_api_key_enc,
        embed_enabled: req.embed_enabled.or(current.embed_enabled),
        embed_public_key: current.embed_public_key.clone(),
        embed_allowed_domains,
        embed_theme_color,
        embed_position,
        embed_language,
        embed_voice_enabled: req.embed_voice_enabled.or(current.embed_voice_enabled),
        telephony_enabled: req.telephony_enabled.or(current.telephony_enabled),
        telephony_provider,
        telephony_inbound_number,
    };
    // Moving the endpoint while a key is stored would silently send the
    // old secret to a new server. Require an explicit key decision - a
    // replacement value or "" (clear) - whenever the base URL changes.
    if had_stored_key && current.llm_base_url != settings.llm_base_url && req.llm_api_key.is_none()
    {
        return Err(ApiError::BadRequest(
            "endpointet ændres; angiv API-nøglen igen eller ryd den gemte nøgle".into(),
        ));
    }
    for value in [&settings.llm_model, &settings.embed_model]
        .into_iter()
        .flatten()
    {
        if !validate_model_name(value) {
            return Err(ApiError::BadRequest(
                "ugyldigt modelnavn (tilladt: bogstaver, tal og . : / _ + -, maks 128 tegn)".into(),
            ));
        }
    }
    if let Some(lang) = &settings.stt_language {
        if !validate_stt_language(lang) {
            return Err(ApiError::BadRequest(
                "ugyldigt sprog (to små bogstaver, fx \"da\")".into(),
            ));
        }
    }
    app.settings.put_settings(ctx.tenant(), &settings).await?;
    app.audit
        .record(nordsvar_tenancy::TenantScoped::new(
            ctx.tenant(),
            crate::audit::AuditEvent::new(
                ctx.tenant(),
                &ctx.actor().to_string(),
                "settings.update",
                "tenant_settings",
                serde_json::json!({
                    "llm_model": settings.llm_model,
                    "embed_model": settings.embed_model,
                    "stt_language": settings.stt_language,
                    "llm_base_url": settings.llm_base_url,
                    "api_key_updated": api_key_updated,
                    "embed_enabled": settings.embed_enabled,
                    "embed_voice_enabled": settings.embed_voice_enabled,
                    "telephony_enabled": settings.telephony_enabled,
                }),
            ),
        ))
        .await?;
    Ok(Json(settings.into()))
}

#[derive(Serialize)]
pub struct TestConnectionResponse {
    pub ok: bool,
    pub detail: String,
}

/// Server-side connectivity check against the tenant's configured
/// OpenAI-compatible endpoint (GET {base}/models, Bearer if a key is
/// stored). The key never leaves the server; the browser only sees
/// ok/detail.
pub async fn test_llm_connection(
    auth: TenantAuth,
    State(app): State<AppState>,
) -> Result<Json<TestConnectionResponse>, ApiError> {
    let ctx = auth.0;
    if !ctx.roles().contains(&Role::TenantAdmin) {
        return Err(ApiError::Forbidden);
    }
    let settings = app.settings.get_settings(ctx.tenant()).await?;
    let Some(base_url) = settings.llm_base_url else {
        return Ok(Json(TestConnectionResponse {
            ok: false,
            detail: "intet endpoint konfigureret".into(),
        }));
    };
    let bearer = match settings.llm_api_key_enc {
        Some(enc) => {
            let key = app.config.settings_key.ok_or_else(|| {
                ApiError::Store(crate::store::StoreError::new("SETTINGS_KEY missing"))
            })?;
            Some(
                crate::crypto::decrypt(&key, &enc)
                    .map_err(|e| ApiError::Store(crate::store::StoreError::new(e)))?,
            )
        }
        None => None,
    };
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| ApiError::Store(crate::store::StoreError::new(e.to_string())))?;
    let mut req = client.get(format!("{}/models", base_url.trim_end_matches('/')));
    if let Some(key) = &bearer {
        req = req.bearer_auth(key);
    }
    let resp = req.send().await;
    Ok(Json(match resp {
        Ok(r) if r.status().is_success() => TestConnectionResponse {
            ok: true,
            detail: format!("forbundet (HTTP {})", r.status()),
        },
        Ok(r) => TestConnectionResponse {
            ok: false,
            detail: format!("endpoint svarede HTTP {}", r.status()),
        },
        Err(_) => TestConnectionResponse {
            ok: false,
            detail: "kunne ikke forbinde".into(),
        },
    }))
}

#[derive(Serialize)]
pub struct Health {
    pub status: &'static str,
    pub version: &'static str,
}

pub async fn healthz() -> Json<Health> {
    Json(Health {
        status: "ok",
        version: env!("CARGO_PKG_VERSION"),
    })
}

#[derive(Debug, Deserialize)]
pub struct CreateSessionRequest {
    /// Optional display name for the session initiator.
    pub display_name: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct SessionResponse {
    pub id: String,
    pub room: String,
    pub status: SessionStatus,
    pub created_by: String,
    pub created_at_unix: u64,
}

impl From<Session> for SessionResponse {
    fn from(s: Session) -> Self {
        Self {
            id: s.id.to_string(),
            room: s.room,
            status: s.status,
            created_by: s.created_by,
            created_at_unix: s.created_at_unix,
        }
    }
}

/// Create a support session. Any authenticated tenant member can start one.
pub async fn create_session(
    State(state): State<AppState>,
    auth: TenantAuth,
    body: Option<Json<CreateSessionRequest>>,
) -> Result<(StatusCode, Json<SessionResponse>), ApiError> {
    let ctx = auth.0;
    let session = Session::new(ctx.tenant(), ctx.actor().as_str());
    let stored = state.sessions.create(ctx.tenant(), session).await?;
    state
        .audit
        .record(ctx.scope(crate::audit::AuditEvent::new(
            ctx.tenant(),
            ctx.actor().as_str(),
            "session.created",
            &stored.id.to_string(),
            serde_json::json!({
                "room": stored.room,
                "display_name": body.and_then(|b| b.0.display_name),
            }),
        )))
        .await?;
    Ok((StatusCode::CREATED, Json(stored.into())))
}

#[derive(Debug, Deserialize)]
pub struct JoinRequest {
    pub display_name: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct JoinResponse {
    pub token: String,
    pub livekit_url: String,
    pub room: String,
    pub identity: String,
    pub expires_in_secs: u64,
    /// TURN relay for browser media when LiveKit's own media ports are
    /// unreachable from clients (tunnelled deployments). Omitted when no
    /// TURN server is configured.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub turn: Option<TurnInfo>,
}

/// TURN relay details handed to browsers in the join ticket.
#[derive(Debug, Serialize, Clone)]
pub struct TurnInfo {
    pub urls: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub credential: Option<String>,
}

/// Mint a LiveKit join token for an active session in the caller's tenant.
pub async fn join_session(
    State(state): State<AppState>,
    auth: TenantAuth,
    Path(id): Path<String>,
    body: Option<Json<JoinRequest>>,
) -> Result<Json<JoinResponse>, ApiError> {
    let ctx = auth.0;
    let session_id = parse_session_id(&id)?;
    let session = state
        .sessions
        .get(ctx.tenant(), session_id)
        .await?
        .ok_or(ApiError::NotFound("session"))?;

    if session.status != SessionStatus::Active {
        return Err(ApiError::Conflict("session has ended".into()));
    }

    let identity = format!(
        "{}-{}",
        ctx.actor(),
        &Uuid::new_v4().as_simple().to_string()[..8]
    );
    let display_name = body.and_then(|b| b.0.display_name);
    let token = livekit_token::mint_join_token(
        &state.config.livekit_api_key,
        &state.config.livekit_api_secret,
        &session.room,
        &identity,
        display_name.as_deref(),
        ctx.tenant(),
        state.config.token_ttl,
    )
    .map_err(|_| ApiError::Internal)?;

    state
        .audit
        .record(ctx.scope(crate::audit::AuditEvent::new(
            ctx.tenant(),
            ctx.actor().as_str(),
            "session.joined",
            &session.id.to_string(),
            serde_json::json!({ "identity": identity }),
        )))
        .await?;

    Ok(Json(JoinResponse {
        token,
        livekit_url: state
            .config
            .livekit_public_url
            .clone()
            .unwrap_or_else(|| state.config.livekit_url.clone()),
        room: session.room,
        identity,
        expires_in_secs: state.config.token_ttl.as_secs(),
        turn: state.config.turn_url.as_ref().map(|urls| TurnInfo {
            urls: urls.clone(),
            username: state.config.turn_username.clone(),
            credential: state.config.turn_credential.clone(),
        }),
    }))
}

/// Read one session. Cross-tenant reads are indistinguishable from unknown
/// sessions (404).
pub async fn get_session(
    State(state): State<AppState>,
    auth: TenantAuth,
    Path(id): Path<String>,
) -> Result<Json<SessionResponse>, ApiError> {
    let session_id = parse_session_id(&id)?;
    let session = state
        .sessions
        .get(auth.0.tenant(), session_id)
        .await?
        .ok_or(ApiError::NotFound("session"))?;
    Ok(Json(session.into()))
}

/// End a session. Agents and tenant admins may end any session in their
/// tenant; end users may end only sessions they created.
pub async fn end_session(
    State(state): State<AppState>,
    auth: TenantAuth,
    Path(id): Path<String>,
) -> Result<Json<SessionResponse>, ApiError> {
    let ctx = auth.0;
    let session_id = parse_session_id(&id)?;
    let existing = state
        .sessions
        .get(ctx.tenant(), session_id)
        .await?
        .ok_or(ApiError::NotFound("session"))?;

    let is_creator = existing.created_by == ctx.actor().as_str();
    let is_privileged = ctx.has_role(Role::Agent) || ctx.has_role(Role::TenantAdmin);
    if !is_creator && !is_privileged {
        return Err(ApiError::Forbidden);
    }

    let ended = state
        .sessions
        .end(ctx.tenant(), session_id)
        .await?
        .ok_or(ApiError::NotFound("session"))?;
    state
        .audit
        .record(ctx.scope(crate::audit::AuditEvent::new(
            ctx.tenant(),
            ctx.actor().as_str(),
            "session.ended",
            &ended.id.to_string(),
            serde_json::json!({}),
        )))
        .await?;
    Ok(Json(ended.into()))
}

/// List the caller's tenant's sessions (agents/admins only).
pub async fn list_sessions(
    State(state): State<AppState>,
    auth: TenantAuth,
) -> Result<Json<Vec<SessionResponse>>, ApiError> {
    let ctx = auth.0;
    if !ctx.has_role(Role::Agent) && !ctx.has_role(Role::TenantAdmin) {
        return Err(ApiError::Forbidden);
    }
    let sessions = state.sessions.list(ctx.tenant()).await?;
    Ok(Json(sessions.into_iter().map(Into::into).collect()))
}

fn parse_session_id(raw: &str) -> Result<SessionId, ApiError> {
    SessionId::parse(raw).map_err(|_| ApiError::BadRequest("invalid session id".into()))
}

// ---------- Knowledge-base admin ----------

/// Upload a knowledge document. Agent role required (docs/SECURITY.md).
/// The body is the raw file; the file name arrives in `x-file-name`.
pub async fn upload_kb_document(
    State(state): State<AppState>,
    auth: TenantAuth,
    headers: axum::http::HeaderMap,
    body: axum::body::Bytes,
) -> Result<(StatusCode, Json<serde_json::Value>), ApiError> {
    let ctx = auth.0;
    if !ctx.roles().iter().any(|r| r.can_administer_kb()) {
        return Err(ApiError::Forbidden);
    }
    let name = headers
        .get("x-file-name")
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| ApiError::BadRequest("missing x-file-name header".into()))?
        .to_string();
    if body.is_empty() {
        return Err(ApiError::BadRequest("empty body".into()));
    }
    if body.len() > 25 * 1024 * 1024 {
        return Err(ApiError::BadRequest("document exceeds 25 MB limit".into()));
    }

    let doc = nordsvar_kb_ingest::SourceDocument {
        name: name.clone(),
        bytes: body.to_vec(),
    };
    let report = state
        .kb_ingestor
        .ingest(ctx.tenant(), &doc)
        .await
        .map_err(|e| ApiError::BadRequest(e.to_string()))?;
    state
        .documents
        .record(
            ctx.tenant(),
            crate::store::DocumentMeta {
                id: report.document_id.clone(),
                name: report.document_name.clone(),
                format: serde_json::to_string(&report.format)
                    .unwrap_or_default()
                    .trim_matches('"')
                    .to_string(),
                chunks_indexed: report.chunks_indexed,
                ingested_by: ctx.actor().as_str().to_string(),
                ingested_at_unix: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs(),
            },
        )
        .await?;

    state
        .audit
        .record(ctx.scope(crate::audit::AuditEvent::new(
            ctx.tenant(),
            ctx.actor().as_str(),
            "kb.document_ingested",
            &report.document_id,
            serde_json::json!({ "name": name, "chunks": report.chunks_indexed }),
        )))
        .await?;

    Ok((
        StatusCode::CREATED,
        Json(serde_json::json!({
            "document_id": report.document_id,
            "name": report.document_name,
            "format": report.format,
            "chunks_indexed": report.chunks_indexed,
        })),
    ))
}

// ---------- Audit stream ----------

/// List the tenant's audit stream. Tenant admins only (docs/SECURITY.md).
pub async fn list_audit_events(
    State(state): State<AppState>,
    auth: TenantAuth,
) -> Result<Json<Vec<crate::audit::AuditEvent>>, ApiError> {
    let ctx = auth.0;
    if !ctx.roles().iter().any(|r| r.can_read_audit()) {
        return Err(ApiError::Forbidden);
    }
    Ok(Json(state.audit.list(ctx.tenant()).await?))
}

/// List the tenant's knowledge documents (agent role).
pub async fn list_kb_documents(
    State(state): State<AppState>,
    auth: TenantAuth,
) -> Result<Json<Vec<crate::store::DocumentMeta>>, ApiError> {
    let ctx = auth.0;
    if !ctx.roles().iter().any(|r| r.can_administer_kb()) {
        return Err(ApiError::Forbidden);
    }
    Ok(Json(state.documents.list(ctx.tenant()).await?))
}

/// Delete a knowledge document: registry row plus its vectors. The delete
/// is tenant-scoped end to end; unknown or cross-tenant ids are 404.
pub async fn delete_kb_document(
    State(state): State<AppState>,
    auth: TenantAuth,
    Path(id): Path<String>,
) -> Result<StatusCode, ApiError> {
    let ctx = auth.0;
    if !ctx.roles().iter().any(|r| r.can_administer_kb()) {
        return Err(ApiError::Forbidden);
    }
    let removed = state
        .documents
        .delete(ctx.tenant(), &id)
        .await?
        .ok_or(ApiError::NotFound("document"))?;
    state
        .kb_index
        .delete_document(ctx.tenant(), &removed.id)
        .await
        .map_err(|_| ApiError::Internal)?;
    state
        .audit
        .record(ctx.scope(crate::audit::AuditEvent::new(
            ctx.tenant(),
            ctx.actor().as_str(),
            "kb.document_deleted",
            &removed.id,
            serde_json::json!({ "name": removed.name }),
        )))
        .await?;
    Ok(StatusCode::NO_CONTENT)
}
