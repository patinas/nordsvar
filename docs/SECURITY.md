# Security

## Authentication and authorization

- Enterprise SSO: SAML, OIDC, and Active Directory / Entra ID connections are in scope for the API.
- Session join tokens are LiveKit access tokens scoped to one tenant and one room, short-lived, minted by services/api.
- The KB admin portal is restricted to designated IT manager roles within each tenant.

## Tenant isolation

crates/tenancy makes tenant scope a type-level requirement: storage layers key on `TenantId` and reject unscoped queries. One Qdrant collection per tenant, one audit stream per tenant. Cross-tenant access is treated as a defect.

## Encryption

- In transit: WebRTC media is encrypted (DTLS-SRTP via LiveKit). Admin and API traffic is TLS-terminated inside the enterprise boundary.
- At rest: databases and persistent volumes use AES-256 with keys managed by the enterprise infrastructure team (their KMS/HSM, not ours).

## Audit logging

Per the PRD, an enterprise logging console tracks system health, interactions, and query footprints so security teams can verify adherence to internal sovereignty policies. Audit records are tenant-scoped and stored inside the boundary.

## Reporting

Report security vulnerabilities through GitHub's private vulnerability reporting on this repository (Security tab -> "Report a vulnerability"). Please do not open public issues for security reports.

Include reproduction steps and the affected deployment configuration where possible. Reports are handled on a best-effort basis; expect an initial response within 7 days. Process recorded in docs/DECISIONS.md (D-006).
