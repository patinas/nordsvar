//! LiveKit join-token minting. Tokens are short-lived HS256 JWTs carrying
//! the room, the participant identity, and tenant metadata. The AI worker
//! binds sessions to tenants from this metadata before joining a room.

use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use nordsvar_tenancy::TenantId;
use serde::{Deserialize, Serialize};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

/// LiveKit video grant (subset we use). Field names match LiveKit's JWT spec.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct VideoGrant {
    #[serde(rename = "roomJoin")]
    pub room_join: bool,
    pub room: String,
    #[serde(rename = "canPublish")]
    pub can_publish: bool,
    #[serde(rename = "canSubscribe")]
    pub can_subscribe: bool,
    #[serde(rename = "canPublishData")]
    pub can_publish_data: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JoinClaims {
    pub iss: String,
    pub sub: String,
    pub nbf: u64,
    pub exp: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    /// Tenant id is embedded as participant metadata so the AI worker can
    /// verify room-tenant binding without trusting client-supplied room names.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<String>,
    pub video: VideoGrant,
}

#[derive(Debug, thiserror::Error)]
pub enum TokenError {
    #[error("failed to sign join token")]
    Sign,
    #[error("invalid join token")]
    Invalid,
}

fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

/// Metadata payload embedded in the token for the AI worker.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ParticipantMetadata {
    pub tenant_id: TenantId,
}

pub fn mint_join_token(
    api_key: &str,
    api_secret: &str,
    room: &str,
    identity: &str,
    display_name: Option<&str>,
    tenant: TenantId,
    ttl: Duration,
) -> Result<String, TokenError> {
    let now = now_secs();
    let metadata = serde_json::to_string(&ParticipantMetadata { tenant_id: tenant })
        .map_err(|_| TokenError::Sign)?;
    let claims = JoinClaims {
        iss: api_key.to_string(),
        sub: identity.to_string(),
        nbf: now,
        exp: now + ttl.as_secs(),
        name: display_name.map(str::to_string),
        metadata: Some(metadata),
        video: VideoGrant {
            room_join: true,
            room: room.to_string(),
            can_publish: true,
            can_subscribe: true,
            can_publish_data: true,
        },
    };
    encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(api_secret.as_bytes()),
    )
    .map_err(|_| TokenError::Sign)
}

/// Verify and decode a token (used by tests and by any internal consumer
/// that re-checks a presented token).
pub fn verify_join_token(api_secret: &str, token: &str) -> Result<JoinClaims, TokenError> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.validate_exp = true;
    // No leeway: join tokens are short-lived and minted on demand, so
    // clock-tolerance leniency is not worth the security slack.
    validation.leeway = 0;
    decode::<JoinClaims>(
        token,
        &DecodingKey::from_secret(api_secret.as_bytes()),
        &validation,
    )
    .map(|data| data.claims)
    .map_err(|_| TokenError::Invalid)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn minted_token_roundtrips_with_room_and_tenant() {
        let tenant = TenantId::new();
        let token = mint_join_token(
            "testkey",
            "testsecret",
            "room-1",
            "user-1",
            Some("Anders"),
            tenant,
            Duration::from_secs(60),
        )
        .unwrap();
        let claims = verify_join_token("testsecret", &token).unwrap();
        assert_eq!(claims.iss, "testkey");
        assert_eq!(claims.sub, "user-1");
        assert_eq!(claims.name.as_deref(), Some("Anders"));
        assert_eq!(claims.video.room, "room-1");
        assert!(claims.video.room_join && claims.video.can_publish && claims.video.can_subscribe);
        assert!(claims.exp > claims.nbf);
        let meta: ParticipantMetadata = serde_json::from_str(&claims.metadata.unwrap()).unwrap();
        assert_eq!(meta.tenant_id, tenant);
    }

    #[test]
    fn wrong_secret_is_rejected() {
        let token = mint_join_token(
            "k",
            "right-secret",
            "room",
            "user",
            None,
            TenantId::new(),
            Duration::from_secs(60),
        )
        .unwrap();
        assert!(verify_join_token("wrong-secret", &token).is_err());
    }

    #[test]
    fn expired_token_is_rejected() {
        let token = mint_join_token(
            "k",
            "s",
            "room",
            "user",
            None,
            TenantId::new(),
            Duration::from_secs(0),
        )
        .unwrap();
        // TTL of 0 means exp == nbf == now; validation must reject it once
        // it is in the past. Give the clock a moment to pass `exp`.
        std::thread::sleep(std::time::Duration::from_secs(2));
        assert!(verify_join_token("s", &token).is_err());
    }
}
