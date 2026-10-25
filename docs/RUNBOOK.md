# Runbook (operations)

Day-2 operations for a self-hosted Nordsvar node. Installation, upgrade
and rollback live in docs/INSTALL.md; this document is about running it.

## Health signals

- API: `GET /healthz` on the API port answers `{status, version}`. Compose
  healthchecks already use it.
- Worker liveness: workers send a heartbeat per active session
  (`/v1/internal/sessions/{id}/heartbeat`, fenced by `X-Worker-Id`). A
  session whose heartbeats stop is reclaimed by a surviving worker after
  the stale-claim timeout - a crashed worker degrades capacity, it does
  not strand callers.
- Audit log: every security-relevant action (logins, user creation, KB
  uploads/deletes, settings changes) lands in the tenant's audit log,
  visible under Administration -> Auditlog. Settings audits never contain
  key material.
- Query footprints: workers report each completed Q&A exchange (question
  text and answer, both from the session transcript, plus citations) to
  `POST /internal/sessions/{id}/footprint`, which appends a
  `session.query` audit entry to the owning tenant's log. Question text
  is capped at 500 chars, citations at 20x200 chars. Reporting is
  best-effort: a failed report marks the exchange unanswered rather than
  recording a misleading success. Audit entries carry text only - never
  audio, keys, or transcripts beyond the capped fields.

## Where configuration lives

Two tiers, deliberately separate:

- **Bootstrap (env-only, operator-managed):** database password, LiveKit
  keys, INTERNAL_TOKEN, SETTINGS_KEY, AUTH_MODE and OIDC client settings,
  model service URLs. Set at install time in deploy/compose/.env
  (chmod 600). Changing them means editing .env and
  `docker compose up -d` again.
- **Per-tenant AI settings (web UI):** model names, speech language, and
  the optional external OpenAI-compatible provider live under
  Administration -> Indstillinger. The provider key is stored encrypted
  (SETTINGS_KEY) and is write-only in the UI. Changing the provider
  endpoint while a key is stored requires re-entering or clearing the
  key - the old secret is never sent to a new endpoint silently.

## Backup and restore

State lives in two named volumes: Postgres (tenants, users, sessions,
audit, KB registry, settings) and Qdrant (KB vectors). Back up both
together - the registry and vectors are only meaningful as a pair:

    docker compose -f deploy/compose/selfhost.yml exec -T postgres \
      pg_dump -U postgres nordsvar | gzip > nordsvar-$(date +%F).sql.gz
    docker run --rm -v nordsvar_qdrant-data:/data:ro -v "$PWD":/out alpine \
      tar czf /out/qdrant-$(date +%F).tar.gz -C /data .

Volume names are the compose project name plus the volume key
(`nordsvar_pg-data`, `nordsvar_qdrant-data`); confirm with
`docker volume ls` on the node.

Restore by loading the dump into a fresh Postgres and unpacking the
Qdrant tarball before first start. Test restores before you need them.

## Key rotation

SETTINGS_KEY decrypts stored provider keys. To rotate: have each tenant
admin re-enter (or clear) their provider key under Indstillinger after
the new key is in .env, then restart the API. Between the restart and a
tenant's re-entry, that tenant's stored key is undecryptable and sessions
for tenants that configured an external provider fail closed (500) rather
than falling back silently.

## Load and soak testing

services/ai-worker/tests/load.rs owns the dispatch-plane load and soak
coverage: 64 sessions claimed by 4 competing workers exactly once each,
and 8 repeated rounds that must fully drain without leaks or stalls. Run
it before capacity decisions and after touching the dispatch loop:

    cargo test -p nordsvar-ai-worker --test load

Media-path load is bounded by LiveKit, not by these tests; size workers
by concurrent calls, not sessions per day.

## Common incidents

- **Worker not claiming sessions:** check the worker log for poll errors
  (API unreachable / INTERNAL_TOKEN mismatch), then check that the API
  lists unclaimed sessions at all. The live E2E harness
  (apps/web/e2e/live) has a full diagnostic bundle for this exact shape.
- **Calls connect but the AI is silent:** the model endpoints (STT/LLM/TTS)
  are down or unreachable; the session survives by design (pipeline
  failures are skipped per utterance). Check the model containers.
- **A worker died mid-call:** nothing to do - heartbeats lapse, the claim
  goes stale, a surviving worker picks the session up. If no worker
  survives, the caller sees the session end when the room empties.
- **Postgres unreachable:** the API fails closed (500 on store errors,
  never empty success-looking lists). Restore Postgres before anything
  else; LiveKit media is stateless and recovers on its own.
