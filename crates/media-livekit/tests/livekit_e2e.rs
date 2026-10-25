//! End-to-end test against a real LiveKit server binary. Skipped unless
//! LIVEKIT_SERVER_BIN points at a `livekit-server` executable (CI's
//! livekit-e2e job downloads one). This is the proof that the media
//! adapter actually joins rooms, publishes audio, and receives the other
//! participant's track - the scripted gateway cannot prove any of that.

use nordsvar_ai_core::media::{MediaGateway, SessionDescriptor};
use nordsvar_ai_core::types::AudioChunk;
use nordsvar_media_livekit::room::LiveKitGateway;
use nordsvar_tenancy::TenantId;
use std::process::{Child, Command, Stdio};
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

const API_KEY: &str = "e2ekey";
const API_SECRET: &str = "e2esecret-e2esecret-e2esecret-12";

/// A shared build machine can have a leftover server holding a fixed
/// port. Probe a random high port before spawning and retry a few times.
async fn free_port() -> Option<u16> {
    use std::time::{SystemTime, UNIX_EPOCH};
    let seed = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos();
    for i in 0..8u32 {
        let port = 20000 + ((seed.wrapping_add(i * 7919)) % 20000) as u16;
        // A port we can bind and immediately release is very likely free.
        if let Ok(listener) = std::net::TcpListener::bind(("127.0.0.1", port)) {
            drop(listener);
            return Some(port);
        }
    }
    None
}

struct ServerGuard {
    child: Child,
    /// Held for the whole test: one livekit-server instance at a time.
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

/// Spawn livekit-server in dev mode and wait for the signaling port.
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

/// Mint a LiveKit join token (HS256), same shape the API mints.
fn mint_token(room: &str, identity: &str, tenant: TenantId) -> String {
    #[derive(serde::Serialize)]
    struct VideoGrant {
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
        exp: u64,
        nbf: u64,
        video: VideoGrant,
        metadata: String,
    }
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let claims = Claims {
        iss: API_KEY.into(),
        sub: identity.into(),
        exp: now + 600,
        nbf: now.saturating_sub(10),
        video: VideoGrant {
            room_join: true,
            room: room.into(),
            can_publish: true,
            can_subscribe: true,
        },
        metadata: serde_json::json!({ "tenant_id": tenant.to_string() }).to_string(),
    };
    jsonwebtoken::encode(
        &jsonwebtoken::Header::new(jsonwebtoken::Algorithm::HS256),
        &claims,
        &jsonwebtoken::EncodingKey::from_secret(API_SECRET.as_bytes()),
    )
    .unwrap()
}

fn descriptor(port: u16, room: &str, identity: &str, tenant: TenantId) -> SessionDescriptor {
    SessionDescriptor {
        room: room.into(),
        join_token: mint_token(room, identity, tenant),
        livekit_url: format!("ws://127.0.0.1:{port}"),
        tenant,
    }
}

fn pcm(seconds: f32) -> AudioChunk {
    // A 200 Hz tone at amplitude 3000 (RMS ~2121): speech-like energy the
    // VAD accepts. A constant DC signal is removed by Opus's high-pass
    // filter on the wire and never reaches the subscriber.
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
async fn ai_joins_publishes_and_leaves_a_real_room() {
    let Ok(bin) = std::env::var("LIVEKIT_SERVER_BIN") else {
        eprintln!("LIVEKIT_SERVER_BIN unset; skipping live e2e");
        return;
    };
    let Some(server) = start_server(&bin).await else {
        panic!("livekit-server failed to start");
    };
    let port = server.port;

    let tenant = TenantId::new();
    let gateway: Arc<dyn MediaGateway> = Arc::new(LiveKitGateway::new());
    gateway
        .join(&descriptor(port, "e2e-room", "nordsvar-ai", tenant))
        .await
        .expect("join");

    // Publish a second of TTS-shaped audio.
    gateway.publish_audio(&pcm(1.0)).await.expect("publish");

    // Nobody else is in the room: no utterance arrives, and crucially no
    // error either - the loop just waits.
    let waiting = tokio::time::timeout(Duration::from_secs(2), gateway.next_utterance()).await;
    assert!(waiting.is_err(), "empty room must wait, not error or end");

    gateway.leave().await.expect("leave");
}

#[tokio::test]
async fn caller_audio_reaches_the_ai() {
    let Ok(bin) = std::env::var("LIVEKIT_SERVER_BIN") else {
        eprintln!("LIVEKIT_SERVER_BIN unset; skipping live e2e");
        return;
    };
    let Some(server) = start_server(&bin).await else {
        panic!("livekit-server failed to start");
    };
    let port = server.port;

    let tenant = TenantId::new();
    let room = "e2e-two-party";

    // The AI participant joins first (its subscription handler is armed).
    let ai: Arc<dyn MediaGateway> = Arc::new(LiveKitGateway::new());
    ai.join(&descriptor(port, room, "nordsvar-ai", tenant))
        .await
        .expect("ai join");

    // The caller joins and speaks ~3 seconds of audio.
    let caller = Arc::new(LiveKitGateway::new());
    caller
        .join(&descriptor(port, room, "caller-1", tenant))
        .await
        .expect("caller join");

    let caller_clone = caller.clone();
    let publisher = tokio::spawn(async move {
        // Give the AI side a moment to subscribe to the new track.
        tokio::time::sleep(Duration::from_secs(1)).await;
        for _ in 0..12 {
            caller_clone
                .publish_audio(&pcm(0.25))
                .await
                .expect("caller publish");
            tokio::time::sleep(Duration::from_millis(50)).await;
        }
    });

    // The AI must receive at least one VAD-segmented utterance from the
    // caller's track (the 700 ms hangover after the last publish closes it).
    let utterance = tokio::time::timeout(Duration::from_secs(20), ai.next_utterance())
        .await
        .expect("timed out waiting for caller audio")
        .expect("gateway error");
    let utterance = utterance.expect("room closed early");
    assert!(
        utterance.samples.len() >= 8_000,
        "expected about a second of audio, got {} samples",
        utterance.samples.len()
    );

    publisher.await.unwrap();
    ai.leave().await.expect("ai leave");
    caller.leave().await.expect("caller leave");
}

#[tokio::test]
async fn caller_leaving_ends_the_ai_session() {
    let Ok(bin) = std::env::var("LIVEKIT_SERVER_BIN") else {
        eprintln!("LIVEKIT_SERVER_BIN unset; skipping live e2e");
        return;
    };
    let Some(server) = start_server(&bin).await else {
        panic!("livekit-server failed to start");
    };
    let port = server.port;

    let tenant = TenantId::new();
    let room = "e2e-caller-leaves";

    let ai: Arc<dyn MediaGateway> = Arc::new(LiveKitGateway::new());
    ai.join(&descriptor(port, room, "nordsvar-ai", tenant))
        .await
        .expect("ai join");

    let caller = Arc::new(LiveKitGateway::new());
    caller
        .join(&descriptor(port, room, "caller-1", tenant))
        .await
        .expect("caller join");

    // Let the join propagate: the server coalesces participant updates, so
    // a hangup within milliseconds of joining never reaches the AI as an
    // ACTIVE participant at all.
    tokio::time::sleep(Duration::from_secs(2)).await;

    // The caller hangs up: the AI's session must end, not wait forever
    // alone in the room.
    caller.leave().await.expect("caller leave");

    // Drain until the channel closes: the WebRTC jitter buffer emits
    // comfort-noise frames (decoded as utterance chunks) while the track is
    // live, so the session-end contract is that next_utterance eventually
    // returns None, not that it returns None immediately.
    let drain = async { while ai.next_utterance().await.expect("gateway error").is_some() {} };
    tokio::time::timeout(Duration::from_secs(30), drain)
        .await
        .expect("timed out: AI kept waiting after the caller left");
    ai.leave().await.expect("ai leave");
}
