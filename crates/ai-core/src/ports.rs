//! Provider ports. Each trait has one local adapter in the deployment
//! (faster-whisper, Ollama/vLLM, Piper, Qdrant) and one fake in `fakes`.

use crate::types::{ScoredChunk, Transcript, TtsAudio, Utterance};
use async_trait::async_trait;
use nordsvar_tenancy::TenantScoped;

/// Speech-to-text over one utterance of caller audio.
#[async_trait]
pub trait Stt: Send + Sync {
    async fn transcribe(&self, audio: &Utterance) -> Result<Transcript, String>;
}

/// Text generation. The prompt already carries RAG grounding; the LLM must
/// not be asked to retrieve anything itself.
#[async_trait]
pub trait Llm: Send + Sync {
    async fn complete(&self, prompt: &str) -> Result<String, String>;
}

/// Text-to-speech for one assistant reply.
#[async_trait]
pub trait Tts: Send + Sync {
    async fn synthesize(&self, text: &str) -> Result<TtsAudio, String>;
}

/// Local embedding model used by ingestion and (for query embedding) retrieval.
#[async_trait]
pub trait Embedder: Send + Sync {
    async fn embed(&self, texts: &[String]) -> Result<Vec<Vec<f32>>, String>;
}

/// Arc forwarding so shared embedders (including trait objects) can be
/// used where an embedder is owned.
#[async_trait]
impl<T: Embedder + ?Sized> Embedder for std::sync::Arc<T> {
    async fn embed(&self, texts: &[String]) -> Result<Vec<Vec<f32>>, String> {
        (**self).embed(texts).await
    }
}

/// Tenant-scoped retrieval over the tenant's own knowledge base. The query
/// arrives already scoped; implementations key on the scope's tenant.
#[async_trait]
pub trait Retriever: Send + Sync {
    async fn search(&self, query: TenantScoped<&str>, k: usize)
        -> Result<Vec<ScoredChunk>, String>;
}
