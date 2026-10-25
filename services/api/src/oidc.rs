//! OIDC bearer-token validation (AuthMode::Oidc).
//!
//! Production auth: callers authenticate at their corporate IdP (Entra ID
//! and any OIDC-compliant provider) and send the access token as
//! `Authorization: Bearer`. This module validates the signature against the
//! IdP's JWKS, enforces issuer/audience/expiry, and maps claims into the
//! tenant context:
//!
//! - `sub` -> actor id
//! - tenant claim (default `tid`) -> tenant id
//! - groups claim (default `groups`) -> roles via configured group names
//!
//! Tenant isolation is unchanged: the tenant comes from the validated
//! token, and every storage call stays keyed on it.

use crate::error::ApiError;
use async_trait::async_trait;
use jsonwebtoken::jwk::JwkSet;
use nordsvar_tenancy::{ActorId, Role, TenantContext, TenantId};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;

/// Static OIDC configuration (operator-provided, per deployment).
#[derive(Debug, Clone)]
pub struct OidcConfig {
    pub issuer: String,
    pub audience: String,
    pub jwks_url: String,
    /// Claim carrying the Nordsvar tenant id. Entra ID: `tid`.
    pub tenant_claim: String,
    /// Claim carrying group memberships.
    pub groups_claim: String,
    /// Group name mapped to the agent role. None: no agent mapping.
    pub agent_group: Option<String>,
    /// Group name mapped to the tenant-admin role. None: no admin mapping.
    pub admin_group: Option<String>,
}

impl OidcConfig {
    /// Load from the environment. Returns None when AUTH_MODE is not
    /// `oidc`. Missing OIDC values in oidc mode are a startup error -
    /// never silently fall back to dev mode.
    pub fn from_env(auth_mode: crate::config::AuthMode) -> Result<Option<Self>, String> {
        use crate::config::AuthMode;
        match auth_mode {
            AuthMode::Dev | AuthMode::Local => Ok(None),
            AuthMode::Oidc => {
                let required = |name: &str| -> Result<String, String> {
                    std::env::var(name)
                        .ok()
                        .filter(|v| !v.is_empty())
                        .ok_or_else(|| format!("AUTH_MODE=oidc requires {name}"))
                };
                Ok(Some(Self {
                    issuer: required("OIDC_ISSUER")?,
                    audience: required("OIDC_AUDIENCE")?,
                    jwks_url: required("OIDC_JWKS_URL")?,
                    tenant_claim: std::env::var("OIDC_TENANT_CLAIM")
                        .unwrap_or_else(|_| "tid".into()),
                    groups_claim: std::env::var("OIDC_GROUPS_CLAIM")
                        .unwrap_or_else(|_| "groups".into()),
                    agent_group: std::env::var("OIDC_GROUP_AGENT")
                        .ok()
                        .filter(|v| !v.is_empty()),
                    admin_group: std::env::var("OIDC_GROUP_TENANT_ADMIN")
                        .ok()
                        .filter(|v| !v.is_empty()),
                }))
            }
        }
    }
}

/// Where JWKS documents come from. HTTP in production; static in tests.
#[async_trait]
pub trait JwksSource: Send + Sync {
    async fn fetch(&self) -> Result<JwkSet, String>;
}

/// Fetches the IdP's JWKS document over HTTP(S).
pub struct HttpJwksSource {
    url: String,
    client: reqwest::Client,
}

impl HttpJwksSource {
    pub fn new(url: impl Into<String>) -> Self {
        Self {
            url: url.into(),
            client: reqwest::Client::new(),
        }
    }
}

#[async_trait]
impl JwksSource for HttpJwksSource {
    async fn fetch(&self) -> Result<JwkSet, String> {
        self.client
            .get(&self.url)
            .send()
            .await
            .map_err(|e| e.to_string())?
            .error_for_status()
            .map_err(|e| e.to_string())?
            .json::<JwkSet>()
            .await
            .map_err(|e| e.to_string())
    }
}

/// Validates bearer tokens with a cached JWKS (refreshed on unknown kid,
/// then at most once per request; TTL-bounded otherwise).
pub struct OidcValidator {
    config: OidcConfig,
    source: Arc<dyn JwksSource>,
    cache: RwLock<Option<(JwkSet, Instant)>>,
    ttl: Duration,
}

impl OidcValidator {
    pub fn new(config: OidcConfig, source: Arc<dyn JwksSource>) -> Self {
        Self {
            config,
            source,
            cache: RwLock::new(None),
            ttl: Duration::from_secs(300),
        }
    }

    /// Validate a bearer token and map it to a tenant context.
    pub async fn validate(&self, token: &str) -> Result<TenantContext, ApiError> {
        let header = jsonwebtoken::decode_header(token).map_err(|_| ApiError::Unauthorized)?;
        let kid = header.kid.ok_or(ApiError::Unauthorized)?;

        let jwks = self.jwks(&kid).await?;
        let jwk = jwks
            .keys
            .iter()
            .find(|k| k.common.key_id.as_deref() == Some(kid.as_str()))
            .ok_or(ApiError::Unauthorized)?;
        let key = jsonwebtoken::DecodingKey::from_jwk(jwk).map_err(|_| ApiError::Unauthorized)?;

        let mut validation = jsonwebtoken::Validation::new(header.alg);
        validation.set_issuer(std::slice::from_ref(&self.config.issuer));
        validation.set_audience(std::slice::from_ref(&self.config.audience));
        let data = jsonwebtoken::decode::<serde_json::Value>(token, &key, &validation)
            .map_err(|_| ApiError::Unauthorized)?;
        let claims = data.claims;

        let sub = claims
            .get("sub")
            .and_then(|v| v.as_str())
            .ok_or(ApiError::Unauthorized)?;
        let tenant_raw = claims
            .get(&self.config.tenant_claim)
            .and_then(|v| v.as_str())
            .ok_or(ApiError::Unauthorized)?;
        let groups: Vec<&str> = claims
            .get(&self.config.groups_claim)
            .and_then(|v| v.as_array())
            .map(|a| a.iter().filter_map(|g| g.as_str()).collect())
            .unwrap_or_default();

        let tenant = TenantId::parse(tenant_raw).map_err(|_| ApiError::Unauthorized)?;
        let actor = ActorId::new(sub).map_err(|_| ApiError::Unauthorized)?;
        let mut roles = vec![Role::EndUser];
        if self
            .config
            .agent_group
            .as_deref()
            .is_some_and(|g| groups.contains(&g))
        {
            roles.push(Role::Agent);
        }
        if self
            .config
            .admin_group
            .as_deref()
            .is_some_and(|g| groups.contains(&g))
        {
            roles.push(Role::TenantAdmin);
        }
        Ok(TenantContext::new(tenant, actor, roles))
    }

    /// Return a JWKS containing `kid`, using the TTL cache and refreshing
    /// once when the cached set lacks the key (key rotation).
    async fn jwks(&self, kid: &str) -> Result<JwkSet, ApiError> {
        if let Some((set, at)) = self.cache.read().await.as_ref() {
            if at.elapsed() < self.ttl
                && set
                    .keys
                    .iter()
                    .any(|k| k.common.key_id.as_deref() == Some(kid))
            {
                return Ok(set.clone());
            }
        }
        let fresh = self
            .source
            .fetch()
            .await
            .map_err(|_| ApiError::Unauthorized)?;
        *self.cache.write().await = Some((fresh.clone(), Instant::now()));
        Ok(fresh)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicUsize, Ordering};

    const TENANT: &str = "3f6b1c2e-0000-4000-8000-abcdefabcdef";
    const ISSUER: &str = "https://login.example.test/tenant/v2.0";
    const AUDIENCE: &str = "api://nordsvar";

    /// Test-only RSA-2048 key (generated for this test module, never used
    /// anywhere else). The matching public half lives in TEST_JWKS.
    const TEST_PRIVATE_KEY: &str = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC2YikE3caZQ8uj\nn5brbUC1GkvSXuLXXBLN2sZPZHRx5mFz6BD541alc7LtqRIzqscOzlJDZ+xNPz9V\nW+e9R31RcY00i7uZS8G64KqvK5bfyqCrLZdeDCc1d6lDtx0i8uDJOTg78lnL7u6l\neVWX1lFPRBJfEFw85F+5DGsRFU3Q0lasTazXavfsJOwNnxJSmDL0pC3C7pcvDTQr\n9iRzJoSKpEQDa6yC9pHddx73g1/EQFjfItOjUCYVxeCIVMHsNZsGRr3HfCNF5LK2\n5RhItKwMqE6X2ge/nY6fmNBxnNKnZJ9akjpZ/h3Ofhmdt/V47Ix7a22RkqN0O4vL\no5CZgzNxAgMBAAECggEALEsgG6SxygCfSPRl7nS42ZLSlbuCG1vq3DA058ylhBD3\nm3LhhpK59RIpgxMDzuT7lYKxk1m+l48T9krM99jQHFK3wKpr6+GsYdKU2Vh8eorH\nJPN8VrScZB2Uz9N9ocJ7KZt6JwLnYIH9VtYmHatI0Xeef5RlVkt/XN1hdkNmg99c\nN2H+AhXG2Z+veIsnVErwpOr5KxGvq95fQbYtyOywiw1w0iqOWb4Ww+o/z9VTWDOr\n/vyRdK2BDaD17OLGfVI/hmn8AZWTWgDPzAvJdW9EZeU1cMvmxoJ1snBRZzFShi92\nsiv2HzDnVAGiplDzxrAF+PTaygU44GmlkBtvg2MOnQKBgQDpLdaeeDWTB0GJEbdo\n2uGg48SoxSd8w8FI9NA4kXCW/jzg9zX5LlbX0GA00HDCVhsEWuY+JWdaEhnHvYaL\ngrjeejkCz+WrETZCjP8xZHNbvpVABsw4azJDXHybc5VuV4TQ3HgPIXNCROEPcRwX\nFcsd+wOeEEo/OO5mJhbstS8PzQKBgQDIO6sHqd7uOf494MwLH6frPCRINFd4lUic\nitK52qqLe7d+AtjDAwmwdPPzt6Wzt+6JQhG8kYVJ0p+P92pyxkPce9EFl7h9GBfY\nVtgOsDoortffrVYlujhgTEIA3P8RnXHI3Ga7n03MMt4yxHtxBUEhif+c/JBbncvq\nPVocGp6mNQKBgHIO2vFPCZ2uqe7bPKTMlBs37oVDUupjcpM2NPfGpJUnLS45niwR\n76bHJZgP8WgN6E88C22QrDpRqkyat0pcmgMxM9vdR5Fi7PCmuVk2snrJAYZ9DL34\nKXDrt4PuiMSdiLkFbrCwAwoCWThNcpkULvOuSfmyLC86sNpEfWgxxCBtAoGAIBSP\nPlcVBI3+EePmTRHxUVr9ZSQdr5AbZhlH0cca8+YKbAIAwJ3H+6GBRFb0EWsyqIMR\nXGjkNgOs1OALCgCB9t1Pi9nXERO/HkYrr47EgqggphGbb8f6KFOPb5v4sdXL2SaW\nvxCy4jh0KSYZsO3qlXkKnxhH+KW7efgCa+ZH7NECgYEAy8acugkBUKmVCEVUiO/w\nHP1DgCVqrXHnbw/XI5L5BpJt1wrGjptW3/cxJZ0xgELdOZu/VEymmrLY9s/wkhxo\njjIyHiGExGiIaQC0LUS+zc64IzlCpNI6mqQg9UIwhtsLwcxQL038dvbqrqPX6mQ2\nlG4J1wFslt2Y6R7SbBTusho=\n-----END PRIVATE KEY-----";

    const TEST_JWKS: &str = r#"{"keys":[{"kty":"RSA","use":"sig","kid":"test-key-1","alg":"RS256","n":"tmIpBN3GmUPLo5-W621AtRpL0l7i11wSzdrGT2R0ceZhc-gQ-eNWpXOy7akSM6rHDs5SQ2fsTT8_VVvnvUd9UXGNNIu7mUvBuuCqryuW38qgqy2XXgwnNXepQ7cdIvLgyTk4O_JZy-7upXlVl9ZRT0QSXxBcPORfuQxrERVN0NJWrE2s12r37CTsDZ8SUpgy9KQtwu6XLw00K_YkcyaEiqREA2usgvaR3Xce94NfxEBY3yLTo1AmFcXgiFTB7DWbBka9x3wjReSytuUYSLSsDKhOl9oHv52On5jQcZzSp2SfWpI6Wf4dzn4Znbf1eOyMe2ttkZKjdDuLy6OQmYMzcQ","e":"AQAB"}]}"#;

    fn test_config() -> OidcConfig {
        OidcConfig {
            issuer: ISSUER.into(),
            audience: AUDIENCE.into(),
            jwks_url: "https://login.example.test/jwks".into(),
            tenant_claim: "tid".into(),
            groups_claim: "groups".into(),
            agent_group: Some("nordsvar-agents".into()),
            admin_group: Some("nordsvar-admins".into()),
        }
    }

    struct StaticJwks {
        body: &'static str,
        fetches: AtomicUsize,
    }

    #[async_trait]
    impl JwksSource for StaticJwks {
        async fn fetch(&self) -> Result<JwkSet, String> {
            self.fetches.fetch_add(1, Ordering::SeqCst);
            serde_json::from_str(self.body).map_err(|e| e.to_string())
        }
    }

    fn validator(source: Arc<dyn JwksSource>) -> OidcValidator {
        OidcValidator::new(test_config(), source)
    }

    fn sign(claims: serde_json::Value) -> String {
        let mut header = jsonwebtoken::Header::new(jsonwebtoken::Algorithm::RS256);
        header.kid = Some("test-key-1".into());
        jsonwebtoken::encode(
            &header,
            &claims,
            &jsonwebtoken::EncodingKey::from_rsa_pem(TEST_PRIVATE_KEY.as_bytes()).unwrap(),
        )
        .unwrap()
    }

    fn base_claims() -> serde_json::Value {
        serde_json::json!({
            "sub": "user-123",
            "tid": TENANT,
            "iss": ISSUER,
            "aud": AUDIENCE,
            "exp": 4_000_000_000_i64,
            "groups": ["staff", "nordsvar-agents"],
        })
    }

    #[tokio::test]
    async fn valid_token_maps_tenant_actor_and_roles() {
        let v = validator(Arc::new(StaticJwks {
            body: TEST_JWKS,
            fetches: AtomicUsize::new(0),
        }));
        let ctx = v.validate(&sign(base_claims())).await.unwrap();
        assert_eq!(ctx.tenant(), TenantId::parse(TENANT).unwrap());
        assert_eq!(ctx.actor().as_str(), "user-123");
        assert!(ctx.has_role(Role::Agent));
        assert!(ctx.has_role(Role::EndUser));
        assert!(!ctx.has_role(Role::TenantAdmin));
    }

    #[tokio::test]
    async fn wrong_audience_is_rejected() {
        let v = validator(Arc::new(StaticJwks {
            body: TEST_JWKS,
            fetches: AtomicUsize::new(0),
        }));
        let mut claims = base_claims();
        claims["aud"] = serde_json::json!("api://other");
        assert!(v.validate(&sign(claims)).await.is_err());
    }

    #[tokio::test]
    async fn wrong_issuer_is_rejected() {
        let v = validator(Arc::new(StaticJwks {
            body: TEST_JWKS,
            fetches: AtomicUsize::new(0),
        }));
        let mut claims = base_claims();
        claims["iss"] = serde_json::json!("https://evil.example.test/");
        assert!(v.validate(&sign(claims)).await.is_err());
    }

    #[tokio::test]
    async fn expired_token_is_rejected() {
        let v = validator(Arc::new(StaticJwks {
            body: TEST_JWKS,
            fetches: AtomicUsize::new(0),
        }));
        let mut claims = base_claims();
        claims["exp"] = serde_json::json!(1_000_000_000_i64);
        assert!(v.validate(&sign(claims)).await.is_err());
    }

    #[tokio::test]
    async fn missing_tenant_claim_is_rejected() {
        let v = validator(Arc::new(StaticJwks {
            body: TEST_JWKS,
            fetches: AtomicUsize::new(0),
        }));
        let mut claims = base_claims();
        claims.as_object_mut().unwrap().remove("tid");
        assert!(v.validate(&sign(claims)).await.is_err());
    }

    #[tokio::test]
    async fn no_groups_means_end_user() {
        let v = validator(Arc::new(StaticJwks {
            body: TEST_JWKS,
            fetches: AtomicUsize::new(0),
        }));
        let mut claims = base_claims();
        claims.as_object_mut().unwrap().remove("groups");
        let ctx = v.validate(&sign(claims)).await.unwrap();
        assert_eq!(ctx.roles(), &[Role::EndUser]);
    }

    #[tokio::test]
    async fn admin_group_maps_to_tenant_admin() {
        let v = validator(Arc::new(StaticJwks {
            body: TEST_JWKS,
            fetches: AtomicUsize::new(0),
        }));
        let mut claims = base_claims();
        claims["groups"] = serde_json::json!(["nordsvar-admins"]);
        let ctx = v.validate(&sign(claims)).await.unwrap();
        assert!(ctx.has_role(Role::TenantAdmin));
    }

    #[tokio::test]
    async fn unknown_kid_triggers_one_jwks_refresh() {
        let source = Arc::new(StaticJwks {
            body: TEST_JWKS,
            fetches: AtomicUsize::new(0),
        });
        let v = validator(source.clone());
        // First call populates the cache (1 fetch).
        v.validate(&sign(base_claims())).await.unwrap();
        // Second call hits the cache (still 1 fetch).
        v.validate(&sign(base_claims())).await.unwrap();
        assert_eq!(source.fetches.load(Ordering::SeqCst), 1);
    }

    #[tokio::test]
    async fn token_without_kid_is_rejected() {
        let v = validator(Arc::new(StaticJwks {
            body: TEST_JWKS,
            fetches: AtomicUsize::new(0),
        }));
        let header = jsonwebtoken::Header::new(jsonwebtoken::Algorithm::RS256);
        let token = jsonwebtoken::encode(
            &header,
            &base_claims(),
            &jsonwebtoken::EncodingKey::from_rsa_pem(TEST_PRIVATE_KEY.as_bytes()).unwrap(),
        )
        .unwrap();
        assert!(v.validate(&token).await.is_err());
    }
}
