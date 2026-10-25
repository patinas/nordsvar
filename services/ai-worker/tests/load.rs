//! Dispatch-loop load and soak test: many sessions, several competing
//! workers, repeated rounds - all against the real API over HTTP with a
//! fast fake media gateway. Proves under contention what single-session
//! tests cannot: claims stay exactly-once (losers get 409 and move on),
//! nothing is left unclaimed, and repeated rounds neither leak nor stall.
//!
//! No LiveKit needed - this owns the dispatch plane, not media.

use nordsvar_ai_core::media::{MediaGateway, SessionDescriptor};
use nordsvar_ai_core::types::{AudioChunk, Utterance};
use nordsvar_ai_worker::dispatch::{dispatch_once, SessionFailures, WorkerConfig};
use nordsvar_api::app::{build_router, AppState};
use nordsvar_api::config::{AuthMode, Config};
use nordsvar_tenancy::TenantId;
use std::collections::HashSet;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

const INTERNAL_TOKEN: &str = "internal-test-token";

/// Fake gateway: joins instantly, "listens" for 25 ms, ends cleanly.
/// Records every room it serviced so duplicate claims are detectable.
struct FakeGateway {
    delay: Duration,
    serviced: Arc<Mutex<HashSet<String>>>,
}

#[async_trait::async_trait]
impl MediaGateway for FakeGateway {
    async fn join(&self, session: &SessionDescriptor) -> Result<(), String> {
        {
            let mut seen = self.serviced.lock().unwrap();
            assert!(
                seen.insert(session.room.clone()),
                "room {} serviced twice - claim fencing broken",
                session.room
            );
        }
        tokio::time::sleep(self.delay).await;
        Ok(())
    }
    async fn next_utterance(&self) -> Result<Option<Utterance>, String> {
        Ok(None) // caller hung up
    }
    async fn publish_audio(&self, _audio: &AudioChunk) -> Result<(), String> {
        Ok(())
    }
    async fn leave(&self) -> Result<(), String> {
        Ok(())
    }
}

async fn start_api() -> (String, reqwest::Client) {
    let config = Config {
        bind_addr: "127.0.0.1:0".into(),
        livekit_url: "ws://unused.invalid:7880".into(),
        livekit_public_url: None,
        turn_url: None,
        turn_username: None,
        turn_credential: None,
        livekit_api_key: "e2ekey".into(),
        livekit_api_secret: "e2esecret-e2esecret-e2esecret-12".into(),
        token_ttl: Duration::from_secs(900),
        auth_mode: AuthMode::Dev,
        oidc: None,
        internal_token: Some(INTERNAL_TOKEN.into()),
        settings_key: Some([9u8; 32]),
        llm_url: None,
        llm_model: "unused".into(),
        retrieval_min_score: None,
        kb: nordsvar_api::config::KbConfig {
            qdrant_url: None,
            embed_url: "http://ollama.test:11434".into(),
            embed_model: "nomic-embed-text".into(),
        },
    };
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let port = listener.local_addr().unwrap().port();
    tokio::spawn(async move {
        axum::serve(listener, build_router(AppState::in_memory(config)))
            .await
            .unwrap();
    });
    (format!("http://127.0.0.1:{port}"), reqwest::Client::new())
}

fn worker(api_url: &str, id: &str) -> WorkerConfig {
    WorkerConfig {
        api_url: api_url.into(),
        internal_token: INTERNAL_TOKEN.into(),
        livekit_url: "ws://unused.invalid:7880".into(),
        livekit_api_key: "e2ekey".into(),
        livekit_api_secret: "e2esecret-e2esecret-e2esecret-12".into(),
        stt_url: "http://127.0.0.1:1".into(),
        llm_url: "http://127.0.0.1:1".into(),
        llm_model: "unused".into(),
        tts_url: "http://127.0.0.1:1".into(),
        embed_url: "http://127.0.0.1:1".into(),
        embed_model: "unused".into(),
        qdrant_url: "http://127.0.0.1:1".into(),
        stt_language: "da".into(),
        poll_interval: Duration::from_secs(2),
        worker_id: id.into(),
    }
}

async fn create_sessions(
    client: &reqwest::Client,
    api_url: &str,
    tenant: TenantId,
    n: usize,
) -> Vec<String> {
    let mut ids = Vec::with_capacity(n);
    for i in 0..n {
        let created: serde_json::Value = client
            .post(format!("{api_url}/v1/sessions"))
            .header("x-tenant-id", tenant.to_string())
            .header("x-actor-id", format!("caller-{i}"))
            .json(&serde_json::json!({}))
            .send()
            .await
            .unwrap()
            .error_for_status()
            .unwrap()
            .json()
            .await
            .unwrap();
        ids.push(created["id"].as_str().unwrap().to_string());
    }
    ids
}

async fn unclaimed_count(client: &reqwest::Client, api_url: &str) -> usize {
    client
        .get(format!("{api_url}/v1/internal/sessions/unclaimed"))
        .header("x-internal-token", INTERNAL_TOKEN)
        .send()
        .await
        .unwrap()
        .json::<Vec<serde_json::Value>>()
        .await
        .unwrap()
        .len()
}

/// Wait until the spawned session tasks have serviced every claimed room.
async fn wait_serviced(serviced: &Arc<Mutex<HashSet<String>>>, expect_total: usize) {
    let deadline = Instant::now() + Duration::from_secs(30);
    loop {
        if serviced.lock().unwrap().len() >= expect_total {
            return;
        }
        assert!(
            Instant::now() < deadline,
            "sessions stalled: {expect_total} expected"
        );
        tokio::time::sleep(Duration::from_millis(50)).await;
    }
}

/// Load: 64 sessions across 2 tenants, 4 workers racing to claim.
/// Every session is claimed exactly once and serviced; none left behind.
#[tokio::test]
async fn competing_workers_claim_each_session_exactly_once_under_load() {
    let (api_url, client) = start_api().await;
    let tenant_a = TenantId::new();
    let tenant_b = TenantId::new();
    create_sessions(&client, &api_url, tenant_a, 32).await;
    create_sessions(&client, &api_url, tenant_b, 32).await;

    let serviced = Arc::new(Mutex::new(HashSet::new()));
    let total_claimed = Arc::new(AtomicUsize::new(0));
    let mut handles = Vec::new();
    let failures = Arc::new(Mutex::new(SessionFailures::default()));
    for w in 0..4 {
        let cfg = worker(&api_url, &format!("worker-{w}"));
        let client = client.clone();
        let failures = failures.clone();
        let serviced = serviced.clone();
        let total_claimed = total_claimed.clone();
        handles.push(tokio::spawn(async move {
            let claimed = dispatch_once(
                &cfg,
                &client,
                move || {
                    Arc::new(FakeGateway {
                        delay: Duration::from_millis(25),
                        serviced: serviced.clone(),
                    })
                },
                &failures,
            )
            .await
            .expect("dispatch");
            total_claimed.fetch_add(claimed, Ordering::SeqCst);
        }));
    }
    for h in handles {
        h.await.unwrap();
    }

    assert_eq!(total_claimed.load(Ordering::SeqCst), 64);
    assert_eq!(unclaimed_count(&client, &api_url).await, 0);
    wait_serviced(&serviced, 64).await;
    assert_eq!(serviced.lock().unwrap().len(), 64);
}

/// Soak: 8 rounds of 16 fresh sessions with 2 persistent workers. Each
/// round must fully drain; the assertion budget catches slowdowns and the
/// room set catches any cross-round duplication.
#[tokio::test]
async fn repeated_rounds_drain_fully_without_leaks_or_stalls() {
    let (api_url, client) = start_api().await;
    let tenant = TenantId::new();
    let serviced = Arc::new(Mutex::new(HashSet::new()));
    let start = Instant::now();

    let failures = Arc::new(Mutex::new(SessionFailures::default()));
    for round in 0..8 {
        create_sessions(&client, &api_url, tenant, 16).await;
        let mut claimed_total = 0;
        for w in 0..2 {
            let cfg = worker(&api_url, &format!("soak-worker-{w}"));
            let serviced = serviced.clone();
            claimed_total += dispatch_once(
                &cfg,
                &client,
                move || {
                    Arc::new(FakeGateway {
                        delay: Duration::from_millis(10),
                        serviced: serviced.clone(),
                    })
                },
                &failures,
            )
            .await
            .expect("dispatch");
        }
        assert_eq!(claimed_total, 16, "round {round} left sessions unclaimed");
        assert_eq!(unclaimed_count(&client, &api_url).await, 0);
    }

    wait_serviced(&serviced, 128).await;
    assert_eq!(
        serviced.lock().unwrap().len(),
        128,
        "duplicate or lost rooms"
    );
    assert!(
        start.elapsed() < Duration::from_secs(30),
        "soak budget exceeded: {:?}",
        start.elapsed()
    );
}
