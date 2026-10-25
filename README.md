<p align="center">
  <img alt="Nordsvar" src="brand/lockup.png#gh-light-mode-only" width="420">
  <img alt="Nordsvar" src="brand/lockup-dark.png#gh-dark-mode-only" width="420">
</p>

<p align="center"><em>Calm answers that stay in-house.</em></p>

Nordsvar is a sovereign AI support desk for Danish enterprises: real-time voice calling and screen sharing from the browser, backed by a fully self-hosted AI pipeline (LLM, speech-to-text, text-to-speech, and knowledge-base retrieval) that runs on-premise or in a local sovereign cloud. No corporate data, audio, or metrics need to leave the enterprise network boundary.

**Status:** feature-complete against the product plan and green across all local test suites. Not yet validated on real infrastructure - see [Current limitations](#current-limitations).

## What it does

- **Browser-based support sessions:** voice + screen share over WebRTC through a self-hosted LiveKit gateway. Screen share uses `getDisplayMedia` only - no webcam, no download.
- **Danish-first, local-first AI:** local STT (faster-whisper class), local LLM (Llama / Mistral class via vLLM or Ollama), local TTS (Piper class). An optional external OpenAI-compatible provider can be configured per tenant; its API key is stored AES-256-GCM-encrypted and is write-only in the UI.
- **Multi-tenant knowledge base with RAG:** each tenant uploads PDFs, Markdown, DOCX, or text; documents are chunked, embedded locally, and indexed in Qdrant. Answers carry citations back to the source documents.
- **Enterprise controls:** OIDC single sign-on (covers Microsoft Entra ID) plus built-in local auth for small installs, rigid tenant isolation (cross-tenant access returns 404, never 403), and a tenant-partitioned audit log covering logins, user creation, sessions, knowledge-base changes, settings changes, and query footprints.
- **Administration in the browser:** a first-run setup wizard creates the administrator, and the Administration area manages users (Brugere), the knowledge base (Vidensbase), AI provider and model settings (Indstillinger), and the audit log (Auditlog) - all post-deployment, no config-file editing.
- **Installable mobile PWA:** the web app is a progressive web app (offline app shell, home-screen install); API traffic is never cached.
- **Website embed widget:** customers embed Nordsvar on their own site with one script tag - chat bubble with RAG answers, optional voice, theming, domain allow-listing, rate limiting, and ephemeral privacy-safe sessions. See [docs/EMBED.md](docs/EMBED.md).
- **Phone-to-screen handoff:** agents (or the AI on a call) share a signed two-hour link; the caller opens it in any browser to join the same session and share their screen from a desktop. Telephony (SIP) activation is operator-prepared, never auto-purchased - see [docs/TELEPHONY.md](docs/TELEPHONY.md).

## Repository layout

    apps/web            Browser client - Svelte 5 PWA (WebRTC voice + screen share, admin UI) + embeddable widget bundle
    services/api        Axum backend: session manager, REST/token API, RAG admin, audit log
    services/ai-worker  Sovereign AI pipeline orchestrator (STT -> LLM -> TTS)
    crates/ai-core      Shared AI provider traits and adapters (local + OpenAI-compatible)
    crates/kb-ingest    Knowledge-base ingestion, parsing, and chunking library
    crates/media-livekit  LiveKit media integration shared by the services
    crates/tenancy      Tenant isolation types shared across services
    deploy/             Deployment assets (self-host compose, GPU guides, Codespaces demo)
    docs/               PRD, architecture, security, sovereignty, decisions, runbook
    brand/              Logo and brand assets
    scripts/            install.sh and helper scripts

## Installation (self-hosted)

One machine, Docker, and five minutes:

```bash
curl -fsSL <udgivelses-URL>/install.sh -o install.sh
echo "<sha256-fra-udgivelsen>  install.sh" | sha256sum -c -
bash install.sh
```

Then open http://localhost:8081 and create the first administrator in the browser wizard. That is the whole install. We deliberately do not offer `curl | bash`: download the script, read it, verify the checksum, then run it.

The full guide - including air-gapped install, GPU nodes, and production settings - is in [docs/INSTALL.md](docs/INSTALL.md). Day-2 operations (backup, restore, upgrades, monitoring) are in [docs/RUNBOOK.md](docs/RUNBOOK.md).

## Try it in GitHub Codespaces (demo)

A codespace is a real Linux VM, so it runs the entire self-host stack unchanged - the quickest way to try Nordsvar without your own server:

1. In this repository: **Code -> Codespaces -> Create codespace on main**. The devcontainer boots automatically and starts the full stack with synthetic data only.
2. Open the forwarded **Nordsvar web** port (8081) from the PORTS panel and complete the setup wizard.

Demo rules: synthetic data only, ports stay private, and everything disappears when the codespace is deleted. Details and limitations: [deploy/codespaces/README.md](deploy/codespaces/README.md).

## Configuration

Two tiers, deliberately separate:

- **Bootstrap (environment, operator-managed):** database password, LiveKit keys, internal tokens, auth mode, and OIDC client settings. Set once at install time.
- **Per-tenant settings (web UI):** LLM and embedding model selection, optional external OpenAI-compatible provider (base URL + write-only API key with a test button), STT language, website embed configuration (domains, theme, public key), and telephony intent (provider, E.164 number - activates nothing by itself). Managed under Administration -> Indstillinger and auditable.

## Testing

Every change ships with its gates green: `cargo fmt`, `cargo clippy -- -D warnings`, and the scoped test suites. The repo contains:

- **Unit and integration tests** for the API, worker, and ingestion pipeline.
- **A live Postgres suite** covering tenant partition isolation, settings key ciphertext-at-rest, session lookup, and audit behavior (requires `NORDSVAR_TEST_DATABASE_URL`).
- **Live media end-to-end tests** against a real LiveKit server, including a REST-verified screen-share session.
- **Web tests:** Vitest unit tests plus Playwright browser flows.
- **Load and soak tests** for session dispatch (stale-claim recovery, heartbeat fencing).

## Documentation

- [docs/PRD.md](docs/PRD.md) - product requirements
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - system design
- [docs/INSTALL.md](docs/INSTALL.md) - installation guide
- [docs/RUNBOOK.md](docs/RUNBOOK.md) - operations runbook
- [docs/SECURITY.md](docs/SECURITY.md) - security model
- [docs/DATA-SOVEREIGNTY.md](docs/DATA-SOVEREIGNTY.md) - what the software does and does not guarantee
- [docs/OPEN-CORE.md](docs/OPEN-CORE.md) - open-core model and enterprise tier
- [docs/EMBED.md](docs/EMBED.md) - website embed widget and guest share links
- [docs/TELEPHONY.md](docs/TELEPHONY.md) - SIP telephony activation guide
- [docs/MANAGED.md](docs/MANAGED.md) - managed hosting offering (dedicated single-tenant)
- [docs/DECISIONS.md](docs/DECISIONS.md) - decision log
- [docs/BUILD-STATE.md](docs/BUILD-STATE.md) - build ledger

## Current limitations

- **Validated in GitHub Codespaces, not yet on self-hosted hardware.** The full stack boots and is exercised live in a codespace (wizard, login, sessions, admin, settings, knowledge base) with all suites green. A first boot on real self-hosted hardware is still ahead.
- **Codespaces demo: call media cannot cross the port tunnel.** Verified 2026-09-13: GitHub's forwarded-port tunnel is an HTTP/HTTPS proxy - the setup wizard, API, admin UI, and LiveKit call signalling (WebSocket) all work through it, but WebRTC media (UDP, or TURN over raw TCP/TLS) does not, and browsers cannot use raw ICE/TCP. To demo the live call, open the codespace in VS Code desktop so ports forward as raw localhost TCP (details in [deploy/codespaces/README.md](deploy/codespaces/README.md)) - or deploy on a real host where 7880/7881/UDP are reachable directly.
- **Enterprise tier is out of scope here.** Confluence/Jira connectors, SAML, and HA/Kubernetes support are enterprise-tier items per the PRD monetization matrix.
- **No compliance guarantees.** The architecture is designed for Danish data-sovereignty requirements, but GDPR/legal compliance is the deploying organization's responsibility - see [docs/DATA-SOVEREIGNTY.md](docs/DATA-SOVEREIGNTY.md).

## License

Nordsvar is open source under the [Apache License 2.0](LICENSE) - Copyright 2026 Andreas Patinas and Nordsvar contributors. The license choice is recorded in [docs/DECISIONS.md](docs/DECISIONS.md) (D-001). Contributions are welcome; see the issues tab for a starting point.

