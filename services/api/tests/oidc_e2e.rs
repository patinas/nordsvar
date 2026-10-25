//! End-to-end OIDC: the real API router in AuthMode::Oidc, served over
//! real HTTP, validating bearer tokens against a stub IdP's JWKS endpoint
//! over real HTTP (HttpJwksSource, not the static test source). Covers
//! what the unit tests cannot: the network fetch, the TTL cache, and the
//! unknown-kid refresh against a live JWKS document.

use axum::{routing::get, Json, Router};
use nordsvar_api::app::{build_router, AppState};
use nordsvar_api::config::{AuthMode, Config};
use nordsvar_api::oidc::OidcConfig;
use std::sync::Arc;
use tokio::sync::RwLock;

const TENANT: &str = "3f6b1c2e-0000-4000-8000-abcdefabcdef";
const ISSUER: &str = "https://login.example.test/tenant/v2.0";
const AUDIENCE: &str = "api://nordsvar";

// Test-only keys. Key A is the oidc.rs module's pair; key B exists only
// here for the rotation test. Neither is used anywhere else.
const TEST_PRIVATE_KEY: &str = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC2YikE3caZQ8uj\nn5brbUC1GkvSXuLXXBLN2sZPZHRx5mFz6BD541alc7LtqRIzqscOzlJDZ+xNPz9V\nW+e9R31RcY00i7uZS8G64KqvK5bfyqCrLZdeDCc1d6lDtx0i8uDJOTg78lnL7u6l\neVWX1lFPRBJfEFw85F+5DGsRFU3Q0lasTazXavfsJOwNnxJSmDL0pC3C7pcvDTQr\n9iRzJoSKpEQDa6yC9pHddx73g1/EQFjfItOjUCYVxeCIVMHsNZsGRr3HfCNF5LK2\n5RhItKwMqE6X2ge/nY6fmNBxnNKnZJ9akjpZ/h3Ofhmdt/V47Ix7a22RkqN0O4vL\no5CZgzNxAgMBAAECggEALEsgG6SxygCfSPRl7nS42ZLSlbuCG1vq3DA058ylhBD3\nm3LhhpK59RIpgxMDzuT7lYKxk1m+l48T9krM99jQHFK3wKpr6+GsYdKU2Vh8eorH\nJPN8VrScZB2Uz9N9ocJ7KZt6JwLnYIH9VtYmHatI0Xeef5RlVkt/XN1hdkNmg99c\nN2H+AhXG2Z+veIsnVErwpOr5KxGvq95fQbYtyOywiw1w0iqOWb4Ww+o/z9VTWDOr\n/vyRdK2BDaD17OLGfVI/hmn8AZWTWgDPzAvJdW9EZeU1cMvmxoJ1snBRZzFShi92\nsiv2HzDnVAGiplDzxrAF+PTaygU44GmlkBtvg2MOnQKBgQDpLdaeeDWTB0GJEbdo\n2uGg48SoxSd8w8FI9NA4kXCW/jzg9zX5LlbX0GA00HDCVhsEWuY+JWdaEhnHvYaL\ngrjeejkCz+WrETZCjP8xZHNbvpVABsw4azJDXHybc5VuV4TQ3HgPIXNCROEPcRwX\nFcsd+wOeEEo/OO5mJhbstS8PzQKBgQDIO6sHqd7uOf494MwLH6frPCRINFd4lUic\nitK52qqLe7d+AtjDAwmwdPPzt6Wzt+6JQhG8kYVJ0p+P92pyxkPce9EFl7h9GBfY\nVtgOsDoortffrVYlujhgTEIA3P8RnXHI3Ga7n03MMt4yxHtxBUEhif+c/JBbncvq\nPVocGp6mNQKBgHIO2vFPCZ2uqe7bPKTMlBs37oVDUupjcpM2NPfGpJUnLS45niwR\n76bHJZgP8WgN6E88C22QrDpRqkyat0pcmgMxM9vdR5Fi7PCmuVk2snrJAYZ9DL34\nKXDrt4PuiMSdiLkFbrCwAwoCWThNcpkULvOuSfmyLC86sNpEfWgxxCBtAoGAIBSP\nPlcVBI3+EePmTRHxUVr9ZSQdr5AbZhlH0cca8+YKbAIAwJ3H+6GBRFb0EWsyqIMR\nXGjkNgOs1OALCgCB9t1Pi9nXERO/HkYrr47EgqggphGbb8f6KFOPb5v4sdXL2SaW\nvxCy4jh0KSYZsO3qlXkKnxhH+KW7efgCa+ZH7NECgYEAy8acugkBUKmVCEVUiO/w\nHP1DgCVqrXHnbw/XI5L5BpJt1wrGjptW3/cxJZ0xgELdOZu/VEymmrLY9s/wkhxo\njjIyHiGExGiIaQC0LUS+zc64IzlCpNI6mqQg9UIwhtsLwcxQL038dvbqrqPX6mQ2\nlG4J1wFslt2Y6R7SbBTusho=\n-----END PRIVATE KEY-----";

const TEST_PRIVATE_KEY_B: &str = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDLY4t6cfKgKc0Y\ntMBhFnKK/A/soVKTwdvWkR09MRXUjYmAJcwy/Gt865RoepfYVlu2L7q9OIAx6oJZ\neQGJco+W/K0hyz+vLtf76rIzBBcbsHxvjnvayPrDYT8GC028vdEClOz1nTnhgPLv\ntAS3L28l0xX+vlOxJaNga86C+flzWzIxQ01NKFu2n6HjPWKnc9xAcfStkTGTZI1q\nUtZTZXb/I0iOZLq358+I5l4PWbiyR5plYFfK85Jir2jFIzQz8ofsCKajcB4BEd3b\n0UAed5DEKJ+MrESsEzrQYTljDlc/jpFawOWXfUp1+xitB1Q0Uz5Rdn9z/SUs09xW\nVDUPPceZAgMBAAECggEAGm7QLGmtZANgFFs+urTKziVULHy1hAkoeQpYXSDepXEq\nSEKhTJRho9U6GcSqV1i3MpuhZADOfa5B9+mHZEWZ7mrdqravis+bt7HDgb3WWFLn\ng9gQtgPIvfu1enjy8W9PP/allTDfL4otXdnCLcyMYBi+6GHz8+HgXyJOWddYWWq/\nzUSxlE4L9T9Ya2rTiuiw6FX/OeQa8IFgN6yXyATcxip7daC5MUBMJbYpaHat1ANm\nhzCuVW3iN6Jlcxar9fAi9JXqehLCsy5QNF6+029t4hbDAkkZpme0Bbp/fNAitIMs\nku69KTgrV5KS4aCNjWe3D30DCRcJaK7/cNeFbpeMwQKBgQD8jal5ZzQajSDV38aq\n5veov4GOxK219nKNuxrr7cUVKdlI6PVT8b6k21fmRU0gHJI5mF9wrFq64SNuDGtu\nnqY18pM9VJNNxx9yTNED10U9WSypwRwICC4yf1c8wtlHG61NBZwQA28fOqZwT6id\ngoqs6oNOyu0/Hnv9xc57nFKPHwKBgQDOKh5FR+i0er+g48l20W4PZ7mCIECh8lYB\nLP1sGhDE41Z0BWjdVk5vRCttu0yG83KJW+9soGTVvLgmUZnS/XNTmIffxT9VvQrY\nKWbkXiwI1R+22IEhZ2uxMLPosGixvmSuRJ0OkQJ9eUT0YZhJRUMQTdIXoWKy7bW4\nvQl2lIMqRwKBgDVGqQacN8iWFuQnJaCtwnbNl0YHxWFKUNYHL2GvsdCKGHUh94ay\ny3W5c6x22BM7E7mkpBV/tlAP6EpxwkP+oa9lsZvReJWCuOaCv+Dgi5GqexqASyqC\nl0Q9yqhdrjoq438I/Of/4XQkCjJNC5PWkuxxOCvp8OxMwPlCvhEjY+MfAoGBAJyP\nD329JdIohO1BDfTVBaddNVrD81EIHpe1+pzlDmb13OkuUnwC1n1YX0JtQagZp5j3\n39G1290T+yPeQ9od7j5FTql3uKj7bgjJKAG0IexzLCpGL4mWaAme2oCRtm+EDiDo\nqfwt0p5GQT7z/hlmJ49yCWE4hSMrsRwhMdaC4ThxAoGBANbxonlb9lMElYRPjJvz\n0pnvWNXMAPoLRaMpoq1kCYPfbqQbHuc/JApNyvkdI0/syDrBd+PXPjBddzVTRz3B\nJxJF7QsJI7g5QSqHckN3PrfPHw3P2X1hRME4OlXSLzJwJKN4TSNKEpyfHcMuRT7r\n3/Lo2+Jx0pcsX/REzTJQ/x6f\n-----END PRIVATE KEY-----";

const TEST_JWKS: &str = r#"{"keys":[{"kty":"RSA","use":"sig","kid":"test-key-1","alg":"RS256","n":"tmIpBN3GmUPLo5-W621AtRpL0l7i11wSzdrGT2R0ceZhc-gQ-eNWpXOy7akSM6rHDs5SQ2fsTT8_VVvnvUd9UXGNNIu7mUvBuuCqryuW38qgqy2XXgwnNXepQ7cdIvLgyTk4O_JZy-7upXlVl9ZRT0QSXxBcPORfuQxrERVN0NJWrE2s12r37CTsDZ8SUpgy9KQtwu6XLw00K_YkcyaEiqREA2usgvaR3Xce94NfxEBY3yLTo1AmFcXgiFTB7DWbBka9x3wjReSytuUYSLSsDKhOl9oHv52On5jQcZzSp2SfWpI6Wf4dzn4Znbf1eOyMe2ttkZKjdDuLy6OQmYMzcQ","e":"AQAB"}]}"#;

const JWK_B: &str = r#"{"kty": "RSA", "use": "sig", "kid": "test-key-2", "alg": "RS256", "n": "y2OLenHyoCnNGLTAYRZyivwP7KFSk8Hb1pEdPTEV1I2JgCXMMvxrfOuUaHqX2FZbti-6vTiAMeqCWXkBiXKPlvytIcs_ry7X--qyMwQXG7B8b4572sj6w2E_BgtNvL3RApTs9Z054YDy77QEty9vJdMV_r5TsSWjYGvOgvn5c1syMUNNTShbtp-h4z1ip3PcQHH0rZExk2SNalLWU2V2_yNIjmS6t-fPiOZeD1m4skeaZWBXyvOSYq9oxSM0M_KH7Aimo3AeARHd29FAHneQxCifjKxErBM60GE5Yw5XP46RWsDll31KdfsYrQdUNFM-UXZ_c_0lLNPcVlQ1Dz3HmQ", "e": "AQAB"}"#;

fn sign(key: &str, kid: &str, claims: serde_json::Value) -> String {
    let mut header = jsonwebtoken::Header::new(jsonwebtoken::Algorithm::RS256);
    header.kid = Some(kid.into());
    jsonwebtoken::encode(
        &header,
        &claims,
        &jsonwebtoken::EncodingKey::from_rsa_pem(key.as_bytes()).unwrap(),
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

/// The stub IdP: serves a mutable JWKS document over HTTP.
struct StubIdp {
    url: String,
    jwks: Arc<RwLock<serde_json::Value>>,
}

async fn start_stub_idp() -> StubIdp {
    let jwks = Arc::new(RwLock::new(
        serde_json::from_str::<serde_json::Value>(TEST_JWKS).unwrap(),
    ));
    let shared = jwks.clone();
    let app = Router::new().route(
        "/jwks",
        get(move || {
            let shared = shared.clone();
            async move { Json(shared.read().await.clone()) }
        }),
    );
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let url = format!("http://{}/jwks", listener.local_addr().unwrap());
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    StubIdp { url, jwks }
}

async fn start_api(jwks_url: &str) -> String {
    let mut config = Config::test();
    config.auth_mode = AuthMode::Oidc;
    config.oidc = Some(OidcConfig {
        issuer: ISSUER.into(),
        audience: AUDIENCE.into(),
        jwks_url: jwks_url.into(),
        tenant_claim: "tid".into(),
        groups_claim: "groups".into(),
        agent_group: Some("nordsvar-agents".into()),
        admin_group: Some("nordsvar-admins".into()),
    });
    // AppState::in_memory wires HttpJwksSource from the config: the real
    // production fetch path, pointed at the stub IdP.
    let app = build_router(AppState::in_memory(config));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let url = format!("http://{}", listener.local_addr().unwrap());
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    url
}

#[tokio::test]
async fn oidc_stack_accepts_idp_tokens_and_rejects_the_rest() {
    let idp = start_stub_idp().await;
    let api = start_api(&idp.url).await;
    let client = reqwest::Client::new();

    // No token -> 401.
    let resp = client
        .get(format!("{api}/v1/sessions"))
        .send()
        .await
        .unwrap();
    assert_eq!(resp.status(), 401);

    // Garbage token -> 401.
    let resp = client
        .get(format!("{api}/v1/sessions"))
        .bearer_auth("not-a-jwt")
        .send()
        .await
        .unwrap();
    assert_eq!(resp.status(), 401);

    // Wrong issuer -> 401.
    let mut wrong_iss = base_claims();
    wrong_iss["iss"] = serde_json::json!("https://evil.example.test");
    let resp = client
        .get(format!("{api}/v1/sessions"))
        .bearer_auth(sign(TEST_PRIVATE_KEY, "test-key-1", wrong_iss))
        .send()
        .await
        .unwrap();
    assert_eq!(resp.status(), 401);

    // A real IdP-signed token creates a session in the token's tenant.
    let resp = client
        .post(format!("{api}/v1/sessions"))
        .bearer_auth(sign(TEST_PRIVATE_KEY, "test-key-1", base_claims()))
        .json(&serde_json::json!({}))
        .send()
        .await
        .unwrap();
    assert_eq!(resp.status(), 201);
    let body: serde_json::Value = resp.json().await.unwrap();
    assert_eq!(body["created_by"], "user-123");
    assert!(body["room"].as_str().unwrap().starts_with("session-"));
    // Tenant scoping of what the token's tenant can see is covered by the
    // isolation tests in api.rs (cross-tenant = 404).

    // Agent group but not admin group: audit is 403.
    let resp = client
        .get(format!("{api}/v1/audit"))
        .bearer_auth(sign(TEST_PRIVATE_KEY, "test-key-1", base_claims()))
        .send()
        .await
        .unwrap();
    assert_eq!(resp.status(), 403);

    // Admin group -> audit 200.
    let mut admin = base_claims();
    admin["groups"] = serde_json::json!(["nordsvar-admins"]);
    let resp = client
        .get(format!("{api}/v1/audit"))
        .bearer_auth(sign(TEST_PRIVATE_KEY, "test-key-1", admin))
        .send()
        .await
        .unwrap();
    assert_eq!(resp.status(), 200);
}

#[tokio::test]
async fn kid_rotation_reaches_the_idp_again() {
    let idp = start_stub_idp().await;
    let api = start_api(&idp.url).await;
    let client = reqwest::Client::new();

    // Warm the validator's cache with key A.
    let resp = client
        .get(format!("{api}/v1/sessions"))
        .bearer_auth(sign(TEST_PRIVATE_KEY, "test-key-1", base_claims()))
        .send()
        .await
        .unwrap();
    assert_eq!(resp.status(), 200);

    // A token under unknown kid B is rejected while the IdP serves only A...
    let token_b = sign(TEST_PRIVATE_KEY_B, "test-key-2", base_claims());
    let resp = client
        .get(format!("{api}/v1/sessions"))
        .bearer_auth(&token_b)
        .send()
        .await
        .unwrap();
    assert_eq!(resp.status(), 401);

    // ...the IdP rotates (serves A and B)...
    let mut jwks = idp.jwks.read().await.clone();
    let key_b: serde_json::Value = serde_json::from_str(JWK_B).unwrap();
    jwks["keys"].as_array_mut().unwrap().push(key_b);
    *idp.jwks.write().await = jwks;

    // ...and the same token now validates: the unknown kid forced a
    // refetch of the live JWKS document.
    let resp = client
        .get(format!("{api}/v1/sessions"))
        .bearer_auth(&token_b)
        .send()
        .await
        .unwrap();
    assert_eq!(resp.status(), 200);
}
