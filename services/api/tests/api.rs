//! HTTP-level integration tests: routing, auth extraction, tenant
//! isolation, token minting, and role enforcement through the real router.

use axum::body::{to_bytes, Body};
use axum::http::{Request, StatusCode};
use nordsvar_api::app::{build_router, AppState};
use nordsvar_api::config::Config;
use nordsvar_api::livekit_token::verify_join_token;
use nordsvar_tenancy::TenantId;
use serde_json::{json, Value};
use tower::ServiceExt;

fn app() -> axum::Router {
    build_router(AppState::in_memory(Config::test()))
}

fn request(
    method: &str,
    path: &str,
    tenant: Option<TenantId>,
    actor: &str,
    roles: Option<&str>,
    body: Option<Value>,
) -> Request<Body> {
    let mut builder = Request::builder().method(method).uri(path);
    if let Some(t) = tenant {
        builder = builder.header("x-tenant-id", t.to_string());
    }
    builder = builder.header("x-actor-id", actor);
    if let Some(r) = roles {
        builder = builder.header("x-actor-roles", r);
    }
    match body {
        Some(v) => builder
            .header("content-type", "application/json")
            .body(Body::from(v.to_string()))
            .unwrap(),
        None => builder.body(Body::empty()).unwrap(),
    }
}

async fn json_body(resp: axum::response::Response) -> Value {
    let bytes = to_bytes(resp.into_body(), 1 << 20).await.unwrap();
    serde_json::from_slice(&bytes).unwrap_or(Value::Null)
}

#[tokio::test]
async fn join_ticket_uses_public_livekit_url_when_configured() {
    // Browsers cannot reach the compose-internal ws://livekit:7880; a
    // deployment sets LIVEKIT_PUBLIC_URL to the externally reachable
    // address and join tickets must carry it (regression: tickets used to
    // always carry the internal URL, which broke the codespaces demo).
    let mut config = Config::test();
    config.livekit_public_url = Some("wss://demo-7880.app.github.dev".into());
    let app = build_router(AppState::in_memory(config));
    let tenant = TenantId::new();

    let resp = app
        .clone()
        .oneshot(request(
            "POST",
            "/v1/sessions",
            Some(tenant),
            "alice",
            None,
            Some(json!({})),
        ))
        .await
        .unwrap();
    let session_id = json_body(resp).await["id"].as_str().unwrap().to_string();

    let resp = app
        .oneshot(request(
            "POST",
            &format!("/v1/sessions/{session_id}/join"),
            Some(tenant),
            "alice",
            None,
            Some(json!({ "display_name": "Alice A" })),
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let joined = json_body(resp).await;
    assert_eq!(
        joined["livekit_url"].as_str().unwrap(),
        "wss://demo-7880.app.github.dev"
    );
}

#[tokio::test]
async fn join_ticket_carries_turn_relay_when_configured() {
    let mut config = Config::test();
    config.turn_url = Some("turns:demo-7882.app.github.dev:443?transport=tcp".into());
    config.turn_username = Some("nordsvar".into());
    config.turn_credential = Some("turn-secret".into());
    let app = build_router(AppState::in_memory(config));
    let tenant = TenantId::new();
    let resp = app
        .clone()
        .oneshot(request(
            "POST",
            "/v1/sessions",
            Some(tenant),
            "alice",
            None,
            Some(json!({})),
        ))
        .await
        .unwrap();
    let session_id = json_body(resp).await["id"].as_str().unwrap().to_string();
    let resp = app
        .oneshot(request(
            "POST",
            &format!("/v1/sessions/{session_id}/join"),
            Some(tenant),
            "alice",
            None,
            Some(json!({})),
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let joined = json_body(resp).await;
    assert_eq!(
        joined["turn"]["urls"].as_str().unwrap(),
        "turns:demo-7882.app.github.dev:443?transport=tcp"
    );
    assert_eq!(joined["turn"]["username"].as_str().unwrap(), "nordsvar");
    assert_eq!(
        joined["turn"]["credential"].as_str().unwrap(),
        "turn-secret"
    );
}

#[tokio::test]
async fn join_ticket_omits_turn_when_unconfigured() {
    let app = app();
    let tenant = TenantId::new();
    let resp = app
        .clone()
        .oneshot(request(
            "POST",
            "/v1/sessions",
            Some(tenant),
            "alice",
            None,
            Some(json!({})),
        ))
        .await
        .unwrap();
    let session_id = json_body(resp).await["id"].as_str().unwrap().to_string();
    let resp = app
        .oneshot(request(
            "POST",
            &format!("/v1/sessions/{session_id}/join"),
            Some(tenant),
            "alice",
            None,
            Some(json!({})),
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let joined = json_body(resp).await;
    assert!(joined.get("turn").is_none(), "turn field must be omitted");
}

#[tokio::test]
async fn join_ticket_falls_back_to_internal_url_without_public_override() {
    let app = app();
    let tenant = TenantId::new();
    let resp = app
        .clone()
        .oneshot(request(
            "POST",
            "/v1/sessions",
            Some(tenant),
            "alice",
            None,
            Some(json!({})),
        ))
        .await
        .unwrap();
    let session_id = json_body(resp).await["id"].as_str().unwrap().to_string();
    let resp = app
        .oneshot(request(
            "POST",
            &format!("/v1/sessions/{session_id}/join"),
            Some(tenant),
            "alice",
            None,
            Some(json!({})),
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    assert_eq!(
        json_body(resp).await["livekit_url"].as_str().unwrap(),
        "ws://livekit.test:7880"
    );
}

#[tokio::test]
async fn healthz_reports_ok() {
    let resp = app()
        .oneshot(request("GET", "/healthz", None, "x", None, None))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    assert_eq!(json_body(resp).await["status"], "ok");
}

#[tokio::test]
async fn full_session_flow_create_join_end() {
    let app = app();
    let tenant = TenantId::new();

    let resp = app
        .clone()
        .oneshot(request(
            "POST",
            "/v1/sessions",
            Some(tenant),
            "alice",
            None,
            Some(json!({})),
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::CREATED);
    let created = json_body(resp).await;
    let session_id = created["id"].as_str().unwrap().to_string();
    assert!(created["room"].as_str().unwrap().starts_with("session-"));

    let resp = app
        .clone()
        .oneshot(request(
            "POST",
            &format!("/v1/sessions/{session_id}/join"),
            Some(tenant),
            "alice",
            None,
            Some(json!({ "display_name": "Alice A" })),
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let joined = json_body(resp).await;
    let token = joined["token"].as_str().unwrap();
    let claims = verify_join_token("testsecret", token).unwrap();
    assert_eq!(claims.video.room, created["room"].as_str().unwrap());
    assert_eq!(claims.name.as_deref(), Some("Alice A"));
    let meta: nordsvar_api::livekit_token::ParticipantMetadata =
        serde_json::from_str(&claims.metadata.unwrap()).unwrap();
    assert_eq!(meta.tenant_id, tenant);

    let resp = app
        .clone()
        .oneshot(request(
            "DELETE",
            &format!("/v1/sessions/{session_id}"),
            Some(tenant),
            "alice",
            None,
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    assert_eq!(json_body(resp).await["status"], "ended");

    // Joining an ended session is a conflict.
    let resp = app
        .oneshot(request(
            "POST",
            &format!("/v1/sessions/{session_id}/join"),
            Some(tenant),
            "alice",
            None,
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::CONFLICT);
}

#[tokio::test]
async fn cross_tenant_access_is_a_404_not_a_403() {
    let app = app();
    let a = TenantId::new();
    let b = TenantId::new();

    let resp = app
        .clone()
        .oneshot(request(
            "POST",
            "/v1/sessions",
            Some(a),
            "alice",
            None,
            None,
        ))
        .await
        .unwrap();
    let session_id = json_body(resp).await["id"].as_str().unwrap().to_string();

    for (method, suffix) in [("GET", ""), ("DELETE", ""), ("POST", "/join")] {
        let resp = app
            .clone()
            .oneshot(request(
                method,
                &format!("/v1/sessions/{session_id}{suffix}"),
                Some(b),
                "bob",
                Some("agent"),
                None,
            ))
            .await
            .unwrap();
        assert_eq!(
            resp.status(),
            StatusCode::NOT_FOUND,
            "{method}{suffix} leaked across tenants"
        );
    }
}

#[tokio::test]
async fn missing_tenant_headers_is_unauthorized() {
    let app = app();
    let resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/v1/sessions")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);

    let resp = app
        .oneshot(request("POST", "/v1/sessions", None, "alice", None, None))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn end_user_cannot_end_another_users_session() {
    let app = app();
    let tenant = TenantId::new();
    let resp = app
        .clone()
        .oneshot(request(
            "POST",
            "/v1/sessions",
            Some(tenant),
            "alice",
            None,
            None,
        ))
        .await
        .unwrap();
    let session_id = json_body(resp).await["id"].as_str().unwrap().to_string();

    let resp = app
        .clone()
        .oneshot(request(
            "DELETE",
            &format!("/v1/sessions/{session_id}"),
            Some(tenant),
            "mallory",
            None,
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);

    // An agent may end it.
    let resp = app
        .oneshot(request(
            "DELETE",
            &format!("/v1/sessions/{session_id}"),
            Some(tenant),
            "it-manager",
            Some("agent"),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
}

#[tokio::test]
async fn session_listing_requires_agent_role() {
    let app = app();
    let tenant = TenantId::new();
    let resp = app
        .clone()
        .oneshot(request(
            "GET",
            "/v1/sessions",
            Some(tenant),
            "alice",
            None,
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);

    let resp = app
        .clone()
        .oneshot(request(
            "POST",
            "/v1/sessions",
            Some(tenant),
            "alice",
            None,
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::CREATED);

    let resp = app
        .oneshot(request(
            "GET",
            "/v1/sessions",
            Some(tenant),
            "it",
            Some("agent"),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    assert_eq!(json_body(resp).await.as_array().unwrap().len(), 1);
}

#[tokio::test]
async fn invalid_session_id_is_a_400() {
    let resp = app()
        .oneshot(request(
            "GET",
            "/v1/sessions/not-a-uuid",
            Some(TenantId::new()),
            "alice",
            None,
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn kb_upload_requires_agent_role_and_ingests() {
    let app = app();
    let tenant = TenantId::new();

    // End user is rejected.
    let resp = app
        .clone()
        .oneshot(
            request(
                "POST",
                "/v1/kb/documents",
                Some(tenant),
                "alice",
                None,
                None,
            )
            .into_body()
            .pipe(|_| {
                Request::builder()
                    .method("POST")
                    .uri("/v1/kb/documents")
                    .header("x-tenant-id", tenant.to_string())
                    .header("x-actor-id", "alice")
                    .header("x-file-name", "runbook.md")
                    .body(Body::from("# Printer\n\nGenstart spooleren."))
                    .unwrap()
            }),
        )
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);

    // Agent ingests a document.
    let resp = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/v1/kb/documents")
                .header("x-tenant-id", tenant.to_string())
                .header("x-actor-id", "it-manager")
                .header("x-actor-roles", "agent")
                .header("x-file-name", "runbook.md")
                .body(Body::from(
                    "# Printer\n\nGenstart printspooleren via services.msc.",
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::CREATED);
    let body = json_body(resp).await;
    assert_eq!(body["format"], "markdown");
    assert!(body["chunks_indexed"].as_u64().unwrap() >= 1);
}

trait Pipe: Sized {
    fn pipe<T>(self, f: impl FnOnce(Self) -> T) -> T {
        f(self)
    }
}
impl Pipe for axum::body::Body {}

#[tokio::test]
async fn audit_stream_is_tenant_admin_only_and_tenant_scoped() {
    let app = app();
    let tenant = TenantId::new();
    let other = TenantId::new();

    // Agent cannot read audit.
    let resp = app
        .clone()
        .oneshot(request(
            "GET",
            "/v1/audit",
            Some(tenant),
            "it",
            Some("agent"),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);

    // Generate an event in this tenant and one in another.
    let _ = app
        .clone()
        .oneshot(request(
            "POST",
            "/v1/sessions",
            Some(tenant),
            "alice",
            None,
            None,
        ))
        .await
        .unwrap();
    let _ = app
        .clone()
        .oneshot(request(
            "POST",
            "/v1/sessions",
            Some(other),
            "eve",
            None,
            None,
        ))
        .await
        .unwrap();

    let resp = app
        .oneshot(request(
            "GET",
            "/v1/audit",
            Some(tenant),
            "boss",
            Some("tenant_admin"),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let events = json_body(resp).await;
    let arr = events.as_array().unwrap();
    assert_eq!(arr.len(), 1, "only this tenant's events");
    assert_eq!(arr[0]["action"], "session.created");
    assert_eq!(arr[0]["actor"], "alice");
}

#[tokio::test]
async fn kb_document_lifecycle_upload_list_delete() {
    let app = app();
    let tenant = TenantId::new();

    let resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/v1/kb/documents")
                .header("x-tenant-id", tenant.to_string())
                .header("x-actor-id", "it-manager")
                .header("x-actor-roles", "agent")
                .header("x-file-name", "runbook.md")
                .body(Body::from("# Printer\n\nGenstart printspooleren."))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::CREATED);
    let doc_id = json_body(resp).await["document_id"]
        .as_str()
        .unwrap()
        .to_string();

    let resp = app
        .clone()
        .oneshot(request(
            "GET",
            "/v1/kb/documents",
            Some(tenant),
            "it-manager",
            Some("agent"),
            None,
        ))
        .await
        .unwrap();
    let docs = json_body(resp).await;
    assert_eq!(docs.as_array().unwrap().len(), 1);
    assert_eq!(docs[0]["name"], "runbook.md");

    // End user cannot list or delete.
    let resp = app
        .clone()
        .oneshot(request(
            "GET",
            "/v1/kb/documents",
            Some(tenant),
            "alice",
            None,
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);

    // Cross-tenant delete is a 404.
    let resp = app
        .clone()
        .oneshot(request(
            "DELETE",
            &format!("/v1/kb/documents/{doc_id}"),
            Some(TenantId::new()),
            "eve",
            Some("agent"),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::NOT_FOUND);

    // Owner tenant deletes.
    let resp = app
        .clone()
        .oneshot(request(
            "DELETE",
            &format!("/v1/kb/documents/{doc_id}"),
            Some(tenant),
            "it-manager",
            Some("agent"),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::NO_CONTENT);

    let resp = app
        .oneshot(request(
            "GET",
            "/v1/kb/documents",
            Some(tenant),
            "it-manager",
            Some("agent"),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(json_body(resp).await.as_array().unwrap().len(), 0);
}

#[tokio::test]
async fn internal_dispatch_requires_token_and_claims_once() {
    // Internal routes fail closed without INTERNAL_TOKEN configured.
    let app = app();
    let internal_app = build_router(AppState::in_memory(Config::test_with_internal_token(
        "test-internal-secret",
    )));
    let tenant = TenantId::new();
    let resp = app
        .clone()
        .oneshot(request(
            "GET",
            "/v1/internal/sessions/unclaimed",
            None,
            "x",
            None,
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::NOT_FOUND);

    // The internal app has the token configured. Give it its own session.
    let resp = internal_app
        .clone()
        .oneshot(request(
            "POST",
            "/v1/sessions",
            Some(tenant),
            "alice",
            None,
            None,
        ))
        .await
        .unwrap();
    let internal_session_id = json_body(resp).await["id"].as_str().unwrap().to_string();
    let resp = internal_app
        .clone()
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/v1/internal/sessions/unclaimed")
                .header("x-internal-token", "test-internal-secret")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let list = json_body(resp).await;
    assert!(list
        .as_array()
        .unwrap()
        .iter()
        .any(|s| s["id"] == internal_session_id));

    let claim = |app: axum::Router| {
        let session_id = internal_session_id.clone();
        async move {
            app.oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!("/v1/internal/sessions/{session_id}/claim"))
                    .header("x-internal-token", "test-internal-secret")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap()
        }
    };
    let first = claim(internal_app.clone()).await;
    assert_eq!(first.status(), StatusCode::OK);
    assert_eq!(json_body(first).await["tenant"], tenant.to_string());
    let second = claim(internal_app.clone()).await;
    assert_eq!(second.status(), StatusCode::CONFLICT);

    // Wrong token is unauthorized.
    let resp = internal_app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/v1/internal/sessions/unclaimed")
                .header("x-internal-token", "wrong")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn internal_heartbeat_requires_token_and_reports_liveness() {
    let internal_app = build_router(AppState::in_memory(Config::test_with_internal_token(
        "test-internal-secret",
    )));
    let tenant = TenantId::new();
    let resp = internal_app
        .clone()
        .oneshot(request(
            "POST",
            "/v1/sessions",
            Some(tenant),
            "alice",
            None,
            None,
        ))
        .await
        .unwrap();
    let session_id = json_body(resp).await["id"].as_str().unwrap().to_string();

    let heartbeat = |app: axum::Router, token: Option<&str>| {
        let session_id = session_id.clone();
        let token = token.map(str::to_string);
        async move {
            let mut b = Request::builder()
                .method("POST")
                .uri(format!("/v1/internal/sessions/{session_id}/heartbeat"));
            if let Some(t) = token {
                b = b.header("x-internal-token", t);
            }
            app.oneshot(b.body(Body::empty()).unwrap()).await.unwrap()
        }
    };

    // No token and wrong token are rejected before any state check.
    assert_eq!(
        heartbeat(internal_app.clone(), None).await.status(),
        StatusCode::UNAUTHORIZED
    );
    assert_eq!(
        heartbeat(internal_app.clone(), Some("wrong"))
            .await
            .status(),
        StatusCode::UNAUTHORIZED
    );

    // Unclaimed session: not alive.
    let resp = heartbeat(internal_app.clone(), Some("test-internal-secret")).await;
    assert_eq!(resp.status(), StatusCode::OK);
    assert_eq!(json_body(resp).await["alive"], false);

    // Claim, then heartbeat reports alive.
    let resp = internal_app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri(format!("/v1/internal/sessions/{session_id}/claim"))
                .header("x-internal-token", "test-internal-secret")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let resp = heartbeat(internal_app.clone(), Some("test-internal-secret")).await;
    assert_eq!(resp.status(), StatusCode::OK);
    assert_eq!(json_body(resp).await["alive"], true);

    // Unknown session: alive false (never an error - the worker uses this
    // to learn its session is gone).
    let resp = internal_app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri(format!(
                    "/v1/internal/sessions/{}/heartbeat",
                    nordsvar_api::store::SessionId::new()
                ))
                .header("x-internal-token", "test-internal-secret")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    assert_eq!(json_body(resp).await["alive"], false);
}

#[tokio::test]
async fn internal_worker_id_scopes_claims_and_heartbeats() {
    let internal_app = build_router(AppState::in_memory(Config::test_with_internal_token(
        "test-internal-secret",
    )));
    let tenant = TenantId::new();
    let resp = internal_app
        .clone()
        .oneshot(request(
            "POST",
            "/v1/sessions",
            Some(tenant),
            "alice",
            None,
            None,
        ))
        .await
        .unwrap();
    let session_id = json_body(resp).await["id"].as_str().unwrap().to_string();

    let call = |app: axum::Router, path: &str, worker: Option<&str>| {
        let uri = format!("/v1/internal/sessions/{session_id}{path}");
        let worker = worker.map(str::to_string);
        async move {
            let mut b = Request::builder()
                .method("POST")
                .uri(uri)
                .header("x-internal-token", "test-internal-secret");
            if let Some(w) = worker {
                b = b.header("x-worker-id", w);
            }
            app.oneshot(b.body(Body::empty()).unwrap()).await.unwrap()
        }
    };

    // Worker A claims; worker B's heartbeat does not refresh A's claim.
    assert_eq!(
        call(internal_app.clone(), "/claim", Some("worker-a"))
            .await
            .status(),
        StatusCode::OK
    );
    let resp = call(internal_app.clone(), "/heartbeat", Some("worker-b")).await;
    assert_eq!(resp.status(), StatusCode::OK);
    assert_eq!(json_body(resp).await["alive"], false);
    let resp = call(internal_app.clone(), "/heartbeat", Some("worker-a")).await;
    assert_eq!(resp.status(), StatusCode::OK);
    assert_eq!(json_body(resp).await["alive"], true);

    // No header keeps the legacy shared identity - distinct from worker A.
    let resp = call(internal_app.clone(), "/heartbeat", None).await;
    assert_eq!(json_body(resp).await["alive"], false);

    // Garbage worker ids are rejected before touching the store.
    let resp = call(
        internal_app.clone(),
        "/heartbeat",
        Some("bad id; DROP TABLE"),
    )
    .await;
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

// ----- Per-tenant AI settings -----

#[tokio::test]
async fn settings_flow_validates_persists_audits_and_reaches_claims() {
    let app = build_router(AppState::in_memory(Config::test_with_internal_token(
        "test-internal-secret",
    )));
    let tenant = TenantId::new();

    // End users cannot read settings (no roles header = end user).
    let resp = app
        .clone()
        .oneshot(request(
            "GET",
            "/v1/settings",
            Some(tenant),
            "bob",
            None,
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);

    // Defaults: all overrides null (deployment default applies).
    let resp = app
        .clone()
        .oneshot(request(
            "GET",
            "/v1/settings",
            Some(tenant),
            "alice",
            Some("tenant_admin"),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = json_body(resp).await;
    assert_eq!(body["llm_model"], serde_json::Value::Null);

    // Validation: garbage model name and bad language are rejected.
    for bad in [
        serde_json::json!({"llm_model": "bad; DROP TABLE"}),
        serde_json::json!({"stt_language": "danish"}),
    ] {
        let resp = app
            .clone()
            .oneshot(request(
                "PUT",
                "/v1/settings",
                Some(tenant),
                "alice",
                Some("tenant_admin"),
                Some(bad),
            ))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    }

    // Valid overrides persist.
    let resp = app
        .clone()
        .oneshot(request(
            "PUT",
            "/v1/settings",
            Some(tenant),
            "alice",
            Some("tenant_admin"),
            Some(serde_json::json!({
                "llm_model": "llama3.1:8b",
                "stt_language": "da"
            })),
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = json_body(resp).await;
    assert_eq!(body["llm_model"], "llama3.1:8b");
    assert_eq!(body["embed_model"], serde_json::Value::Null);

    // The change is audited.
    let resp = app
        .clone()
        .oneshot(request(
            "GET",
            "/v1/audit",
            Some(tenant),
            "alice",
            Some("tenant_admin"),
            None,
        ))
        .await
        .unwrap();
    let events = json_body(resp).await;
    assert!(events
        .as_array()
        .unwrap()
        .iter()
        .any(|e| e["action"] == "settings.update"));

    // A claimed session carries the overrides to the worker.
    let resp = app
        .clone()
        .oneshot(request(
            "POST",
            "/v1/sessions",
            Some(tenant),
            "alice",
            None,
            None,
        ))
        .await
        .unwrap();
    let session_id = json_body(resp).await["id"].as_str().unwrap().to_string();
    let resp = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri(format!("/v1/internal/sessions/{session_id}/claim"))
                .header("x-internal-token", "test-internal-secret")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = json_body(resp).await;
    assert_eq!(body["settings"]["llm_model"], "llama3.1:8b");
    assert_eq!(body["settings"]["stt_language"], "da");
    assert_eq!(body["settings"]["embed_model"], serde_json::Value::Null);
}

// ----- External OpenAI-compatible provider settings -----

async fn stub_llm_endpoint() -> (String, tokio::sync::mpsc::Receiver<Option<String>>) {
    let (tx, rx) = tokio::sync::mpsc::channel::<Option<String>>(4);
    let app = axum::Router::new().route(
        "/models",
        axum::routing::get(move |headers: axum::http::HeaderMap| {
            let tx = tx.clone();
            async move {
                let auth = headers
                    .get("authorization")
                    .and_then(|v| v.to_str().ok())
                    .map(|s| s.to_string());
                let _ = tx.send(auth).await;
                axum::Json(serde_json::json!({"data": []}))
            }
        }),
    );
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let port = listener.local_addr().unwrap().port();
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    (format!("http://127.0.0.1:{port}"), rx)
}

#[tokio::test]
async fn provider_settings_encrypt_redact_and_reach_the_worker() {
    let app = build_router(AppState::in_memory(Config::test_with_internal_token(
        "test-internal-secret",
    )));
    let tenant = TenantId::new();
    let put = |app: axum::Router, body: serde_json::Value| async move {
        app.oneshot(request(
            "PUT",
            "/v1/settings",
            Some(tenant),
            "alice",
            Some("tenant_admin"),
            Some(body),
        ))
        .await
        .unwrap()
    };

    // Base-URL validation: no scheme, plain http off-loopback, creds.
    for bad in [
        serde_json::json!({"llm_base_url": "api.openai.com/v1"}),
        serde_json::json!({"llm_base_url": "http://example.com/v1"}),
        serde_json::json!({"llm_base_url": "https://user:pw@api.openai.com/v1"}),
        // 127.-prefixed domains are not loopback; DNS is not evidence.
        serde_json::json!({"llm_base_url": "http://127.0.0.1.evil.example/v1"}),
        serde_json::json!({"llm_base_url": "http://127.attacker.example/v1"}),
        // Non-loopback IPs over plain http are rejected too.
        serde_json::json!({"llm_base_url": "http://192.168.1.10/v1"}),
    ] {
        assert_eq!(
            put(app.clone(), bad).await.status(),
            StatusCode::BAD_REQUEST
        );
    }

    // Plain http IS allowed to parsed loopback IPs and localhost.
    for good in [
        serde_json::json!({"llm_base_url": "http://127.0.0.1:8080/v1", "llm_api_key": null}),
        serde_json::json!({"llm_base_url": "http://localhost:11434", "llm_api_key": null}),
        serde_json::json!({"llm_base_url": "http://[::1]:8080/v1", "llm_api_key": null}),
    ] {
        assert_eq!(put(app.clone(), good).await.status(), StatusCode::OK);
    }

    // Save endpoint + key.
    let resp = put(
        app.clone(),
        serde_json::json!({
            "llm_base_url": "https://api.openai.com/v1",
            "llm_api_key": "sk-super-secret-value",
            "llm_model": "gpt-4o-mini"
        }),
    )
    .await;
    assert_eq!(resp.status(), StatusCode::OK);

    // GET redacts: key-set boolean only, key material nowhere in the body.
    let resp = app
        .clone()
        .oneshot(request(
            "GET",
            "/v1/settings",
            Some(tenant),
            "alice",
            Some("tenant_admin"),
            None,
        ))
        .await
        .unwrap();
    let raw = String::from_utf8(
        axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap()
            .to_vec(),
    )
    .unwrap();
    assert!(raw.contains("\"llm_api_key_set\":true"));
    assert!(!raw.contains("sk-super-secret-value"));

    // Audit shows the change but never the key.
    let resp = app
        .clone()
        .oneshot(request(
            "GET",
            "/v1/audit",
            Some(tenant),
            "alice",
            Some("tenant_admin"),
            None,
        ))
        .await
        .unwrap();
    let raw = String::from_utf8(
        axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap()
            .to_vec(),
    )
    .unwrap();
    assert!(raw.contains("settings.update"));
    assert!(raw.contains("api_key_updated"));
    assert!(!raw.contains("sk-super-secret-value"));

    // A claim resolves the decrypted key for the worker (internal only).
    let resp = app
        .clone()
        .oneshot(request(
            "POST",
            "/v1/sessions",
            Some(tenant),
            "alice",
            None,
            None,
        ))
        .await
        .unwrap();
    let session_id = json_body(resp).await["id"].as_str().unwrap().to_string();
    let resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri(format!("/v1/internal/sessions/{session_id}/claim"))
                .header("x-internal-token", "test-internal-secret")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let body = json_body(resp).await;
    assert_eq!(
        body["settings"]["llm_base_url"],
        "https://api.openai.com/v1"
    );
    assert_eq!(body["settings"]["llm_api_key"], "sk-super-secret-value");

    // PUT without the key keeps it (URL resent: full-replacement
    // semantics); PUT with "" clears it.
    let resp = put(
        app.clone(),
        serde_json::json!({
            "stt_language": "da",
            "llm_base_url": "https://api.openai.com/v1",
        }),
    )
    .await;
    assert_eq!(resp.status(), StatusCode::OK);
    let resp = app
        .clone()
        .oneshot(request(
            "GET",
            "/v1/settings",
            Some(tenant),
            "alice",
            Some("tenant_admin"),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(json_body(resp).await["llm_api_key_set"], true);
    let resp = put(app.clone(), serde_json::json!({"llm_api_key": ""})).await;
    assert_eq!(resp.status(), StatusCode::OK);
    let resp = app
        .clone()
        .oneshot(request(
            "GET",
            "/v1/settings",
            Some(tenant),
            "alice",
            Some("tenant_admin"),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(json_body(resp).await["llm_api_key_set"], false);
}

// Changing the endpoint while a key is stored must not silently send the
// old secret to the new server: require an explicit key replacement or
// clear-and-save.
#[tokio::test]
async fn changing_endpoint_requires_explicit_key_decision() {
    let app = build_router(AppState::in_memory(Config::test_with_internal_token(
        "test-internal-secret",
    )));
    let tenant = TenantId::new();
    let put = |app: axum::Router, body: serde_json::Value| async move {
        app.oneshot(request(
            "PUT",
            "/v1/settings",
            Some(tenant),
            "alice",
            Some("tenant_admin"),
            Some(body),
        ))
        .await
        .unwrap()
    };

    // Endpoint + key stored.
    let resp = put(
        app.clone(),
        serde_json::json!({
            "llm_base_url": "https://provider-a.example/v1",
            "llm_api_key": "sk-provider-a",
        }),
    )
    .await;
    assert_eq!(resp.status(), StatusCode::OK);

    // URL change without a key decision is rejected (and the Danish
    // message names the required action).
    let resp = put(
        app.clone(),
        serde_json::json!({"llm_base_url": "https://provider-b.example/v1"}),
    )
    .await;
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let raw = String::from_utf8(
        axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap()
            .to_vec(),
    )
    .unwrap();
    assert!(raw.contains("endpointet"));

    // Clearing the endpoint while keeping the key is rejected the same way.
    let resp = put(app.clone(), serde_json::json!({"llm_model": "x"})).await;
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);

    // Explicit replacement is allowed and updates both.
    let resp = put(
        app.clone(),
        serde_json::json!({
            "llm_base_url": "https://provider-b.example/v1",
            "llm_api_key": "sk-provider-b",
        }),
    )
    .await;
    assert_eq!(resp.status(), StatusCode::OK);

    // Explicit clear-and-save is allowed and drops the stored key.
    let resp = put(
        app.clone(),
        serde_json::json!({
            "llm_base_url": "https://provider-c.example/v1",
            "llm_api_key": "",
        }),
    )
    .await;
    assert_eq!(resp.status(), StatusCode::OK);
    let resp = app
        .clone()
        .oneshot(request(
            "GET",
            "/v1/settings",
            Some(tenant),
            "alice",
            Some("tenant_admin"),
            None,
        ))
        .await
        .unwrap();
    let body = json_body(resp).await;
    assert_eq!(body["llm_base_url"], "https://provider-c.example/v1");
    assert_eq!(body["llm_api_key_set"], false);

    // No stored key: changing the endpoint freely is fine.
    let resp = put(
        app.clone(),
        serde_json::json!({"llm_base_url": "https://provider-d.example/v1"}),
    )
    .await;
    assert_eq!(resp.status(), StatusCode::OK);
}

// ----- Query footprints (PRD: compliance logger tracks query footprints) -----

#[tokio::test]
async fn worker_footprints_land_in_the_session_tenants_audit_log() {
    let app = build_router(AppState::in_memory(Config::test_with_internal_token(
        "test-internal-secret",
    )));
    let tenant = TenantId::new();

    // Create + claim a session like the dispatch loop does.
    let resp = app
        .clone()
        .oneshot(request(
            "POST",
            "/v1/sessions",
            Some(tenant),
            "caller",
            None,
            None,
        ))
        .await
        .unwrap();
    let session_id = json_body(resp).await["id"].as_str().unwrap().to_string();

    // The internal route rejects callers without the internal token.
    let resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri(format!("/v1/internal/sessions/{session_id}/footprint"))
                .header("content-type", "application/json")
                .body(Body::from(
                    serde_json::to_string(&serde_json::json!({
                        "question": "hvordan genstarter jeg printeren?",
                        "citations": ["printer-runbook.md"],
                        "answered": true
                    }))
                    .unwrap(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);

    // A real worker report lands as a session.query audit event.
    let resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri(format!("/v1/internal/sessions/{session_id}/footprint"))
                .header("x-internal-token", "test-internal-secret")
                .header("x-worker-id", "worker-7")
                .header("content-type", "application/json")
                .body(Body::from(
                    serde_json::to_string(&serde_json::json!({
                        "question": "hvordan genstarter jeg printeren?",
                        "citations": ["printer-runbook.md"],
                        "answered": true
                    }))
                    .unwrap(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::CREATED);

    let resp = app
        .clone()
        .oneshot(request(
            "GET",
            "/v1/audit",
            Some(tenant),
            "alice",
            Some("tenant_admin"),
            None,
        ))
        .await
        .unwrap();
    let body = json_body(resp).await;
    let event = body
        .as_array()
        .unwrap()
        .iter()
        .find(|e| e["action"] == "session.query")
        .expect("footprint audit event");
    assert_eq!(event["actor"], "worker:worker-7");
    assert_eq!(event["target"], session_id);
    assert_eq!(
        event["detail"]["question"],
        "hvordan genstarter jeg printeren?"
    );
    assert_eq!(event["detail"]["citations"][0], "printer-runbook.md");
    assert_eq!(event["detail"]["answered"], true);

    // Unknown session -> 404, and another tenant's audit log shows nothing.
    let resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri(format!(
                    "/v1/internal/sessions/{}/footprint",
                    uuid::Uuid::new_v4()
                ))
                .header("x-internal-token", "test-internal-secret")
                .header("content-type", "application/json")
                .body(Body::from(
                    serde_json::to_string(&serde_json::json!({
                        "question": "q", "citations": [], "answered": false
                    }))
                    .unwrap(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::NOT_FOUND);

    let other = TenantId::new();
    let resp = app
        .clone()
        .oneshot(request(
            "GET",
            "/v1/audit",
            Some(other),
            "alice",
            Some("tenant_admin"),
            None,
        ))
        .await
        .unwrap();
    let raw = String::from_utf8(
        axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap()
            .to_vec(),
    )
    .unwrap();
    assert!(!raw.contains("session.query"));
}

#[tokio::test]
async fn footprint_fields_are_capped_defensively() {
    let app = build_router(AppState::in_memory(Config::test_with_internal_token(
        "test-internal-secret",
    )));
    let tenant = TenantId::new();
    let resp = app
        .clone()
        .oneshot(request(
            "POST",
            "/v1/sessions",
            Some(tenant),
            "caller",
            None,
            None,
        ))
        .await
        .unwrap();
    let session_id = json_body(resp).await["id"].as_str().unwrap().to_string();

    let long_question = "x".repeat(5000);
    let citations: Vec<String> = (0..50).map(|i| format!("doc-{i}")).collect();
    let resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri(format!("/v1/internal/sessions/{session_id}/footprint"))
                .header("x-internal-token", "test-internal-secret")
                .header("content-type", "application/json")
                .body(Body::from(
                    serde_json::to_string(&serde_json::json!({
                        "question": long_question,
                        "citations": citations,
                        "answered": true
                    }))
                    .unwrap(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::CREATED);

    let resp = app
        .clone()
        .oneshot(request(
            "GET",
            "/v1/audit",
            Some(tenant),
            "alice",
            Some("tenant_admin"),
            None,
        ))
        .await
        .unwrap();
    let body = json_body(resp).await;
    let event = body
        .as_array()
        .unwrap()
        .iter()
        .find(|e| e["action"] == "session.query")
        .unwrap();
    assert_eq!(event["detail"]["question"].as_str().unwrap().len(), 500);
    assert_eq!(event["detail"]["citations"].as_array().unwrap().len(), 20);
}

#[tokio::test]
async fn llm_test_connection_uses_stored_key_server_side() {
    let (base_url, mut rx) = stub_llm_endpoint().await;
    let app = build_router(AppState::in_memory(Config::test_with_internal_token(
        "test-internal-secret",
    )));
    let tenant = TenantId::new();
    let resp = app
        .clone()
        .oneshot(request(
            "PUT",
            "/v1/settings",
            Some(tenant),
            "alice",
            Some("tenant_admin"),
            Some(serde_json::json!({
                "llm_base_url": base_url,
                "llm_api_key": "sk-stub-key"
            })),
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);

    let resp = app
        .clone()
        .oneshot(request(
            "POST",
            "/v1/settings/llm/test",
            Some(tenant),
            "alice",
            Some("tenant_admin"),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    assert_eq!(json_body(resp).await["ok"], true);
    // The stub saw the stored key as a bearer token.
    let auth = rx.recv().await.unwrap();
    assert_eq!(auth.as_deref(), Some("Bearer sk-stub-key"));

    // End users cannot trigger outbound calls.
    let resp = app
        .oneshot(request(
            "POST",
            "/v1/settings/llm/test",
            Some(tenant),
            "bob",
            None,
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

// ----- OIDC mode: bearer tokens replace dev headers -----

const OIDC_TENANT: &str = "3f6b1c2e-0000-4000-8000-abcdefabcdef";
const OIDC_ISSUER: &str = "https://login.example.test/tenant/v2.0";
const OIDC_AUDIENCE: &str = "api://nordsvar";

/// Test-only RSA key pair (generated for these tests, never used elsewhere).
const OIDC_PRIVATE_KEY: &str = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC2YikE3caZQ8uj\nn5brbUC1GkvSXuLXXBLN2sZPZHRx5mFz6BD541alc7LtqRIzqscOzlJDZ+xNPz9V\nW+e9R31RcY00i7uZS8G64KqvK5bfyqCrLZdeDCc1d6lDtx0i8uDJOTg78lnL7u6l\neVWX1lFPRBJfEFw85F+5DGsRFU3Q0lasTazXavfsJOwNnxJSmDL0pC3C7pcvDTQr\n9iRzJoSKpEQDa6yC9pHddx73g1/EQFjfItOjUCYVxeCIVMHsNZsGRr3HfCNF5LK2\n5RhItKwMqE6X2ge/nY6fmNBxnNKnZJ9akjpZ/h3Ofhmdt/V47Ix7a22RkqN0O4vL\no5CZgzNxAgMBAAECggEALEsgG6SxygCfSPRl7nS42ZLSlbuCG1vq3DA058ylhBD3\nm3LhhpK59RIpgxMDzuT7lYKxk1m+l48T9krM99jQHFK3wKpr6+GsYdKU2Vh8eorH\nJPN8VrScZB2Uz9N9ocJ7KZt6JwLnYIH9VtYmHatI0Xeef5RlVkt/XN1hdkNmg99c\nN2H+AhXG2Z+veIsnVErwpOr5KxGvq95fQbYtyOywiw1w0iqOWb4Ww+o/z9VTWDOr\n/vyRdK2BDaD17OLGfVI/hmn8AZWTWgDPzAvJdW9EZeU1cMvmxoJ1snBRZzFShi92\nsiv2HzDnVAGiplDzxrAF+PTaygU44GmlkBtvg2MOnQKBgQDpLdaeeDWTB0GJEbdo\n2uGg48SoxSd8w8FI9NA4kXCW/jzg9zX5LlbX0GA00HDCVhsEWuY+JWdaEhnHvYaL\ngrjeejkCz+WrETZCjP8xZHNbvpVABsw4azJDXHybc5VuV4TQ3HgPIXNCROEPcRwX\nFcsd+wOeEEo/OO5mJhbstS8PzQKBgQDIO6sHqd7uOf494MwLH6frPCRINFd4lUic\nitK52qqLe7d+AtjDAwmwdPPzt6Wzt+6JQhG8kYVJ0p+P92pyxkPce9EFl7h9GBfY\nVtgOsDoortffrVYlujhgTEIA3P8RnXHI3Ga7n03MMt4yxHtxBUEhif+c/JBbncvq\nPVocGp6mNQKBgHIO2vFPCZ2uqe7bPKTMlBs37oVDUupjcpM2NPfGpJUnLS45niwR\n76bHJZgP8WgN6E88C22QrDpRqkyat0pcmgMxM9vdR5Fi7PCmuVk2snrJAYZ9DL34\nKXDrt4PuiMSdiLkFbrCwAwoCWThNcpkULvOuSfmyLC86sNpEfWgxxCBtAoGAIBSP\nPlcVBI3+EePmTRHxUVr9ZSQdr5AbZhlH0cca8+YKbAIAwJ3H+6GBRFb0EWsyqIMR\nXGjkNgOs1OALCgCB9t1Pi9nXERO/HkYrr47EgqggphGbb8f6KFOPb5v4sdXL2SaW\nvxCy4jh0KSYZsO3qlXkKnxhH+KW7efgCa+ZH7NECgYEAy8acugkBUKmVCEVUiO/w\nHP1DgCVqrXHnbw/XI5L5BpJt1wrGjptW3/cxJZ0xgELdOZu/VEymmrLY9s/wkhxo\njjIyHiGExGiIaQC0LUS+zc64IzlCpNI6mqQg9UIwhtsLwcxQL038dvbqrqPX6mQ2\nlG4J1wFslt2Y6R7SbBTusho=\n-----END PRIVATE KEY-----";
const OIDC_JWKS: &str = r#"{"keys":[{"kty":"RSA","use":"sig","kid":"test-key-1","alg":"RS256","n":"tmIpBN3GmUPLo5-W621AtRpL0l7i11wSzdrGT2R0ceZhc-gQ-eNWpXOy7akSM6rHDs5SQ2fsTT8_VVvnvUd9UXGNNIu7mUvBuuCqryuW38qgqy2XXgwnNXepQ7cdIvLgyTk4O_JZy-7upXlVl9ZRT0QSXxBcPORfuQxrERVN0NJWrE2s12r37CTsDZ8SUpgy9KQtwu6XLw00K_YkcyaEiqREA2usgvaR3Xce94NfxEBY3yLTo1AmFcXgiFTB7DWbBka9x3wjReSytuUYSLSsDKhOl9oHv52On5jQcZzSp2SfWpI6Wf4dzn4Znbf1eOyMe2ttkZKjdDuLy6OQmYMzcQ","e":"AQAB"}]}"#;

struct StaticJwks;

#[async_trait::async_trait]
impl nordsvar_api::oidc::JwksSource for StaticJwks {
    async fn fetch(&self) -> Result<jsonwebtoken::jwk::JwkSet, String> {
        serde_json::from_str(OIDC_JWKS).map_err(|e| e.to_string())
    }
}

fn oidc_app() -> axum::Router {
    let config = nordsvar_api::oidc::OidcConfig {
        issuer: OIDC_ISSUER.into(),
        audience: OIDC_AUDIENCE.into(),
        jwks_url: "https://login.example.test/jwks".into(),
        tenant_claim: "tid".into(),
        groups_claim: "groups".into(),
        agent_group: Some("nordsvar-agents".into()),
        admin_group: Some("nordsvar-admins".into()),
    };
    let validator = std::sync::Arc::new(nordsvar_api::oidc::OidcValidator::new(
        config.clone(),
        std::sync::Arc::new(StaticJwks),
    ));
    build_router(AppState::in_memory_with_oidc(
        Config::test_oidc(config),
        validator,
    ))
}

fn oidc_token(claims: serde_json::Value) -> String {
    let mut header = jsonwebtoken::Header::new(jsonwebtoken::Algorithm::RS256);
    header.kid = Some("test-key-1".into());
    jsonwebtoken::encode(
        &header,
        &claims,
        &jsonwebtoken::EncodingKey::from_rsa_pem(OIDC_PRIVATE_KEY.as_bytes()).unwrap(),
    )
    .unwrap()
}

fn oidc_claims() -> serde_json::Value {
    json!({
        "sub": "user-123",
        "tid": OIDC_TENANT,
        "iss": OIDC_ISSUER,
        "aud": OIDC_AUDIENCE,
        "exp": 4_000_000_000_i64,
        "groups": ["nordsvar-agents"],
    })
}

#[tokio::test]
async fn oidc_mode_accepts_valid_bearer_token() {
    let app = oidc_app();
    let req = Request::builder()
        .method("GET")
        .uri("/v1/sessions")
        .header(
            "authorization",
            format!("Bearer {}", oidc_token(oidc_claims())),
        )
        .body(Body::empty())
        .unwrap();
    let resp = app.oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
}

#[tokio::test]
async fn oidc_mode_ignores_dev_headers() {
    let app = oidc_app();
    let req = Request::builder()
        .method("GET")
        .uri("/v1/sessions")
        .header("x-tenant-id", OIDC_TENANT)
        .header("x-actor-id", "user-123")
        .body(Body::empty())
        .unwrap();
    let resp = app.oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn oidc_mode_rejects_bad_signature() {
    let app = oidc_app();
    let mut claims = oidc_claims();
    claims["aud"] = json!("api://other");
    let req = Request::builder()
        .method("GET")
        .uri("/v1/sessions")
        .header("authorization", format!("Bearer {}", oidc_token(claims)))
        .body(Body::empty())
        .unwrap();
    let resp = app.oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

// ----- Store outage: fail closed with 500, never panic or fake success -----

struct FailingStores;

#[async_trait::async_trait]
impl nordsvar_api::store::SessionStore for FailingStores {
    async fn create(
        &self,
        _t: nordsvar_tenancy::TenantId,
        s: nordsvar_api::store::Session,
    ) -> Result<nordsvar_api::store::Session, nordsvar_api::store::StoreError> {
        let _ = s;
        Err(nordsvar_api::store::StoreError::new("connection refused"))
    }
    async fn get(
        &self,
        _t: nordsvar_tenancy::TenantId,
        _id: nordsvar_api::store::SessionId,
    ) -> Result<Option<nordsvar_api::store::Session>, nordsvar_api::store::StoreError> {
        Err(nordsvar_api::store::StoreError::new("connection refused"))
    }
    async fn get_by_id(
        &self,
        _id: nordsvar_api::store::SessionId,
    ) -> Result<Option<nordsvar_api::store::Session>, nordsvar_api::store::StoreError> {
        Err(nordsvar_api::store::StoreError::new("connection refused"))
    }
    async fn end(
        &self,
        _t: nordsvar_tenancy::TenantId,
        _id: nordsvar_api::store::SessionId,
    ) -> Result<Option<nordsvar_api::store::Session>, nordsvar_api::store::StoreError> {
        Err(nordsvar_api::store::StoreError::new("connection refused"))
    }
    async fn list(
        &self,
        _t: nordsvar_tenancy::TenantId,
    ) -> Result<Vec<nordsvar_api::store::Session>, nordsvar_api::store::StoreError> {
        Err(nordsvar_api::store::StoreError::new("connection refused"))
    }
    async fn list_unclaimed(
        &self,
    ) -> Result<Vec<nordsvar_api::store::Session>, nordsvar_api::store::StoreError> {
        Err(nordsvar_api::store::StoreError::new("connection refused"))
    }
    async fn claim(
        &self,
        _id: nordsvar_api::store::SessionId,
        _worker: &str,
    ) -> Result<Option<nordsvar_api::store::Session>, nordsvar_api::store::StoreError> {
        Err(nordsvar_api::store::StoreError::new("connection refused"))
    }
    async fn heartbeat(
        &self,
        _id: nordsvar_api::store::SessionId,
        _worker: &str,
    ) -> Result<bool, nordsvar_api::store::StoreError> {
        Err(nordsvar_api::store::StoreError::new("connection refused"))
    }
}

#[tokio::test]
async fn store_outage_returns_500_not_empty_list() {
    let mut state = AppState::in_memory(Config::test());
    state.sessions = std::sync::Arc::new(FailingStores);
    let app = build_router(state);
    let req = Request::builder()
        .method("GET")
        .uri("/v1/sessions")
        .header("x-tenant-id", TenantId::new().to_string())
        .header("x-actor-id", "alice")
        .header("x-actor-roles", "agent")
        .body(Body::empty())
        .unwrap();
    let resp = app.oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::INTERNAL_SERVER_ERROR);
}

// ---- Embed widget public surface -----------------------------------------
//
// Through the real router: settings are saved and a key generated over
// HTTP, then the public endpoints are exercised with and without an
// allowed Origin.

/// Save embed settings for a fresh tenant and return its public key.
async fn provision_embed_tenant(app: &axum::Router, tenant: TenantId) -> String {
    let put = app
        .clone()
        .oneshot(request(
            "PUT",
            "/v1/settings",
            Some(tenant),
            "admin",
            Some("tenant_admin"),
            Some(json!({
                "llm_model": "", "embed_model": "", "stt_language": "", "llm_base_url": "",
                "embed_enabled": true,
                "embed_allowed_domains": "example.dk",
                "embed_theme_color": "#123456",
                "embed_position": "left",
                "embed_language": "en"
            })),
        ))
        .await
        .unwrap();
    assert_eq!(put.status(), StatusCode::OK);
    let key_resp = app
        .clone()
        .oneshot(request(
            "POST",
            "/v1/settings/embed/key",
            Some(tenant),
            "admin",
            Some("tenant_admin"),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(key_resp.status(), StatusCode::OK);
    json_body(key_resp).await["embed_public_key"]
        .as_str()
        .unwrap()
        .to_string()
}

fn public_request(
    method: &str,
    path: &str,
    origin: Option<&str>,
    body: Option<Value>,
) -> Request<Body> {
    let mut builder = Request::builder().method(method).uri(path);
    if let Some(o) = origin {
        builder = builder.header("origin", o);
    }
    match body {
        Some(v) => builder
            .header("content-type", "application/json")
            .body(Body::from(v.to_string()))
            .unwrap(),
        None => builder.body(Body::empty()).unwrap(),
    }
}

#[tokio::test]
async fn embed_config_serves_allowed_origin_and_rejects_others() {
    let app = app();
    let tenant = TenantId::new();
    let key = provision_embed_tenant(&app, tenant).await;

    // Allowed exact host.
    let resp = app
        .clone()
        .oneshot(public_request(
            "GET",
            &format!("/v1/public/embed/config?key={key}"),
            Some("https://example.dk"),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = json_body(resp).await;
    assert_eq!(body["theme_color"], "#123456");
    assert_eq!(body["position"], "left");
    assert_eq!(body["language"], "en");

    // Subdomain of an allowed domain is allowed.
    let resp = app
        .clone()
        .oneshot(public_request(
            "GET",
            &format!("/v1/public/embed/config?key={key}"),
            Some("https://shop.example.dk"),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);

    // Other domains and a missing Origin are rejected.
    for origin in [Some("https://evil.example.com"), None] {
        let resp = app
            .clone()
            .oneshot(public_request(
                "GET",
                &format!("/v1/public/embed/config?key={key}"),
                origin,
                None,
            ))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::FORBIDDEN);
    }

    // An unknown key never reveals whether it exists.
    let resp = app
        .clone()
        .oneshot(public_request(
            "GET",
            "/v1/public/embed/config?key=pk_0123456789abcdef0123456789abcdef",
            Some("https://example.dk"),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn embed_session_and_message_flow_with_mock_llm() {
    // Tiny one-shot OpenAI-compatible endpoint on loopback.
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let llm_addr = listener.local_addr().unwrap();
    tokio::spawn(async move {
        let (mut socket, _) = listener.accept().await.unwrap();
        use tokio::io::{AsyncReadExt, AsyncWriteExt};
        let mut buf = vec![0u8; 65536];
        let _ = socket.read(&mut buf).await.unwrap();
        // Ollama /api/generate shape (config.llm_url path).
        let body = r#"{"response":"Vi har åbent til 16."}"#;
        let resp = format!(
            "HTTP/1.1 200 OK\r\ncontent-type: application/json\r\ncontent-length: {}\r\nconnection: close\r\n\r\n{}",
            body.len(),
            body
        );
        socket.write_all(resp.as_bytes()).await.unwrap();
    });

    let mut config = Config::test();
    config.llm_url = Some(format!("http://{llm_addr}"));
    let app = build_router(AppState::in_memory(config));
    let tenant = TenantId::new();
    let key = provision_embed_tenant(&app, tenant).await;

    let resp = app
        .clone()
        .oneshot(public_request(
            "POST",
            "/v1/public/embed/session",
            Some("https://example.dk"),
            Some(json!({ "key": key })),
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::CREATED);
    let session_id = json_body(resp).await["session_id"]
        .as_str()
        .unwrap()
        .to_string();

    let resp = app
        .clone()
        .oneshot(public_request(
            "POST",
            "/v1/public/embed/message",
            Some("https://example.dk"),
            Some(json!({ "session_id": session_id, "text": "Hvornår lukker I?" })),
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = json_body(resp).await;
    assert_eq!(body["answer"], "Vi har åbent til 16.");

    // The same session id from a foreign origin is rejected.
    let resp = app
        .clone()
        .oneshot(public_request(
            "POST",
            "/v1/public/embed/message",
            Some("https://evil.example.com"),
            Some(json!({ "session_id": session_id, "text": "hello" })),
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn guest_join_rejects_garbage_and_expired_tokens() {
    let app = app();
    for token in ["not-a-jwt", "aaa.bbb.ccc"] {
        let resp = app
            .clone()
            .oneshot(public_request(
                "POST",
                "/v1/public/guest-join",
                None,
                Some(json!({ "token": token })),
            ))
            .await
            .unwrap();
        assert!(
            resp.status() == StatusCode::UNAUTHORIZED || resp.status() == StatusCode::BAD_REQUEST,
            "token {token}: got {}",
            resp.status()
        );
    }
}

#[tokio::test]
async fn share_link_roundtrip_joins_the_same_room() {
    let app = app();
    let tenant = TenantId::new();
    // Agent creates a session through the normal API.
    let resp = app
        .clone()
        .oneshot(request(
            "POST",
            "/v1/sessions",
            Some(tenant),
            "agent-1",
            Some("agent"),
            Some(json!({ "display_name": "Agent" })),
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::CREATED);
    let session = json_body(resp).await;
    let session_id = session["id"].as_str().unwrap().to_string();

    // Agent mints a share link.
    let resp = app
        .clone()
        .oneshot(request(
            "POST",
            &format!("/v1/sessions/{session_id}/share"),
            Some(tenant),
            "agent-1",
            Some("agent"),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let share = json_body(resp).await;
    let token = share["share_token"].as_str().unwrap().to_string();
    assert!(share["path"]
        .as_str()
        .unwrap()
        .starts_with(&format!("/s/{session_id}?t=")));

    // The guest exchanges it for a join ticket in the same room.
    let resp = app
        .clone()
        .oneshot(public_request(
            "POST",
            "/v1/public/guest-join",
            None,
            Some(json!({ "token": token, "display_name": "Gæst" })),
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let ticket = json_body(resp).await;
    assert_eq!(ticket["room"], session["room"]);
    assert!(ticket["identity"].as_str().unwrap().starts_with("guest-"));
    assert!(ticket["token"].as_str().unwrap().len() > 20);

    // A viewer role may not mint share links.
    let resp = app
        .clone()
        .oneshot(request(
            "POST",
            &format!("/v1/sessions/{session_id}/share"),
            Some(tenant),
            "viewer-1",
            Some("viewer"),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}
