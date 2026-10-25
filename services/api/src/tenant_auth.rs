//! Tenant resolution. Every protected route extracts a [`TenantAuth`]
//! before its handler runs; handlers then pass the context's tenant into
//! every storage call.
//!
//! Dev mode (local development and tests) trusts `X-Tenant-Id` /
//! `X-Actor-Id` headers. The OIDC production path validates bearer tokens
//! from the tenant's IdP and maps groups to roles - it plugs in behind the
//! same extractor surface.

use crate::app::AppState;
use crate::config::AuthMode;
use crate::error::ApiError;
use axum::extract::{FromRef, FromRequestParts};
use axum::http::request::Parts;
use nordsvar_tenancy::{ActorId, Role, TenantContext, TenantId};

/// Authenticated tenant context attached to a request.
#[derive(Debug, Clone)]
pub struct TenantAuth(pub TenantContext);

pub const TENANT_HEADER: &str = "x-tenant-id";
pub const ACTOR_HEADER: &str = "x-actor-id";
pub const ROLES_HEADER: &str = "x-actor-roles";

impl<S> FromRequestParts<S> for TenantAuth
where
    S: Send + Sync,
    AppState: FromRef<S>,
{
    type Rejection = ApiError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app = AppState::from_ref(state);
        match app.config.auth_mode {
            AuthMode::Dev => Self::from_dev_headers(parts),
            AuthMode::Oidc => {
                let validator = app.oidc.ok_or(ApiError::Unauthorized)?;
                let header = header_str(parts, "authorization").ok_or(ApiError::Unauthorized)?;
                let token = header
                    .strip_prefix("Bearer ")
                    .ok_or(ApiError::Unauthorized)?;
                validator.validate(token).await.map(TenantAuth)
            }
            AuthMode::Local => {
                let header = header_str(parts, "authorization").ok_or(ApiError::Unauthorized)?;
                let token = header
                    .strip_prefix("Bearer ")
                    .ok_or(ApiError::Unauthorized)?;
                let session = app
                    .local_auth
                    .resolve_session(&crate::local_auth::hash_token(token))
                    .await
                    .map_err(|_| ApiError::Internal)?
                    .ok_or(ApiError::Unauthorized)?;
                let actor = ActorId::new(&session.username).map_err(|_| ApiError::Unauthorized)?;
                Ok(TenantAuth(TenantContext::new(
                    session.tenant,
                    actor,
                    vec![session.role],
                )))
            }
        }
    }
}

impl TenantAuth {
    /// Dev mode: trust static identity headers. Local development and
    /// tests only - never reachable when auth_mode is Oidc.
    fn from_dev_headers(parts: &Parts) -> Result<Self, ApiError> {
        let tenant_raw = header_str(parts, TENANT_HEADER).ok_or(ApiError::Unauthorized)?;
        let actor_raw = header_str(parts, ACTOR_HEADER).ok_or(ApiError::Unauthorized)?;

        let tenant = TenantId::parse(tenant_raw).map_err(|_| ApiError::Unauthorized)?;
        let actor = ActorId::new(actor_raw).map_err(|_| ApiError::Unauthorized)?;

        // Dev mode: roles arrive as a comma-separated header; absent means
        // end user. OIDC mode maps IdP groups instead.
        let roles = header_str(parts, ROLES_HEADER)
            .map(parse_roles)
            .unwrap_or_else(|| vec![Role::EndUser]);

        Ok(TenantAuth(TenantContext::new(tenant, actor, roles)))
    }
}

fn header_str<'a>(parts: &'a Parts, name: &str) -> Option<&'a str> {
    parts.headers.get(name).and_then(|v| v.to_str().ok())
}

fn parse_roles(raw: &str) -> Vec<Role> {
    raw.split(',')
        .filter_map(|r| match r.trim() {
            "agent" => Some(Role::Agent),
            "tenant_admin" => Some(Role::TenantAdmin),
            "end_user" => Some(Role::EndUser),
            _ => None,
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn role_parsing_ignores_unknown_values() {
        assert_eq!(
            parse_roles("agent,tenant_admin"),
            vec![Role::Agent, Role::TenantAdmin]
        );
        assert_eq!(parse_roles("superuser"), Vec::<Role>::new());
        assert_eq!(parse_roles(" agent "), vec![Role::Agent]);
    }
}
