//! Media gateway port. The real adapter (crates/media-livekit) joins a
//! LiveKit room (self-hosted); tests use the scripted in-memory gateway
//! below. The trait deliberately knows nothing about LiveKit types so the
//! core stays SDK-free.

use crate::types::{AudioChunk, Utterance};
use async_trait::async_trait;
use nordsvar_tenancy::TenantId;

/// A media session the worker should service.
#[derive(Debug, Clone)]
pub struct SessionDescriptor {
    /// LiveKit room name (server-assigned, from the API).
    pub room: String,
    /// LiveKit join token minted for the joining participant.
    pub join_token: String,
    /// LiveKit signalling URL.
    pub livekit_url: String,
    /// Tenant owning the session (verified from token metadata by the API
    /// that issued the descriptor).
    pub tenant: TenantId,
}

/// One side of the WebRTC bridge: caller utterances in, AI audio out.
#[async_trait]
pub trait MediaGateway: Send + Sync {
    /// Join the room and prepare track subscriptions.
    async fn join(&self, session: &SessionDescriptor) -> Result<(), String>;
    /// Next complete caller utterance. Returns None when the session ended.
    async fn next_utterance(&self) -> Result<Option<Utterance>, String>;
    /// Publish synthesized audio back to the room.
    async fn publish_audio(&self, audio: &AudioChunk) -> Result<(), String>;
    /// Leave the room and release resources.
    async fn leave(&self) -> Result<(), String>;
}

/// Scripted gateway for tests and local development without LiveKit.
#[derive(Debug, Default)]
pub struct ScriptedGateway {
    state: std::sync::Mutex<ScriptedGatewayState>,
}

#[derive(Debug, Default)]
struct ScriptedGatewayState {
    utterances: Vec<Utterance>,
    published: Vec<AudioChunk>,
    joined: Option<SessionDescriptor>,
    left: bool,
    served: usize,
}

impl ScriptedGateway {
    pub fn with_utterances(utterances: Vec<Utterance>) -> Self {
        Self {
            state: std::sync::Mutex::new(ScriptedGatewayState {
                utterances,
                ..Default::default()
            }),
        }
    }

    pub fn published(&self) -> Vec<AudioChunk> {
        self.state.lock().unwrap().published.clone()
    }

    pub fn joined_room(&self) -> Option<String> {
        self.state
            .lock()
            .unwrap()
            .joined
            .as_ref()
            .map(|j| j.room.clone())
    }

    /// Number of utterances already served (for failure-injection wrappers).
    pub fn served_count(&self) -> usize {
        self.state.lock().unwrap().served
    }

    pub fn was_left(&self) -> bool {
        self.state.lock().unwrap().left
    }
}

#[async_trait]
impl MediaGateway for ScriptedGateway {
    async fn join(&self, session: &SessionDescriptor) -> Result<(), String> {
        self.state.lock().unwrap().joined = Some(session.clone());
        Ok(())
    }

    async fn next_utterance(&self) -> Result<Option<Utterance>, String> {
        let mut guard = self.state.lock().unwrap();
        if guard.utterances.is_empty() {
            return Ok(None);
        }
        guard.served += 1;
        Ok(Some(guard.utterances.remove(0)))
    }

    async fn publish_audio(&self, audio: &AudioChunk) -> Result<(), String> {
        self.state.lock().unwrap().published.push(audio.clone());
        Ok(())
    }

    async fn leave(&self) -> Result<(), String> {
        self.state.lock().unwrap().left = true;
        Ok(())
    }
}

/// Test support: a gateway that serves `utterances`, then fails
/// `next_utterance` with an error. Models a LiveKit connection drop
/// mid-session.
pub struct FailAfterGateway {
    inner: ScriptedGateway,
    fail_after: usize,
}

impl FailAfterGateway {
    pub fn new(utterances: Vec<Utterance>, fail_after: usize) -> Self {
        Self {
            inner: ScriptedGateway::with_utterances(utterances),
            fail_after,
        }
    }

    /// Number of utterances already served (for failure-injection wrappers).
    pub fn served_count(&self) -> usize {
        self.inner.served_count()
    }

    pub fn was_left(&self) -> bool {
        self.inner.was_left()
    }
}

#[async_trait]
impl MediaGateway for FailAfterGateway {
    async fn join(&self, session: &SessionDescriptor) -> Result<(), String> {
        self.inner.join(session).await
    }

    async fn next_utterance(&self) -> Result<Option<Utterance>, String> {
        if self.inner.served_count() >= self.fail_after {
            return Err("connection dropped".into());
        }
        self.inner.next_utterance().await
    }

    async fn publish_audio(&self, audio: &AudioChunk) -> Result<(), String> {
        self.inner.publish_audio(audio).await
    }

    async fn leave(&self) -> Result<(), String> {
        self.inner.leave().await
    }
}
