//! Deterministic in-memory implementations of the ports. Used by unit and
//! integration tests everywhere; compiled into the crate (not cfg(test)) so
//! downstream services and E2E harnesses can reuse them.

use crate::ports::{Embedder, Llm, Retriever, Stt, Tts};
use crate::types::{ScoredChunk, Transcript, TtsAudio, Utterance};
use async_trait::async_trait;
use nordsvar_tenancy::{TenantId, TenantScoped};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// STT that always returns the same transcript (or a fixed failure).
#[derive(Debug, Clone)]
pub struct FakeStt {
    outcome: Result<Transcript, String>,
}

impl FakeStt {
    pub fn fixed(text: &str) -> Self {
        Self {
            outcome: Ok(Transcript {
                text: text.to_string(),
                language: "da".to_string(),
                confidence: Some(0.95),
            }),
        }
    }

    pub fn failing(reason: &str) -> Self {
        Self {
            outcome: Err(reason.to_string()),
        }
    }
}

#[async_trait]
impl Stt for FakeStt {
    async fn transcribe(&self, _audio: &Utterance) -> Result<Transcript, String> {
        self.outcome.clone()
    }
}

/// LLM returning scripted answers in FIFO order; repeats the last answer
/// when the script runs out. Records every prompt it saw.
#[derive(Debug, Clone, Default)]
pub struct ScriptedLlm {
    state: Arc<Mutex<ScriptedLlmState>>,
}

#[derive(Debug, Default)]
struct ScriptedLlmState {
    script: Vec<String>,
    seen_prompts: Vec<String>,
}

impl ScriptedLlm {
    pub fn fixed(answer: &str) -> Self {
        Self::scripted(vec![answer.to_string()])
    }

    pub fn scripted(answers: Vec<String>) -> Self {
        Self {
            state: Arc::new(Mutex::new(ScriptedLlmState {
                script: answers,
                seen_prompts: Vec::new(),
            })),
        }
    }

    pub fn last_prompt(&self) -> Option<String> {
        self.state.lock().unwrap().seen_prompts.last().cloned()
    }

    pub fn prompt_count(&self) -> usize {
        self.state.lock().unwrap().seen_prompts.len()
    }
}

#[async_trait]
impl Llm for ScriptedLlm {
    async fn complete(&self, prompt: &str) -> Result<String, String> {
        let mut state = self.state.lock().unwrap();
        state.seen_prompts.push(prompt.to_string());
        if state.script.len() > 1 {
            Ok(state.script.remove(0))
        } else {
            Ok(state.script[0].clone())
        }
    }
}

/// TTS that synthesizes a deterministic tone derived from the input text
/// (so tests can assert audio exists and differs per answer).
#[derive(Debug, Clone, Default)]
pub struct TtsStub {
    seen: Arc<Mutex<Vec<String>>>,
}

impl TtsStub {
    pub fn last_text(&self) -> Option<String> {
        self.seen.lock().unwrap().last().cloned()
    }
}

#[async_trait]
impl Tts for TtsStub {
    async fn synthesize(&self, text: &str) -> Result<TtsAudio, String> {
        self.seen.lock().unwrap().push(text.to_string());
        // One 10 ms frame of 16 kHz PCM per character, amplitude from a hash
        // of the text: deterministic, non-empty, text-dependent.
        let amp = (text.bytes().fold(0u32, |a, b| a.wrapping_add(u32::from(b))) % 10_000) as i16;
        let frames = text.chars().count().max(1) * 160;
        Ok(TtsAudio {
            samples: vec![amp; frames],
            sample_rate_hz: 16_000,
        })
    }
}

/// Tenant-partitioned in-memory retriever. Chunks are stored under their
/// tenant key; `search` can only ever read the scoped tenant's partition.
#[derive(Debug, Clone, Default)]
pub struct InMemoryRetriever {
    by_tenant: Arc<Mutex<HashMap<TenantId, Vec<ScoredChunk>>>>,
    last_query: Arc<Mutex<Option<TenantId>>>,
}

impl InMemoryRetriever {
    pub fn insert(&self, chunk: TenantScoped<ScoredChunk>) {
        self.by_tenant
            .lock()
            .unwrap()
            .entry(chunk.tenant())
            .or_default()
            .push(chunk.into_inner());
    }

    pub fn last_query_tenant(&self) -> Option<TenantId> {
        *self.last_query.lock().unwrap()
    }
}

#[async_trait]
impl Retriever for InMemoryRetriever {
    async fn search(
        &self,
        query: TenantScoped<&str>,
        k: usize,
    ) -> Result<Vec<ScoredChunk>, String> {
        *self.last_query.lock().unwrap() = Some(query.tenant());
        let store = self.by_tenant.lock().unwrap();
        let chunks = store.get(&query.tenant()).cloned().unwrap_or_default();
        // Naive substring ranking: deterministic and good enough for tests.
        let needle = query.value().to_lowercase();
        let mut scored: Vec<ScoredChunk> = chunks
            .into_iter()
            .filter(|c| {
                c.text
                    .to_lowercase()
                    .contains(needle.split_whitespace().next().unwrap_or(""))
            })
            .collect();
        if scored.is_empty() {
            scored = store.get(&query.tenant()).cloned().unwrap_or_default();
        }
        scored.truncate(k);
        Ok(scored)
    }
}

/// Deterministic fake embedder: stable bag-of-bytes vector, normalized.
/// Not semantic - only for wiring tests.
#[derive(Debug, Clone, Default)]
pub struct FakeEmbedder {
    pub dim: usize,
}

#[async_trait]
impl Embedder for FakeEmbedder {
    async fn embed(&self, texts: &[String]) -> Result<Vec<Vec<f32>>, String> {
        let dim = if self.dim == 0 { 8 } else { self.dim };
        Ok(texts
            .iter()
            .map(|t| {
                let mut v = vec![0f32; dim];
                for (i, b) in t.bytes().enumerate() {
                    v[i % dim] += f32::from(b);
                }
                let norm: f32 = v.iter().map(|x| x * x).sum::<f32>().sqrt();
                if norm > 0.0 {
                    for x in &mut v {
                        *x /= norm;
                    }
                }
                v
            })
            .collect())
    }
}

/// STT that fails a fixed number of times before succeeding. Models a
/// flaky local model service (cold start, transient GPU OOM) so tests can
/// prove the session survives per-utterance failures.
#[derive(Debug)]
pub struct FlakyStt {
    failures_left: std::sync::atomic::AtomicUsize,
    ok: Transcript,
}

impl FlakyStt {
    pub fn new(failures: usize, text: &str) -> Self {
        Self {
            failures_left: std::sync::atomic::AtomicUsize::new(failures),
            ok: Transcript {
                text: text.to_string(),
                language: "da".to_string(),
                confidence: Some(0.9),
            },
        }
    }
}

#[async_trait]
impl Stt for FlakyStt {
    async fn transcribe(&self, _audio: &Utterance) -> Result<Transcript, String> {
        // `fetch_update` is deprecated on newer toolchains in favour of
        // `try_update` (stable only since 1.95); the workspace MSRV is 1.80,
        // so keep the old call and allow the lint.
        #[allow(deprecated)]
        let decremented = self
            .failures_left
            .fetch_update(
                std::sync::atomic::Ordering::SeqCst,
                std::sync::atomic::Ordering::SeqCst,
                |n| n.checked_sub(1),
            )
            .is_ok();
        if decremented {
            return Err("transient stt failure".into());
        }
        Ok(self.ok.clone())
    }
}

/// TTS that always fails. Models a dead Piper service: the session must
/// keep listening and answering (text still produced) rather than die.
#[derive(Debug, Default)]
pub struct FailingTts;

#[async_trait]
impl Tts for FailingTts {
    async fn synthesize(&self, _text: &str) -> Result<TtsAudio, String> {
        Err("tts service unreachable".into())
    }
}
