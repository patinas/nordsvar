# Product decisions

Decisions are recorded here with their rationale. Owner sign-off is required
for legal and go-to-market items; technical decisions are made by the
engineering build and documented for owner review.

| ID | Decision | Outcome | Status |
|---|---|---|---|
| D-001 | Core license | Decided: Apache-2.0 for the core (owner decision, 2026-10-25). Rationale: maximizes enterprise self-hoster adoption, matches the inspect-everything buyer; the enterprise tier is delivered as support contracts, not closed code. | Decided (owner) |
| D-002 | Model lineup | Decided: interface-first. The code fixes provider interfaces (STT, LLM, TTS, embeddings) and ships working defaults: STT = faster-whisper (Danish-tuned container, HTTP adapter), LLM = Ollama (dev) with vLLM-compatible OpenAI-style endpoint support (prod), embeddings = local model via the same Ollama/vLLM endpoint, TTS = Piper (Danish voice, HTTP adapter). Concrete model weights stay deployment configuration, not code constants. | Decided (technical) |
| D-003 | AI worker scaling | Decided: pooled per tenant. One worker process serves many sessions; each session is an isolated async pipeline task keyed by tenant. Per-tenant pooling keeps GPU session affinity where operators want it without one-process-per-session overhead. | Decided (technical) |
| D-004 | Web client framework | Decided: Svelte 5 + Vite + TypeScript, SPA (no SSR). Rationale: small runtime for low-spec enterprise machines, fine-grained reactivity fits live transcripts and media state, first-class TypeScript, Vitest + Playwright test path. SSR is unnecessary behind enterprise SSO and would complicate air-gapped installs. | Decided (technical) |
| D-005 | MitID integration scope | Decided: out of scope for the core. End-user verification is delegated to tenant SSO (OIDC covers Entra ID; SAML documented as a follow-on). MitID, where a tenant requires it, is integrated at the tenant's identity provider, not in Nordsvar. | Decided (technical) |
| D-006 | Security disclosure process | Decided: GitHub private vulnerability reporting on the repository (see docs/SECURITY.md, Reporting). Landed with the public release, 2026-10-25. | Decided |
| D-007 | Repo visibility and release timing | Decided (owner, 2026-10-25): released publicly as open source under Apache-2.0. License, CI and the security policy landed first. | Decided (owner) |

## Decided architecture details (recorded during the build)

- **AuthN/Z**: OIDC (covers Microsoft Entra ID and Danish enterprise IdPs) as the production path; SAML noted as enterprise-tier follow-on. A dev-mode static header auth exists for local development and tests only and is refused in production configuration.
- **Roles**: `end_user` (joins sessions), `agent` / IT manager (KB admin, session oversight), `tenant_admin` (tenant configuration, audit export). Enforced per route; audit stream records actor and role.
- **Session store and audit log**: PostgreSQL inside the boundary (single-node compose includes it). Traits keep storage pluggable; in-memory implementations back unit tests.
- **LiveKit tokens**: minted by services/api as short-lived HS256 JWTs carrying room, identity, and tenant metadata; the AI worker validates tenant binding from token metadata before joining a room.
- **Tenant isolation**: type-level (`crates/tenancy`) plus physical separation of storage rows per tenant and one Qdrant collection per tenant. Cross-tenant access returns 404, never 403, to avoid leaking existence.
- **Latency budget**: STT partial < 300 ms, LLM first token < 500 ms, TTS first audio < 300 ms on the reference rig - targets to be measured by the load/latency test suite, not guaranteed values.
