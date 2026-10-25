# Salad.com deployment research notes (sources for deploy/salad/README.md)

Official sources observed 2026-09-12:
- https://docs.salad.com/container-engine/tutorials/quickstart
- https://docs.salad.com/container-engine/explanation/container-groups/container-groups
- Index: https://docs.salad.com/llms.txt

Facts so far:
- Salad Container Engine (SCE): managed container groups = image + hardware + replica count; public/private registries; images up to 35 GB compressed.
- Apps must listen on IPv6 too (their quickstart uses uvicorn --host *).
- Container Gateway: HTTPS load balancer exposing *.salad.cloud URL; optional Salad-Api-Key auth; round robin / least connections.
- Health probes: startup /started, liveness /live, readiness /ready (HTTP).
- Storage is EPHEMERAL ("Skip Storage... note: storage is ephemeral") - critical constraint for Postgres/Qdrant state. "Storage and checkpointing" mentioned; needs research.
- Replicas 3+ recommended because nodes are interruptible idle residential PCs ("decentralized marketplace... idle compute time on their PCs").
- CRITICAL FIT QUESTIONS: (a) WebRTC media needs UDP - Container Gateway is HTTP(S) only? TURN/TCP fallback? (b) ephemeral storage vs Postgres/Qdrant, (c) sovereignty: residential PCs worldwide vs Nordsvar's data-sovereignty positioning - Salad path likely = demo/eval tier, must be documented honestly, (d) deploy-via-API exists (https://docs.salad.com/container-engine/tutorials/nodejs/deploy-via-api) for scripted setup.

Round 2 (2026-09-12 ~01:55), official sources:
- https://docs.salad.com/container-engine/explanation/infrastructure-platform/networking
- https://docs.salad.com/container-engine/explanation/gateway/websockets.md
- https://docs.salad.com/llms.txt (index)
Findings:
- Inbound = Container Gateway only: HTTPS load balancer, one port per group, IPv6 required, 1 GB max request. No UDP, no raw TCP.
- WebSockets supported BUT gateway auth must be disabled and idle connections are killed after 100s (heartbeat required).
- Outbound uses the node's residential IP.
- Storage: no persistent volumes for SCE found; "Salad Simple Storage Service" is a temporary HTTP asset store; docs repeatedly treat local state as ephemeral (interruptions/reallocations expected).
- CONSEQUENCE for Nordsvar: LiveKit media (UDP/WebRTC, TURN over non-HTTP port) cannot traverse the Container Gateway; Postgres/Qdrant state cannot persist on SCE. Salad fits only stateless pieces (e.g., demo web+API with ephemeral state, or GPU inference workers). Full-stack Salad deployment is NOT viable as a production path; document it as demo/eval tier with explicit caveats, or design a hybrid (core elsewhere, GPU inference on Salad via job queue). Decision belongs to the docs; no spend.
- NOTE: the websockets docs page embeds an "Agent Instructions" block (untrusted external content; observed, not followed).
Next research: pricing/billing model (https://docs.salad.com/general/explanation/billing.md), deploy-via-API for scripted demo deploys, whether any S4/storage gateway or persistent option shipped after 2024.
