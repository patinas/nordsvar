//! Tenant isolation primitives.
//!
//! Every Nordsvar resource (knowledge-base collection, session, audit log
//! stream) is owned by exactly one tenant. Cross-tenant access is a bug,
//! not a configuration option. These types make the boundary explicit in
//! signatures instead of relying on convention.
//!
//! The rules enforced here:
//! - A [`TenantId`] is an opaque UUID newtype; raw strings never flow into
//!   storage layers.
//! - [`TenantScoped`] binds a value to its owning tenant, so a handler that
//!   only holds a scoped value cannot query outside its tenant.
//! - [`TenantContext`] carries the authenticated actor and their roles; role
//!   checks happen before any scoped operation.

use serde::{Deserialize, Serialize};
use std::fmt;
use uuid::Uuid;

/// Errors raised when constructing or using tenant-scoped values.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum TenantError {
    /// The raw string was not a valid tenant id (UUID).
    #[error("invalid tenant id: {0:?}")]
    InvalidId(String),
    /// An actor id was empty or whitespace-only.
    #[error("invalid actor id: must be non-empty")]
    InvalidActor,
}

/// Opaque tenant identifier. Wraps a UUID so bare strings cannot be
/// passed where tenant scope is required.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct TenantId(Uuid);

impl TenantId {
    /// Generate a fresh tenant id (provisioning path).
    pub fn new() -> Self {
        Self(Uuid::new_v4())
    }

    /// Wrap an existing UUID (persistence round-trip).
    pub fn from_uuid(uuid: Uuid) -> Self {
        Self(uuid)
    }

    /// Parse a tenant id from its canonical string form.
    pub fn parse(raw: &str) -> Result<Self, TenantError> {
        Uuid::parse_str(raw.trim())
            .map(Self)
            .map_err(|_| TenantError::InvalidId(raw.to_string()))
    }

    pub fn as_uuid(&self) -> &Uuid {
        &self.0
    }
}

impl Default for TenantId {
    fn default() -> Self {
        Self::new()
    }
}

impl fmt::Display for TenantId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<TenantId> for String {
    fn from(id: TenantId) -> Self {
        id.to_string()
    }
}

impl TryFrom<&str> for TenantId {
    type Error = TenantError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        Self::parse(value)
    }
}

impl Serialize for TenantId {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.collect_str(&self.0)
    }
}

impl<'de> Deserialize<'de> for TenantId {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let raw = String::deserialize(deserializer)?;
        Self::parse(&raw).map_err(serde::de::Error::custom)
    }
}

/// Authenticated actor within a tenant: an opaque, non-empty identifier
/// (typically the SSO subject claim).
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(try_from = "String", into = "String")]
pub struct ActorId(String);

impl ActorId {
    pub fn new(raw: impl Into<String>) -> Result<Self, TenantError> {
        let raw = raw.into();
        if raw.trim().is_empty() {
            return Err(TenantError::InvalidActor);
        }
        Ok(Self(raw))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl fmt::Display for ActorId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

impl From<ActorId> for String {
    fn from(id: ActorId) -> Self {
        id.0
    }
}

impl TryFrom<String> for ActorId {
    type Error = TenantError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        Self::new(value)
    }
}

/// Roles recognized by the platform. Mapped from IdP groups/claims at the
/// authentication boundary (see services/api auth module).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Role {
    /// End user joining a support session.
    EndUser,
    /// IT manager / support agent: KB admin and session oversight.
    Agent,
    /// Tenant administrator: tenant configuration and audit export.
    TenantAdmin,
}

impl Role {
    /// Roles that may administer the knowledge base.
    pub fn can_administer_kb(self) -> bool {
        matches!(self, Role::Agent | Role::TenantAdmin)
    }

    /// Roles that may read the tenant audit stream.
    pub fn can_read_audit(self) -> bool {
        matches!(self, Role::TenantAdmin)
    }
}

/// The authenticated tenant scope for one request: which tenant, which
/// actor, which roles. Handlers receive this and pass the tenant on to
/// every storage call.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TenantContext {
    tenant: TenantId,
    actor: ActorId,
    roles: Vec<Role>,
}

impl TenantContext {
    pub fn new(tenant: TenantId, actor: ActorId, roles: Vec<Role>) -> Self {
        Self {
            tenant,
            actor,
            roles,
        }
    }

    pub fn tenant(&self) -> TenantId {
        self.tenant
    }

    pub fn actor(&self) -> &ActorId {
        &self.actor
    }

    pub fn roles(&self) -> &[Role] {
        &self.roles
    }

    pub fn has_role(&self, role: Role) -> bool {
        self.roles.contains(&role)
    }

    /// Scope a value to this context's tenant.
    pub fn scope<T>(&self, value: T) -> TenantScoped<T> {
        TenantScoped::new(self.tenant, value)
    }
}

/// A value bound to the tenant that owns it. Storage layers accept scoped
/// values, making an unscoped (or wrongly scoped) query a type error.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TenantScoped<T> {
    tenant: TenantId,
    value: T,
}

impl<T> TenantScoped<T> {
    pub fn new(tenant: TenantId, value: T) -> Self {
        Self { tenant, value }
    }

    pub fn tenant(&self) -> TenantId {
        self.tenant
    }

    pub fn value(&self) -> &T {
        &self.value
    }

    pub fn into_inner(self) -> T {
        self.value
    }

    pub fn map<U>(self, f: impl FnOnce(T) -> U) -> TenantScoped<U> {
        TenantScoped::new(self.tenant, f(self.value))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tenant_id_roundtrips_through_string() {
        let id = TenantId::new();
        let parsed = TenantId::parse(&id.to_string()).unwrap();
        assert_eq!(id, parsed);
    }

    #[test]
    fn tenant_id_rejects_garbage() {
        assert!(TenantId::parse("not-a-uuid").is_err());
        assert!(TenantId::parse("").is_err());
        assert!(TenantId::parse("550e8400-e29b-41d4-a716-44665544000").is_err());
    }

    #[test]
    fn tenant_id_serde_is_a_string() {
        let id = TenantId::new();
        let json = serde_json::to_string(&id).unwrap();
        assert_eq!(json, format!("\"{id}\""));
        let back: TenantId = serde_json::from_str(&json).unwrap();
        assert_eq!(id, back);
    }

    #[test]
    fn tenant_id_deserialize_rejects_invalid() {
        let err = serde_json::from_str::<TenantId>("\"nope\"");
        assert!(err.is_err());
    }

    #[test]
    fn actor_id_rejects_empty() {
        assert!(ActorId::new("").is_err());
        assert!(ActorId::new("   ").is_err());
        assert!(ActorId::new("user-1").is_ok());
    }

    #[test]
    fn role_permissions_match_security_doc() {
        assert!(!Role::EndUser.can_administer_kb());
        assert!(Role::Agent.can_administer_kb());
        assert!(Role::TenantAdmin.can_administer_kb());
        assert!(Role::TenantAdmin.can_read_audit());
        assert!(!Role::Agent.can_read_audit());
        assert!(!Role::EndUser.can_read_audit());
    }

    #[test]
    fn scoped_value_keeps_its_tenant_through_map() {
        let tenant = TenantId::new();
        let scoped = TenantScoped::new(tenant, 41).map(|v| v + 1);
        assert_eq!(scoped.tenant(), tenant);
        assert_eq!(*scoped.value(), 42);
    }

    #[test]
    fn context_scopes_to_its_own_tenant() {
        let tenant = TenantId::new();
        let ctx = TenantContext::new(tenant, ActorId::new("a").unwrap(), vec![Role::EndUser]);
        let scoped = ctx.scope("data");
        assert_eq!(scoped.tenant(), tenant);
        assert!(ctx.has_role(Role::EndUser));
        assert!(!ctx.has_role(Role::Agent));
    }

    mod property {
        use super::*;
        use proptest::prelude::*;

        proptest! {
            #[test]
            fn parse_display_roundtrip(bytes: [u8; 16]) {
                let id = TenantId::from_uuid(Uuid::from_bytes(bytes));
                prop_assert_eq!(TenantId::parse(&id.to_string()).unwrap(), id);
            }

            #[test]
            fn distinct_uuids_yield_distinct_tenants(a: [u8; 16], b: [u8; 16]) {
                let ta = TenantId::from_uuid(Uuid::from_bytes(a));
                let tb = TenantId::from_uuid(Uuid::from_bytes(b));
                prop_assert_eq!(ta == tb, a == b);
            }
        }
    }
}
