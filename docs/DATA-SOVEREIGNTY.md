# Data sovereignty

## The rule

No corporate data, system metrics, or audio conversations leave the enterprise network boundary. This is an architectural constraint, not a policy toggle:

- All media terminates on the self-hosted LiveKit gateway.
- All inference (STT, LLM, TTS, embeddings) runs on local GPU workers. There is no cloud fallback path in the AI worker by design.
- Qdrant, session state, and audit logs live on enterprise-controlled storage.
- Answered Q&A exchanges are recorded as `session.query` audit entries
  (capped question text, answer, citations) in the owning tenant's
  Postgres audit log. Only transcript text is stored - never audio - and
  the log never leaves the tenant's own database.
- Container images and model weights are mirrored into the enterprise registry before install; nothing is pulled from the public internet at runtime.

## What this means for GDPR and Datatilsynet expectations

The architecture is designed to support GDPR-aligned, Denmark-hosted deployments: keeping personal data inside the enterprise boundary removes the most common cross-border transfer and sub-processor questions, and per-tenant isolation limits exposure.

What this project does not claim: deploying Nordsvar does not by itself make an organization "GDPR compliant". Compliance depends on the operator's own policies, contracts, access controls, retention rules, and (where applicable) MitID integration choices. Those remain the deploying organization's responsibility. Legal review of any specific deployment is out of scope for this repository.

## Telemetry

Nordsvar ships with no external telemetry. Health and audit data stay in the tenant's own logging stack.

## Network egress

The target production posture is zero required egress. Development setups may pull images and models from public registries; deploy/README.md lists everything that must be mirrored for an air-gapped install.
