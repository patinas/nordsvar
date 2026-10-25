# Architecture

Nordsvar is a Rust-centered monorepo. The design goal is a support session that never leaves the enterprise network: media terminates on a self-hosted LiveKit gateway, and every inference step runs on local GPU workers.

## Components

| Component | Path | Role |
|---|---|---|
| Web client | apps/web | Browser UI. WebRTC voice + `getDisplayMedia` screen share. No webcam, no download. |
| API + session manager | services/api | Axum backend. Creates sessions, mints tenant-scoped LiveKit tokens, hosts the KB admin API. |
| AI worker | services/ai-worker | Sovereign inference loop: STT -> LLM (with RAG context) -> TTS. One worker per active session or pooled per tenant (D-003). |
| KB ingest | crates/kb-ingest | Parses .pdf/.md/.txt/.docx, chunks, embeds locally, indexes into Qdrant. |
| Tenancy | crates/tenancy | Tenant identity and isolation primitives used by every service. |
| LiveKit | deploy (compose) | Self-hosted open-source media gateway. |
| Qdrant | deploy (compose) | Vector storage, one collection per tenant. |

## Session flow

1. End user opens the session link in a browser. No install.
2. The API creates a session, allocates a LiveKit room, and returns a tenant-scoped join token.
3. Browser joins: microphone audio upstream, screen frames via `getDisplayMedia`. Camera is never requested.
4. The AI worker subscribes to the room audio track and runs the local pipeline:
   - STT: faster-whisper class model, Danish-tuned, containerized on the GPU host.
   - Retrieval: the transcript hooks Qdrant for matching tenant runbooks; matches are injected into the prompt as grounding context.
   - LLM: open-weights model (Llama 3 / Mistral class) served by vLLM or Ollama on local GPUs.
   - TTS: Piper / XTTS class Danish voice, streamed back into the room.
5. The support interaction is logged to the tenant's audit stream (see docs/SECURITY.md).

## Latency budget

The voice loop is the product's core feel. Targets (to be validated, not yet measured):

- STT partial transcripts: under 300 ms after end of utterance.
- LLM first token: under 500 ms on the reference GPU rig.
- TTS first audio: under 300 ms.

## Model choices

Exact models are open decisions (docs/DECISIONS.md D-002): Danish STT fine-tune, Danish-capable LLM weights and serving stack (vLLM vs Ollama), embedding model for the KB, and the Danish TTS voice. The architecture only fixes the constraint that all of them run locally.
