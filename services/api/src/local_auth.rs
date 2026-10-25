//! Local username/password auth (AUTH_MODE=local) - the self-hosting path
//! for operators without a corporate IdP. Passwords are hashed with
//! argon2id; API session tokens are random 244-bit values stored as
//! SHA-256 hashes with a 12-hour expiry.
//!
//! First-run setup: while zero local users exist, `POST /v1/setup/admin`
//! creates the first tenant administrator. Once any user exists the
//! endpoint closes permanently (409) - there is no way back to setup mode
//! short of wiping the database.

use crate::store::StoreError;
use argon2::password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;
use async_trait::async_trait;
use nordsvar_tenancy::{Role, TenantId};
use sha2::Digest;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::sync::RwLock;

/// How long a local session token stays valid.
pub const SESSION_TTL_SECS: u64 = 12 * 60 * 60;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LocalUser {
    pub tenant: TenantId,
    pub username: String,
    pub password_hash: String,
    pub role: Role,
    pub created_at_unix: u64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LocalSession {
    pub tenant: TenantId,
    pub username: String,
    pub role: Role,
    pub expires_at_unix: u64,
}

#[async_trait]
pub trait LocalAuthStore: Send + Sync {
    /// Total users across all tenants; gates first-run setup.
    async fn count_users(&self) -> Result<usize, StoreError>;
    async fn create_user(&self, user: LocalUser) -> Result<(), StoreError>;
    async fn get_user(
        &self,
        tenant: TenantId,
        username: &str,
    ) -> Result<Option<LocalUser>, StoreError>;
    /// Store a session by its token hash; the raw token is never stored.
    async fn create_session(
        &self,
        token_hash: &str,
        session: LocalSession,
    ) -> Result<(), StoreError>;
    /// Resolve a token hash to a live session; expired sessions count as
    /// absent.
    async fn resolve_session(&self, token_hash: &str) -> Result<Option<LocalSession>, StoreError>;
    /// Tenants that have at least one local user. Lets the login flow skip
    /// the tenant UUID when the deployment has exactly one (the common
    /// single-tenant self-host).
    async fn tenants_with_users(&self) -> Result<Vec<TenantId>, StoreError>;
}

pub fn now_unix() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

/// Hash a password for storage (argon2id, random salt).
pub fn hash_password(password: &str) -> Result<String, StoreError> {
    let salt = SaltString::generate(&mut argon2::password_hash::rand_core::OsRng);
    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|e| StoreError::new(format!("password hash: {e}")))
}

/// Verify a password against a stored argon2id hash.
pub fn verify_password(password: &str, hash: &str) -> bool {
    PasswordHash::new(hash)
        .ok()
        .map(|parsed| {
            Argon2::default()
                .verify_password(password.as_bytes(), &parsed)
                .is_ok()
        })
        .unwrap_or(false)
}

/// A precomputed argon2id hash used to equalize login timing when the
/// username does not exist (no user-enumeration oracle via response time).
pub fn dummy_hash() -> &'static str {
    static DUMMY: std::sync::OnceLock<String> = std::sync::OnceLock::new();
    DUMMY.get_or_init(|| hash_password("nordsvar-dummy-password").expect("argon2 works"))
}

/// Generate a fresh session token (returned to the caller exactly once).
pub fn new_session_token() -> String {
    // Two v4 UUIDs: 244 bits of CSPRNG entropy, hex-encoded.
    format!(
        "{}{}",
        uuid::Uuid::new_v4().simple(),
        uuid::Uuid::new_v4().simple()
    )
}

/// The storable form of a session token.
pub fn hash_token(token: &str) -> String {
    format!("{:x}", sha2::Sha256::digest(token.as_bytes()))
}

/// In-memory store for tests and development wiring.
#[derive(Default)]
pub struct InMemoryLocalAuth {
    // Physically separate map per tenant, mirroring the session store:
    // cross-tenant lookups cannot reach the wrong row.
    users: RwLock<HashMap<TenantId, HashMap<String, LocalUser>>>,
    sessions: RwLock<HashMap<String, LocalSession>>,
}

#[async_trait]
impl LocalAuthStore for InMemoryLocalAuth {
    async fn count_users(&self) -> Result<usize, StoreError> {
        Ok(self.users.read().await.values().map(|m| m.len()).sum())
    }

    async fn create_user(&self, user: LocalUser) -> Result<(), StoreError> {
        let mut users = self.users.write().await;
        let tenant_users = users.entry(user.tenant).or_default();
        if tenant_users.contains_key(&user.username) {
            return Err(StoreError::new(format!(
                "user {} already exists",
                user.username
            )));
        }
        tenant_users.insert(user.username.clone(), user);
        Ok(())
    }

    async fn get_user(
        &self,
        tenant: TenantId,
        username: &str,
    ) -> Result<Option<LocalUser>, StoreError> {
        Ok(self
            .users
            .read()
            .await
            .get(&tenant)
            .and_then(|m| m.get(username))
            .cloned())
    }

    async fn create_session(
        &self,
        token_hash: &str,
        session: LocalSession,
    ) -> Result<(), StoreError> {
        self.sessions
            .write()
            .await
            .insert(token_hash.to_string(), session);
        Ok(())
    }

    async fn resolve_session(&self, token_hash: &str) -> Result<Option<LocalSession>, StoreError> {
        let session = self.sessions.read().await.get(token_hash).cloned();
        Ok(match session {
            Some(s) if s.expires_at_unix > now_unix() => Some(s),
            _ => None,
        })
    }

    async fn tenants_with_users(&self) -> Result<Vec<TenantId>, StoreError> {
        Ok(self
            .users
            .read()
            .await
            .iter()
            .filter(|(_, m)| !m.is_empty())
            .map(|(t, _)| *t)
            .collect())
    }
}

/// Shared PgPool-backed implementation lives in store_pg.rs; this alias
/// keeps call sites readable.
pub type SharedLocalAuth = Arc<dyn LocalAuthStore>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn password_roundtrip_and_wrong_password_rejected() {
        let hash = hash_password("korrect-hest-batteri-klampe").unwrap();
        assert!(verify_password("korrect-hest-batteri-klampe", &hash));
        assert!(!verify_password("forkert", &hash));
    }

    #[test]
    fn tokens_are_unique_and_hashes_match() {
        let a = new_session_token();
        let b = new_session_token();
        assert_ne!(a, b);
        assert_eq!(a.len(), 64);
        assert_eq!(hash_token(&a), hash_token(&a));
        assert_ne!(hash_token(&a), hash_token(&b));
    }

    #[tokio::test]
    async fn in_memory_isolates_tenants() {
        let store = InMemoryLocalAuth::default();
        let tenant_a = TenantId::new();
        let tenant_b = TenantId::new();
        let user = LocalUser {
            tenant: tenant_a,
            username: "admin".into(),
            password_hash: hash_password("hemmelig-kode-123").unwrap(),
            role: Role::TenantAdmin,
            created_at_unix: now_unix(),
        };
        store.create_user(user).await.unwrap();
        assert_eq!(store.count_users().await.unwrap(), 1);
        assert!(store.get_user(tenant_a, "admin").await.unwrap().is_some());
        // Same username in another tenant: not visible.
        assert!(store.get_user(tenant_b, "admin").await.unwrap().is_none());
    }

    #[tokio::test]
    async fn duplicate_username_conflicts() {
        let store = InMemoryLocalAuth::default();
        let tenant = TenantId::new();
        let mk = || LocalUser {
            tenant,
            username: "admin".into(),
            password_hash: "h".into(),
            role: Role::TenantAdmin,
            created_at_unix: 0,
        };
        store.create_user(mk()).await.unwrap();
        let err = store.create_user(mk()).await.unwrap_err();
        assert!(err.to_string().contains("already exists"));
    }

    #[tokio::test]
    async fn expired_sessions_do_not_resolve() {
        let store = InMemoryLocalAuth::default();
        let session = LocalSession {
            tenant: TenantId::new(),
            username: "admin".into(),
            role: Role::TenantAdmin,
            expires_at_unix: now_unix() - 1,
        };
        store.create_session("deadhash", session).await.unwrap();
        assert!(store.resolve_session("deadhash").await.unwrap().is_none());
    }
}
