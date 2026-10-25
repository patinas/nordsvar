# Nordsvar Managed (hosted offering)

Nordsvar Managed is the paid hosting option for organizations that do not want to operate Nordsvar themselves. The software is identical to the self-hosted release - **every core capability (local AI, browser sessions, mobile PWA, website embed, telephony scaffolding) is free and open source for self-hosters.** What managed customers pay for is operations, never features.

## What you pay for

- Dedicated hosting and hardware (including GPU capacity for local models)
- Operations: deployment, upgrades, monitoring, backups, restore drills
- Telephony: SIP trunk setup and phone-number costs (pass-through from the provider)
- Support with a response-time agreement

## What you never pay for

- Features. There is no feature gate, no per-seat pricing, and no capability that exists only in the managed offering. If it ships in the repo, self-hosters have it.

## Packaging: dedicated single-tenant

Each managed customer gets a **dedicated single-tenant deployment**: its own VM (or VM pair), its own database, its own object storage, its own LiveKit. Managed tenants never share infrastructure with other customers. This matches the sovereignty promise: a customer's data boundary is a machine, not a row filter.

### Hardware sizing (starting points, tuned per customer)

| Tier | Concurrent sessions | GPU | Notes |
|---|---|---|---|
| Small | up to ~5 | 1 x 16-24 GB (L4 / RTX 4090 class) | quantized 8B LLM, whisper small/medium, Piper |
| Medium | up to ~15 | 1 x 48 GB (A40 / L40S class) | 8-13B LLM, whisper medium |
| Large | up to ~40 | 1 x 80 GB (A100/H100 class) | larger models, headroom for soak |

Indicative EU GPU pricing, verified August/September 2026 (re-check at quote time): OVH GPU instances from about EUR 0.43/h; Scaleway L4 about EUR 0.79/h (PAR-1); Hetzner dedicated RTX PRO 6000 about EUR 1,199/month. Prices move; every customer quote is worked out from current vendor prices at the time.

### Limits stated honestly

- Concurrency is bounded by the GPU: each active voice session holds STT + LLM + TTS capacity. The tiers above are starting points measured against the default model stack, not guarantees.
- Text-only embed sessions are much cheaper than voice and mostly bounded by LLM throughput.
- Managed telephony requires a phone number from a SIP provider; the customer (or Nordsvar on the customer's behalf) buys it. See docs/TELEPHONY.md for verified reference pricing.

## Boundaries of the promise

- **No compliance claims.** The architecture is designed for Danish data-sovereignty requirements, but GDPR/legal compliance is the customer's responsibility - managed or not. See docs/DATA-SOVEREIGNTY.md.
- **No lock-in by design.** A managed customer can export their knowledge base and configuration and leave for self-hosting at any time; the software is the same.
