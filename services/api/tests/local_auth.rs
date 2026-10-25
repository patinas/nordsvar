//! HTTP-level tests for local auth (AUTH_MODE=local): first-run setup,
//! login, bearer sessions, and tenant isolation.

use axum::body::{to_bytes, Body};
use axum::http::{Request, StatusCode};
use nordsvar_api::app::{build_router, AppState};
use nordsvar_api::config::{AuthMode, Config};
use serde_json::{json, Value};
use tower::ServiceExt;

fn local_config() -> Config {
    let mut config = Config::test();
    config.auth_mode = AuthMode::Local;
    config
}

fn app() -> axum::Router {
    build_router(AppState::in_memory(local_config()))
}

fn json_request(
    method: &str,
    path: &str,
    body: Option<Value>,
    bearer: Option<&str>,
) -> Request<Body> {
    let mut builder = Request::builder().method(method).uri(path);
    if let Some(token) = bearer {
        builder = builder.header("authorization", format!("Bearer {token}"));
    }
    match body {
        Some(v) => builder
            .header("content-type", "application/json")
            .body(Body::from(v.to_string()))
            .unwrap(),
        None => builder.body(Body::empty()).unwrap(),
    }
}

async fn body_json(resp: axum::response::Response) -> Value {
    let bytes = to_bytes(resp.into_body(), 1 << 20).await.unwrap();
    serde_json::from_slice(&bytes).unwrap_or(Value::Null)
}

const PASSWORD: &str = "lang-nok-adgangskode";

async fn setup_first_admin(app: &axum::Router) -> Value {
    let resp = app
        .clone()
        .oneshot(json_request(
            "POST",
            "/v1/setup/admin",
            Some(json!({ "username": "admin", "password": PASSWORD })),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::CREATED);
    body_json(resp).await
}

#[tokio::test]
async fn setup_status_flows_from_needed_to_done() {
    let app = app();
    let resp = app
        .clone()
        .oneshot(json_request("GET", "/v1/setup/status", None, None))
        .await
        .unwrap();
    assert_eq!(body_json(resp).await["needs_setup"], true);

    setup_first_admin(&app).await;

    let resp = app
        .oneshot(json_request("GET", "/v1/setup/status", None, None))
        .await
        .unwrap();
    assert_eq!(body_json(resp).await["needs_setup"], false);
}

#[tokio::test]
async fn setup_admin_returns_working_token_and_generated_tenant() {
    let app = app();
    let body = setup_first_admin(&app).await;
    assert!(body["tenant"].as_str().unwrap().len() == 36);
    assert_eq!(body["username"], "admin");
    assert_eq!(body["roles"], json!(["tenant_admin"]));
    let token = body["token"].as_str().unwrap();

    // The returned token authenticates against a protected route.
    let resp = app
        .oneshot(json_request("GET", "/v1/sessions", None, Some(token)))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
}

#[tokio::test]
async fn setup_closes_permanently_after_first_admin() {
    let app = app();
    setup_first_admin(&app).await;
    let resp = app
        .oneshot(json_request(
            "POST",
            "/v1/setup/admin",
            Some(json!({ "username": "anden", "password": PASSWORD })),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::CONFLICT);
}

#[tokio::test]
async fn login_roundtrip_and_bad_password_is_unauthorized() {
    let app = app();
    let setup = setup_first_admin(&app).await;
    let tenant = setup["tenant"].as_str().unwrap();

    let resp = app
        .clone()
        .oneshot(json_request(
            "POST",
            "/v1/auth/login",
            Some(
                json!({ "tenant_id": tenant, "username": "admin", "password": "forkert-kode-ord" }),
            ),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);

    let resp = app
        .oneshot(json_request(
            "POST",
            "/v1/auth/login",
            Some(json!({ "tenant_id": tenant, "username": "admin", "password": PASSWORD })),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    assert!(body_json(resp).await["token"].as_str().unwrap().len() == 64);
}

#[tokio::test]
async fn unknown_user_gets_same_unauthorized() {
    let app = app();
    setup_first_admin(&app).await;
    let resp = app
        .oneshot(json_request(
            "POST",
            "/v1/auth/login",
            Some(json!({ "tenant_id": nordsvar_tenancy::TenantId::new().to_string(), "username": "admin", "password": PASSWORD })),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn protected_routes_reject_missing_or_bogus_bearer() {
    let app = app();
    setup_first_admin(&app).await;
    let resp = app
        .clone()
        .oneshot(json_request("GET", "/v1/sessions", None, None))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
    let resp = app
        .oneshot(json_request("GET", "/v1/sessions", None, Some("vaerk")))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn admin_creates_agent_who_can_log_in() {
    let app = app();
    let setup = setup_first_admin(&app).await;
    let tenant = setup["tenant"].as_str().unwrap().to_string();
    let admin_token = setup["token"].as_str().unwrap().to_string();

    let resp = app
        .clone()
        .oneshot(json_request(
            "POST",
            "/v1/admin/users",
            Some(json!({ "username": "agent.lise", "password": "endnu-en-lang-kode", "role": "agent" })),
            Some(&admin_token),
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::CREATED);

    let resp = app
        .oneshot(json_request(
            "POST",
            "/v1/auth/login",
            Some(json!({ "tenant_id": tenant, "username": "agent.lise", "password": "endnu-en-lang-kode" })),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    assert_eq!(body_json(resp).await["roles"], json!(["agent"]));
}

#[tokio::test]
async fn non_admin_cannot_create_users() {
    let app = app();
    let setup = setup_first_admin(&app).await;
    let tenant = setup["tenant"].as_str().unwrap().to_string();
    let admin_token = setup["token"].as_str().unwrap().to_string();
    app.clone()
        .oneshot(json_request(
            "POST",
            "/v1/admin/users",
            Some(json!({ "username": "bruger1", "password": "lang-adgangskode-1", "role": "end_user" })),
            Some(&admin_token),
        ))
        .await
        .unwrap();
    let login = app
        .clone()
        .oneshot(json_request(
            "POST",
            "/v1/auth/login",
            Some(json!({ "tenant_id": tenant, "username": "bruger1", "password": "lang-adgangskode-1" })),
            None,
        ))
        .await
        .unwrap();
    let user_token = body_json(login).await["token"]
        .as_str()
        .unwrap()
        .to_string();

    let resp = app
        .oneshot(json_request(
            "POST",
            "/v1/admin/users",
            Some(json!({ "username": "snyd", "password": "lang-adgangskode-2", "role": "tenant_admin" })),
            Some(&user_token),
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn short_password_and_bad_username_rejected() {
    let app = app();
    let resp = app
        .clone()
        .oneshot(json_request(
            "POST",
            "/v1/setup/admin",
            Some(json!({ "username": "admin", "password": "kort" })),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let resp = app
        .oneshot(json_request(
            "POST",
            "/v1/setup/admin",
            Some(json!({ "username": "med mellemrum", "password": PASSWORD })),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn setup_status_reports_auth_mode() {
    let resp = app()
        .oneshot(json_request("GET", "/v1/setup/status", None, None))
        .await
        .unwrap();
    let body = body_json(resp).await;
    assert_eq!(body["auth_mode"], "local");
    let resp = build_router(AppState::in_memory(Config::test()))
        .oneshot(json_request("GET", "/v1/setup/status", None, None))
        .await
        .unwrap();
    assert_eq!(body_json(resp).await["auth_mode"], "dev");
}

#[tokio::test]
async fn login_without_tenant_works_for_single_tenant_deployment() {
    let app = app();
    setup_first_admin(&app).await;
    // No tenant_id: exactly one tenant has users, so login resolves it.
    let resp = app
        .oneshot(json_request(
            "POST",
            "/v1/auth/login",
            Some(json!({ "username": "admin", "password": PASSWORD })),
            None,
        ))
        .await
        .unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
}

#[tokio::test]
async fn setup_endpoints_hidden_in_dev_mode() {
    let resp = build_router(AppState::in_memory(Config::test()))
        .oneshot(json_request("GET", "/v1/setup/status", None, None))
        .await
        .unwrap();
    assert_eq!(body_json(resp).await["needs_setup"], false);
}
