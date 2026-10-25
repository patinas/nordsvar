# Deployment

Nordsvar deploys entirely inside the enterprise network boundary. There is no
hosted control plane to phone home to.

## Single-node (open core)

`docker-compose.yml` at the repo root starts the backing services:

- LiveKit server: media gateway for voice + screen share
- Qdrant: vector storage for per-tenant knowledge-base collections
- Optional profiles for local model serving (Ollama or vLLM) and STT/TTS containers

The API (`services/api`) and AI worker (`services/ai-worker`) run as Rust
binaries or containers alongside them.

## High availability / Kubernetes (enterprise tier)

HA clustering, multi-region layouts, and managed Kubernetes configuration are
part of the enterprise support tier. See docs/OPEN-CORE.md. Manifests will live
under deploy/k8s when they exist.

## Air-gapped installs

All images must be mirrored into the enterprise registry before install; the
compose file is the reference list of what to mirror. Model weights (STT, LLM,
TTS, embeddings) are transferred by the enterprise team, never pulled at
runtime from the public internet. Details: docs/DATA-SOVEREIGNTY.md.
