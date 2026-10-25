# Nordsvar operator runbook

Audience: the enterprise infrastructure team running Nordsvar on-premise or
in a sovereign cloud. Everything stays inside the network boundary
(docs/DATA-SOVEREIGNTY.md).

## Topology (single node, open core)

| Service | Image / binary | Port(s) | Purpose |
|---|---|---|---|
| nordsvar-web | deploy/docker/web.Dockerfile | 8081 -> 80 | Browser client (SPA) + API proxy |
| nordsvar-api | deploy/docker/api.Dockerfile | 8080 | Session manager, token minting, KB admin, audit |
| nordsvar-ai-worker | deploy/docker/ai-worker.Dockerfile | - | STT -> RAG -> LLM -> TTS loop |
| livekit | livekit/livekit-server | 7880/7881, 50000-50100/udp | WebRTC media gateway |
| postgres | postgres:16 | 5432 | Sessions, audit, KB registry |
| qdrant | qdrant/qdrant | 6333/6334 | Per-tenant vector collections |
| ollama (dev) | ollama/ollama | 11434 | Local LLM + embeddings (profile: local-models) |

Production STT/TTS: faster-whisper server (STT) and Piper HTTP (TTS)
containers on the GPU host; set STT_URL / TTS_URL accordingly. Production
LLM: vLLM with an Ollama-compatible endpoint (LLM_URL) or Ollama directly.

## Install

1. Mirror every image listed in docker-compose.yml into the enterprise
   registry (air-gapped installs: transfer model weights separately).
2. Copy `.env.example` (below) to `.env` and set real secrets from the
   enterprise secret store. Never run production with the dev LiveKit keys.
3. `docker compose up -d` (add `--profile local-models` for dev models).
4. Verify: `curl http://localhost:8080/healthz` returns `{"status":"ok"}`
   and the web client loads on :8081.

## Configuration

| Variable | Default | Notes |
|---|---|---|
| BIND_ADDR | 0.0.0.0:8080 | API listen address |
| DATABASE_URL | unset | When unset the API uses in-memory stores - development only |
| LIVEKIT_URL | ws://localhost:7880 | Signalling URL handed to browsers |
| LIVEKIT_API_KEY / LIVEKIT_API_SECRET | devkey / devsecret-change-me | MUST be replaced in production |
| JOIN_TOKEN_TTL_SECS | 900 | LiveKit join-token lifetime |
| STT_URL / LLM_URL / TTS_URL | unset | Worker model endpoints |

## Operations

- **Audit**: GET /v1/audit (tenant_admin role) streams the tenant's audit
  events; rows also live in the `audit_events` table for SIEM export.
- **Backup**: back up the Postgres volume and the Qdrant volume. LiveKit is
  stateless. KB vectors can be rebuilt by re-ingesting documents.
- **Upgrades**: `docker compose pull && docker compose up -d`; API migrations
  are idempotent and run at startup.
- **Health**: /healthz on the API; LiveKit and Qdrant expose their own
  health endpoints on their ports.
- **Tenancy**: one Qdrant collection and one set of DB rows per tenant.
  Cross-tenant access is treated as a defect - report it per SECURITY.md.

## Failure modes

| Symptom | Likely cause | Action |
|---|---|---|
| Browser cannot join a session | LiveKit unreachable or wrong LIVEKIT_URL | Check the livekit container and that UDP 50000-50100 is open |
| Session joins, no AI answer | Worker down or model endpoint wrong | Check nordsvar-ai-worker logs, STT_URL/LLM_URL/TTS_URL |
| KB answers ungrounded | Empty tenant collection | Ingest documents via the admin portal; check Qdrant |
| API restarts lose sessions | DATABASE_URL unset | Point at the postgres service |


## Corporate authentication (OIDC)

Set `AUTH_MODE=oidc` on the api service to require IdP-issued bearer tokens
on every tenant route. Required variables in OIDC mode:

- `OIDC_ISSUER` - token issuer (`iss`), e.g. the Entra ID v2 issuer URL.
- `OIDC_AUDIENCE` - the API's registered audience (`aud`).
- `OIDC_JWKS_URL` - the IdP's JWKS endpoint.

Optional: `OIDC_TENANT_CLAIM` (default `tid`), `OIDC_GROUPS_CLAIM`
(default `groups`), `OIDC_GROUP_AGENT`, `OIDC_GROUP_TENANT_ADMIN`.

The api refuses to start if any required value is missing in OIDC mode.
Without `AUTH_MODE=oidc` the api runs in dev header mode - local
development and tests only; never expose a dev-mode api to a network.
