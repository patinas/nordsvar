//! Full-stack end-to-end test: the real API served over HTTP, the real
//! worker dispatch loop, and a real LiveKit room. Proves the path a call
//! actually takes: session create -> caller join -> worker claim -> AI
//! joins and hears the caller -> caller hangs up -> AI session ends.
//!
//! Skipped unless LIVEKIT_SERVER_BIN points at a livekit-server binary.
//! Model endpoints (STT/LLM/TTS/embeddings/Qdrant) are deliberately pointed
//! at a dead port: pipeline failures must not stop the media path (that
//! resilience is increment 15 and is exercised here for real).

use nordsvar_ai_core::media::{MediaGateway, SessionDescriptor};
use nordsvar_ai_core::types::{AudioChunk, Utterance};
use nordsvar_ai_worker::dispatch::{dispatch_once, SessionFailures, WorkerConfig};
use nordsvar_api::app::{build_router, AppState};
use nordsvar_api::config::{AuthMode, Config};
use nordsvar_media_livekit::room::LiveKitGateway;
use nordsvar_tenancy::TenantId;
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::Duration;

const API_KEY: &str = "e2ekey";
const API_SECRET: &str = "e2esecret-e2esecret-e2esecret-12";
const INTERNAL_TOKEN: &str = "internal-test-token";

// ---- LiveKit server harness (same shape as media-livekit's e2e) ----

async fn free_port() -> Option<u16> {
    let seed = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .subsec_nanos();
    for i in 0..8u32 {
        let port = 20000 + ((seed.wrapping_add(i * 7919)) % 20000) as u16;
        if let Ok(listener) = std::net::TcpListener::bind(("127.0.0.1", port)) {
            drop(listener);
            return Some(port);
        }
    }
    None
}

struct ServerGuard {
    child: Child,
    _serial: tokio::sync::MutexGuard<'static, ()>,
    port: u16,
}

fn serial_lock() -> &'static tokio::sync::Mutex<()> {
    static LOCK: std::sync::OnceLock<tokio::sync::Mutex<()>> = std::sync::OnceLock::new();
    LOCK.get_or_init(|| tokio::sync::Mutex::new(()))
}

impl Drop for ServerGuard {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

async fn start_server(bin: &str) -> Option<ServerGuard> {
    let serial = serial_lock().lock().await;
    let port = free_port().await?;
    let child = Command::new(bin)
        .args([
            "--dev",
            "--bind",
            "127.0.0.1",
            "--port",
            &port.to_string(),
            "--keys",
            &format!("{API_KEY}: {API_SECRET}"),
        ])
        .stdout(Stdio::null())
        .stderr(if std::env::var("LIVEKIT_DEBUG").is_ok() {
            Stdio::inherit()
        } else {
            Stdio::null()
        })
        .spawn()
        .ok()?;
    let guard = ServerGuard {
        child,
        _serial: serial,
        port,
    };
    for _ in 0..50 {
        if tokio::net::TcpStream::connect(("127.0.0.1", port))
            .await
            .is_ok()
        {
            return Some(guard);
        }
        tokio::time::sleep(Duration::from_millis(200)).await;
    }
    None
}

// ---- Gateway spy: observes what the worker's session loop pulls ----

#[derive(Default)]
struct SpyStats {
    utterances: AtomicUsize,
    closed: AtomicBool,
}

struct SpyGateway {
    inner: LiveKitGateway,
    stats: Arc<SpyStats>,
}

#[async_trait::async_trait]
impl MediaGateway for SpyGateway {
    async fn join(&self, session: &SessionDescriptor) -> Result<(), String> {
        self.inner.join(session).await
    }
    async fn next_utterance(&self) -> Result<Option<Utterance>, String> {
        let next = self.inner.next_utterance().await?;
        match next {
            Some(_) => {
                self.stats.utterances.fetch_add(1, Ordering::SeqCst);
            }
            None => {
                self.stats.closed.store(true, Ordering::SeqCst);
            }
        }
        Ok(next)
    }
    async fn publish_audio(&self, audio: &AudioChunk) -> Result<(), String> {
        self.inner.publish_audio(audio).await
    }
    async fn leave(&self) -> Result<(), String> {
        self.inner.leave().await
    }
}

fn pcm(seconds: f32) -> AudioChunk {
    // A 200 Hz tone at amplitude 3000 (RMS ~2121): speech-like energy the
    // VAD accepts. A constant DC signal is NOT usable here - the Opus
    // codec's high-pass filter removes it on the wire.
    let n = (16_000.0 * seconds) as usize;
    let samples = (0..n)
        .map(|i| (i as f64 * 2.0 * std::f64::consts::PI * 200.0 / 16_000.0).sin())
        .map(|v| (v * 3_000.0) as i16)
        .collect();
    AudioChunk {
        samples,
        sample_rate_hz: 16_000,
    }
}

#[tokio::test]
async fn full_call_path_api_dispatch_media() {
    let Ok(bin) = std::env::var("LIVEKIT_SERVER_BIN") else {
        eprintln!("LIVEKIT_SERVER_BIN unset; skipping fullstack e2e");
        return;
    };
    let Some(server) = start_server(&bin).await else {
        panic!("livekit-server failed to start");
    };
    let livekit_url = format!("ws://127.0.0.1:{}", server.port);

    // The real API, served over real HTTP on a random port.
    let config = Config {
        bind_addr: "127.0.0.1:0".into(),
        livekit_url: livekit_url.clone(),
        livekit_public_url: None,
        turn_url: None,
        turn_username: None,
        turn_credential: None,
        livekit_api_key: API_KEY.into(),
        livekit_api_secret: API_SECRET.into(),
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
    let api_port = listener.local_addr().unwrap().port();
    tokio::spawn(async move {
        axum::serve(listener, build_router(AppState::in_memory(config)))
            .await
            .unwrap();
    });
    let api_url = format!("http://127.0.0.1:{api_port}");
    let client = reqwest::Client::new();
    let tenant = TenantId::new();

    // 1. A caller creates a session and joins it, like the web app does.
    let created: serde_json::Value = client
        .post(format!("{api_url}/v1/sessions"))
        .header("x-tenant-id", tenant.to_string())
        .header("x-actor-id", "caller")
        .json(&serde_json::json!({}))
        .send()
        .await
        .unwrap()
        .error_for_status()
        .unwrap()
        .json()
        .await
        .unwrap();
    let session_id = created["id"].as_str().unwrap();

    let join: serde_json::Value = client
        .post(format!("{api_url}/v1/sessions/{session_id}/join"))
        .header("x-tenant-id", tenant.to_string())
        .header("x-actor-id", "caller")
        .json(&serde_json::json!({ "display_name": "Caller" }))
        .send()
        .await
        .unwrap()
        .error_for_status()
        .unwrap()
        .json()
        .await
        .unwrap();
    assert_eq!(join["livekit_url"].as_str().unwrap(), livekit_url);

    // 2. The worker claims the session and joins as the AI participant.
    let stats = Arc::new(SpyStats::default());
    let spy_stats = stats.clone();
    let worker = WorkerConfig {
        api_url: api_url.clone(),
        internal_token: INTERNAL_TOKEN.into(),
        livekit_url: livekit_url.clone(),
        livekit_api_key: API_KEY.into(),
        livekit_api_secret: API_SECRET.into(),
        stt_url: "http://127.0.0.1:1".into(),
        llm_url: "http://127.0.0.1:1".into(),
        llm_model: "unused".into(),
        tts_url: "http://127.0.0.1:1".into(),
        embed_url: "http://127.0.0.1:1".into(),
        embed_model: "unused".into(),
        qdrant_url: "http://127.0.0.1:1".into(),
        stt_language: "da".into(),
        poll_interval: Duration::from_secs(2),
        worker_id: "test-worker".into(),
    };
    let failures = Arc::new(std::sync::Mutex::new(SessionFailures::default()));
    let claimed = dispatch_once(
        &worker,
        &client,
        move || {
            Arc::new(SpyGateway {
                inner: LiveKitGateway::new(),
                stats: spy_stats.clone(),
            })
        },
        &failures,
    )
    .await
    .expect("dispatch");
    assert_eq!(claimed, 1, "exactly one session should be claimed");

    // The claim is durable: nothing unclaimed remains.
    let unclaimed: Vec<serde_json::Value> = client
        .get(format!("{api_url}/v1/internal/sessions/unclaimed"))
        .header("x-internal-token", INTERNAL_TOKEN)
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert!(unclaimed.is_empty(), "claimed session must not reappear");

    // 3. The caller joins the room and speaks ~3 s of audio (a 200 Hz
    // tone clears the VAD floor; the 700 ms hangover after the last
    // publish closes the utterance).
    let caller = LiveKitGateway::new();
    caller
        .join(&SessionDescriptor {
            room: join["room"].as_str().unwrap().into(),
            join_token: join["token"].as_str().unwrap().into(),
            livekit_url: livekit_url.clone(),
            tenant,
        })
        .await
        .expect("caller join");
    let publisher = tokio::spawn(async move {
        tokio::time::sleep(Duration::from_secs(1)).await;
        for _ in 0..12 {
            caller.publish_audio(&pcm(0.25)).await.expect("publish");
            tokio::time::sleep(Duration::from_millis(50)).await;
        }
        caller
    });

    // The AI must hear at least one utterance through the whole path.
    tokio::time::timeout(Duration::from_secs(20), async {
        while stats.utterances.load(Ordering::SeqCst) == 0 {
            tokio::time::sleep(Duration::from_millis(100)).await;
        }
    })
    .await
    .expect("timed out: no caller utterance reached the AI session");

    // 4. The caller hangs up; the AI's session must end (increment 18)
    // even though every pipeline call is failing against dead endpoints.
    let caller = publisher.await.unwrap();
    caller.leave().await.expect("caller leave");
    tokio::time::timeout(Duration::from_secs(40), async {
        while !stats.closed.load(Ordering::SeqCst) {
            tokio::time::sleep(Duration::from_millis(100)).await;
        }
    })
    .await
    .expect("timed out: AI session did not end after the caller left");
}
