//! The sovereign AI pipeline core: provider interfaces (ports), the
//! STT -> RAG -> LLM -> TTS orchestration, and deterministic fakes for tests.
//!
//! Hard rule (docs/DATA-SOVEREIGNTY.md): implementations of these ports talk
//! to local, enterprise-hosted model servers only. There is intentionally no
//! cloud provider adapter in this crate.

pub mod fakes;
pub mod media;
pub mod ollama;
pub mod pipeline;
pub mod ports;
pub mod types;
pub mod vad;

pub use pipeline::{PipelineError, SupportPipeline};
pub use ports::{Embedder, Llm, Retriever, Stt, Tts};
pub use types::{
    AudioChunk, Citation, PipelineResponse, ScoredChunk, Transcript, TtsAudio, Utterance,
};
