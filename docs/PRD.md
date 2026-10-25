# Product Requirement Document (PRD)

Source document, supplied by the project owner on 2026-09-11. Edited only for formatting.

## Project overview

- Project name: AI Support Webdesk (Danish Localized Enterprise Edition). Working repo name: Nordsvar.
- Target audience: B2B companies with internal IT helpdesks, and customer-facing support teams across any vertical.
- Core value proposition: a secure, open-source, enterprise-grade AI IT support desk built on low-latency voice calling and screen sharing (no video camera required). To support strict Danish data privacy requirements (GDPR / MitID environments), the entire processing pipeline (LLM, STT, TTS, and knowledge-base vector DB) can be deployed entirely on-premise or within local sovereign cloud networks. The company operates on an open-core model, monetizing through premium enterprise tier SLA support contracts.

## Key objectives and success metrics

- 100% data sovereignty: no corporate data, system metrics, or audio conversations flow outside the enterprise network boundary.
- Zero-download onboarding: end users request a session, share their screen, and talk to the AI directly from the browser using WebRTC.
- Multi-tenant knowledge ingestion: each business client drops in internal PDFs, Confluence spaces, Markdown docs, and runbooks to anchor the AI's troubleshooting domain.
- Danish linguistic precision: highly natural Danish technical support diagnostics natively, interpreting both Danish tech jargon and English system terms used locally.

## High-level technical architecture

```
                   [ USER WEB BROWSER / COMPONENT FRAMEWORK ]
                                │               │
(Audio + Screen Share via WebRTC) │               │ (REST / Token / RAG Admin)
                                ▼               ▼
             [ ON-PREMISE AIR-GAPPED OR LOCAL REGIONAL SERVER ]
             ┌────────────────────────────────────────────────┐
             │  • Axum Backend & Session Manager              │
             │  • LiveKit Open Source Media Gateway           │
             │  • Qdrant Vector Storage (Danish KB Context)   │
             └────────────────────────────────────────────────┘
                                │
                    (Internal Low-Latency Loop)
                                ▼
            [ SOVEREIGN RUST WORKER ENGINE / GPU COMPUTING ]
             ┌────────────────────────────────────────────────┐
             │  • Whisper (Fine-Tuned Danish Audio Model)     │
             │  • Local LLM (e.g., Llama 3 70B Danish Local)  │
             │  • Piper / XTTS v2 Engine (Danish Audio Output)│
             └────────────────────────────────────────────────┘
```

## Functional requirements

### 1. Unified real-time WebRTC media gateway

- Screen sharing engine: single-button browser initialization using the native HTML5 MediaDevices API (`getDisplayMedia`). Streams the targeted application screen or desktop view frame-by-frame. No webcam access is mapped or queried.
- Low-latency voice tunneling: bidirectional WebRTC audio lane streaming concurrently with screen frames. Jitter buffer, echo cancellation, and network degradation handling managed locally via the self-hosted LiveKit server.

### 2. Multi-tenant knowledge base and RAG pipeline

- Knowledge ingestion UI: a secure admin portal where designated IT managers upload operational materials (.pdf, .md, .txt, .docx) or point to an API endpoint (e.g. local Jira or Confluence).
- Local semantic structuring: ingested documents are chunked, embedded with a local embedding model, and indexed into a local Qdrant deployment.
- Contextual anchor injector: during active troubleshooting, semantic hooks parse user utterances and extract matching runbooks, preventing hallucinations.

### 3. Local sovereign AI intelligence

- Localized STT: containerized engine (e.g. faster-whisper fine-tuned for Scandinavian accents) transcribes incoming audio fragments fast and precisely.
- Fully air-gapped LLM execution: open-weights engine (e.g. Llama 3 or Mistral variants optimized for Danish dialogue) running locally via vLLM or Ollama on dedicated enterprise GPU rigs.
- TTS: localized synthesizer generating high-fidelity Danish voice output to guide users through recovery sequences.

### 4. B2B multitenancy and corporate controls

- Tenant partition isolation: rigid logical grouping keeps knowledge layers, logged interaction data, and user identities separate per organizational tenant.
- Audit and compliance logger: enterprise logging console tracking system health, interactions, and query footprints for internal sovereignty and security policy verification.

## Feature comparison and enterprise monetization matrix

| Feature | Open Source Edition (Free Core) | Enterprise Support Tier (Paid Contract) |
|---|---|---|
| Media capabilities | Full voice and screen sharing WebRTC infrastructure | Same |
| Model hosting | Complete access to self-host local AI models | Optimized local deployment assistance and fine-tuning |
| Knowledge base | Manual directory ingestion (PDF/MD) | Automated CRM, Confluence, and API sync connectors |
| SLA and support | Community GitHub issues and public forums | Guaranteed response times (e.g. 24/7/365 P1 response) |
| Architecture access | Single-cluster manual deployment layouts | HA clustering and Kubernetes configuration support |

## Security, sovereignty, and regulatory alignment

- GDPR alignment: restricting data transit to the primary network is the architectural basis for aligning with Danish Data Protection Agency (Datatilsynet) expectations. See docs/DATA-SOVEREIGNTY.md for what the software does and does not guarantee.
- Enterprise authentication: built-in connection to enterprise SSO (SAML, OIDC, Active Directory / Entra ID).
- Data at rest: local databases and persistent volumes secured with AES-256, keys managed by the enterprise infrastructure team.
