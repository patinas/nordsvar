//! Nordsvar AI worker: the sovereign inference loop.
//!
//! Owns the low-latency pipeline per docs/ARCHITECTURE.md:
//!   audio in  -> local STT (faster-whisper class, Danish-tuned)
//!             -> tenant-scoped KB retrieval (Qdrant)
//!             -> local LLM (Ollama in dev, vLLM-compatible endpoint in prod)
//!             -> local TTS (Piper, Danish voice)
//!   audio out
//!
//! Hard rule (docs/DATA-SOVEREIGNTY.md): no model call may leave the
//! enterprise network boundary. There is no cloud fallback path by design;
//! every adapter below speaks plain HTTP to an operator-hosted service.

pub mod adapters;
pub mod dispatch;
pub mod gateway;
pub mod runtime;
