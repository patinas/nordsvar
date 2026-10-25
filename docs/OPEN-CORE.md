# Open-core model

Nordsvar is an open-core product. The core platform is open source; revenue comes from an enterprise support tier, not from restricting the core.

## Split

Locked product decision (September 2026): the self-hosted edition is free and open source with **all core functionality** - local AI, browser sessions, the mobile PWA, the website embed widget, and telephony scaffolding. Revenue comes from hosting, operations, monitoring, backups, hardware, and telephony (see docs/MANAGED.md) plus enterprise support - never from feature-gating the software.

| Capability | Self-hosted (free + open source) | Paid (managed / enterprise) |
|---|---|---|
| Voice + screen-share sessions | Full | Same software, operated by us |
| Local AI pipeline (STT/LLM/TTS/KB) | Full | Same software, on hardware we run |
| Mobile PWA | Full | Same software |
| Website embed widget | Full | Same software |
| Telephony (SIP) scaffolding | Full | Trunk setup + phone costs as a service |
| Knowledge base | Manual directory ingestion (PDF/MD) | Automated CRM/Confluence/API sync operated as a managed service |
| Support | Community GitHub issues and forums | Guaranteed SLA (e.g. 24/7/365 P1 response) |
| Architecture | Single-cluster manual layouts | HA clustering, Kubernetes configuration support |

## Licensing

The core is licensed under Apache-2.0 (D-001 in docs/DECISIONS.md), keeping it genuinely open for self-hosters. The enterprise tier stays commercial as support and SLA contracts, not closed code.

## Why this model fits the product

The buyers are Danish enterprises with strict sovereignty requirements. They need to inspect and self-host everything, which favors open source; they also need someone contractually accountable when the support desk itself goes down, which favors paid SLA support over paid features.

