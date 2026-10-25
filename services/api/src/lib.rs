//! Nordsvar API: session manager and REST/token surface.
//!
//! Responsibilities (see docs/ARCHITECTURE.md):
//! - Create and join support sessions (voice + screen share over LiveKit).
//! - Mint LiveKit access tokens scoped to a tenant and room.
//! - Host the knowledge-base admin API used by the RAG pipeline.
//!
//! Everything here is tenant-scoped. Tenant resolution happens before any
//! handler runs; see crates/tenancy and the `tenant_auth` module.

pub mod app;
pub mod audit;
pub mod config;
pub mod crypto;
pub mod embed;
pub mod embed_llm;
pub mod error;
pub mod livekit_token;
pub mod local_auth;
pub mod oidc;
pub mod ratelimit;
pub mod routes;
pub mod routes_internal;
pub mod store;
pub mod store_pg;
pub mod tenant_auth;
