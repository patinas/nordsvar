//! Concurrency and latency suite: hammers the in-process router with
//! parallel tenants and asserts correctness under contention (no cross-
//! tenant bleed, no claim double-wins) plus a generous latency ceiling
//! (in-process transport; the network budget is validated by the browser
//! E2E suite).

use axum::body::Body;
use axum::http::{Request, StatusCode};
use nordsvar_api::app::{build_router, AppState};
use nordsvar_api::config::Config;
use nordsvar_tenancy::TenantId;
use std::time::{Duration, Instant};
use tower::ServiceExt;

fn auth_request(method: &str, path: &str, tenant: TenantId, actor: &str) -> Request<Body> {
    Request::builder()
        .method(method)
        .uri(path)
        .header("x-tenant-id", tenant.to_string())
        .header("x-actor-id", actor)
        .header("content-type", "application/json")
        .body(Body::from("{}"))
        .unwrap()
}

#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
async fn concurrent_tenants_create_and_join_without_bleed() {
    let app = build_router(AppState::in_memory(Config::test()));
    let tenants: Vec<TenantId> = (0..8).map(|_| TenantId::new()).collect();
    let started = Instant::now();
    let mut latencies = Vec::new();

    let mut handles = Vec::new();
    for (i, tenant) in tenants.iter().enumerate() {
        let app = app.clone();
        let tenant = *tenant;
        handles.push(tokio::spawn(async move {
            let mut local = Vec::new();
            for j in 0..10 {
                let t0 = Instant::now();
                let resp = app
                    .clone()
                    .oneshot(auth_request(
                        "POST",
                        "/v1/sessions",
                        tenant,
                        &format!("user-{i}-{j}"),
                    ))
                    .await
                    .unwrap();
                assert_eq!(resp.status(), StatusCode::CREATED);
                let bytes = axum::body::to_bytes(resp.into_body(), 1 << 20)
                    .await
                    .unwrap();
                let body: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
                let id = body["id"].as_str().unwrap().to_string();

                let resp = app
                    .clone()
                    .oneshot(auth_request(
                        "POST",
                        &format!("/v1/sessions/{id}/join"),
                        tenant,
                        &format!("user-{i}-{j}"),
                    ))
                    .await
                    .unwrap();
                assert_eq!(resp.status(), StatusCode::OK);
                let bytes = axum::body::to_bytes(resp.into_body(), 1 << 20)
                    .await
                    .unwrap();
                let join: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
                // Token metadata must bind to the requesting tenant.
                let token = join["token"].as_str().unwrap();
                let claims =
                    nordsvar_api::livekit_token::verify_join_token("testsecret", token).unwrap();
                let meta: nordsvar_api::livekit_token::ParticipantMetadata =
                    serde_json::from_str(&claims.metadata.unwrap()).unwrap();
                assert_eq!(meta.tenant_id, tenant, "tenant bleed detected");
                local.push(t0.elapsed());
            }
            local
        }));
    }
    for h in handles {
        latencies.extend(h.await.unwrap());
    }

    let elapsed = started.elapsed();
    latencies.sort();
    let p99 = latencies[(latencies.len() as f64 * 0.99) as usize - 1];
    assert_eq!(latencies.len(), 80);
    // Generous ceilings for in-process dev hardware; tighten on the
    // reference rig (docs/ARCHITECTURE.md latency budget).
    assert!(p99 < Duration::from_millis(250), "p99 create+join: {p99:?}");
    assert!(elapsed < Duration::from_secs(10), "total: {elapsed:?}");
    eprintln!(
        "80 create+join pairs in {:?}; p99 pair latency {:?}",
        elapsed, p99
    );
}

#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
async fn concurrent_claims_have_exactly_one_winner() {
    let config = Config::test_with_internal_token("load-test-secret");
    let app = build_router(AppState::in_memory(config));
    let tenant = TenantId::new();

    let resp = app
        .clone()
        .oneshot(auth_request("POST", "/v1/sessions", tenant, "alice"))
        .await
        .unwrap();
    let bytes = axum::body::to_bytes(resp.into_body(), 1 << 20)
        .await
        .unwrap();
    let body: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    let id = body["id"].as_str().unwrap().to_string();

    let mut handles = Vec::new();
    for _ in 0..16 {
        let app = app.clone();
        let id = id.clone();
        handles.push(tokio::spawn(async move {
            app.oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!("/v1/internal/sessions/{id}/claim"))
                    .header("x-internal-token", "load-test-secret")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap()
            .status()
        }));
    }
    let mut ok = 0;
    let mut conflict = 0;
    for h in handles {
        match h.await.unwrap() {
            StatusCode::OK => ok += 1,
            StatusCode::CONFLICT => conflict += 1,
            other => panic!("unexpected status {other}"),
        }
    }
    assert_eq!(ok, 1, "exactly one claim may win");
    assert_eq!(conflict, 15);
}
