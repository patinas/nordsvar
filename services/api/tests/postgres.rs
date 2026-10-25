//! PostgreSQL integration tests. Skipped unless NORDSVAR_TEST_DATABASE_URL
//! is set (CI provides a postgres service); local `cargo test` stays fast.

use nordsvar_api::audit::{AuditEvent, AuditLog};
use nordsvar_api::store::{Session, SessionStatus, SessionStore};
use nordsvar_api::store_pg::PgStore;
use nordsvar_tenancy::{TenantId, TenantScoped};

async fn store() -> Option<PgStore> {
    let url = std::env::var("NORDSVAR_TEST_DATABASE_URL").ok()?;
    let pg = PgStore::connect(&url).await.expect("connect");
    pg.migrate().await.expect("migrate");
    Some(pg)
}

#[tokio::test]
async fn pg_sessions_roundtrip_and_isolation() {
    let Some(store) = store().await else {
        eprintln!("NORDSVAR_TEST_DATABASE_URL unset; skipping");
        return;
    };
    let a = TenantId::new();
    let b = TenantId::new();
    let session = SessionStore::create(&store, a, Session::new(a, "alice"))
        .await
        .expect("create");

    let fetched = SessionStore::get(&store, a, session.id)
        .await
        .expect("get")
        .expect("same tenant");
    assert_eq!(fetched.room, session.room);
    assert!(
        SessionStore::get(&store, b, session.id)
            .await
            .expect("get")
            .is_none(),
        "cross-tenant hidden"
    );

    let ended = SessionStore::end(&store, a, session.id)
        .await
        .expect("end")
        .expect("ended session");
    assert_eq!(ended.status, SessionStatus::Ended);
    assert!(SessionStore::end(&store, a, session.id)
        .await
        .expect("end")
        .expect("ended session")
        .ended_at_unix
        .is_some());

    let list = SessionStore::list(&store, a).await.expect("list");
    assert!(list.iter().any(|s| s.id == session.id));
    assert!(SessionStore::list(&store, b)
        .await
        .expect("list")
        .iter()
        .all(|s| s.tenant == b));
}

#[tokio::test]
async fn pg_audit_is_tenant_partitioned() {
    let Some(store) = store().await else {
        eprintln!("NORDSVAR_TEST_DATABASE_URL unset; skipping");
        return;
    };
    let a = TenantId::new();
    let b = TenantId::new();
    AuditLog::record(
        &store,
        TenantScoped::new(
            a,
            AuditEvent::new(
                a,
                "alice",
                "session.created",
                "s1",
                serde_json::json!({"k": 1}),
            ),
        ),
    )
    .await
    .expect("record");
    let events = AuditLog::list(&store, a).await.expect("list");
    assert!(events
        .iter()
        .any(|e| e.action == "session.created" && e.actor == "alice"));
    assert!(AuditLog::list(&store, b)
        .await
        .expect("list")
        .iter()
        .all(|e| e.tenant == b));
}

#[tokio::test]
async fn pg_migrations_are_idempotent() {
    let Some(store) = store().await else {
        eprintln!("NORDSVAR_TEST_DATABASE_URL unset; skipping");
        return;
    };
    store.migrate().await.expect("first");
    store.migrate().await.expect("second run must also succeed");
}

/// Claim/heartbeat recovery semantics against real Postgres. Runs only in
/// CI (NORDSVAR_TEST_DATABASE_URL); skipped when the database URL is unset.
#[tokio::test]
async fn pg_stale_claim_is_reclaimable_and_heartbeat_refreshes() {
    let Some(store) = store().await else {
        eprintln!("NORDSVAR_TEST_DATABASE_URL unset; skipping");
        return;
    };
    let t = TenantId::new();
    let mut session = Session::new(t, "alice");
    session.claimed_by = Some("dead-worker".into());
    session.claimed_at_unix = Some(1); // 1970: far past any staleness window
    let session = SessionStore::create(&store, t, session)
        .await
        .expect("create");

    let unclaimed = SessionStore::list_unclaimed(&store).await.expect("list");
    assert!(unclaimed.iter().any(|s| s.id == session.id));
    let reclaimed = SessionStore::claim(&store, session.id, "live-worker")
        .await
        .expect("claim")
        .expect("stale claim must be reclaimable");
    assert_eq!(reclaimed.claimed_by.as_deref(), Some("live-worker"));
    // list_unclaimed is cross-tenant by design; other tests share this
    // database, so assert on OUR session, not on emptiness.
    assert!(!SessionStore::list_unclaimed(&store)
        .await
        .expect("list")
        .iter()
        .any(|s| s.id == session.id));
    assert!(SessionStore::claim(&store, session.id, "thief")
        .await
        .expect("claim")
        .is_none());

    assert!(SessionStore::heartbeat(&store, session.id, "live-worker")
        .await
        .expect("heartbeat"));
    assert!(!SessionStore::heartbeat(&store, session.id, "thief")
        .await
        .expect("heartbeat"));
    SessionStore::end(&store, t, session.id).await.expect("end");
    assert!(!SessionStore::heartbeat(&store, session.id, "live-worker")
        .await
        .expect("heartbeat"));
}

/// Tenant settings: stored overrides round-trip per tenant and survive
/// reconnect (a new store against the same database).
#[tokio::test]
async fn pg_tenant_settings_roundtrip_and_persist() {
    let Some(store) = store().await else {
        eprintln!("NORDSVAR_TEST_DATABASE_URL unset; skipping");
        return;
    };
    let a = TenantId::new();
    let b = TenantId::new();
    use nordsvar_api::store::SettingsStore;

    // Default: no overrides.
    let s = SettingsStore::get_settings(&store, a).await.expect("get");
    assert!(s.llm_model.is_none() && s.embed_model.is_none() && s.stt_language.is_none());

    let settings = nordsvar_api::store::TenantSettings {
        llm_model: Some("llama3.1:8b".into()),
        embed_model: None,
        stt_language: Some("da".into()),
        llm_base_url: None,
        llm_api_key_enc: None,
        ..Default::default()
    };
    SettingsStore::put_settings(&store, a, &settings)
        .await
        .expect("put");
    let got = SettingsStore::get_settings(&store, a).await.expect("get");
    assert_eq!(got.llm_model.as_deref(), Some("llama3.1:8b"));
    assert_eq!(got.stt_language.as_deref(), Some("da"));
    assert!(got.embed_model.is_none());
    // Tenant isolation: b sees no overrides.
    let other = SettingsStore::get_settings(&store, b).await.expect("get");
    assert!(other.llm_model.is_none());

    // Update (upsert) replaces, does not duplicate.
    let updated = nordsvar_api::store::TenantSettings {
        llm_model: None,
        embed_model: Some("nomic-embed-text".into()),
        stt_language: None,
        llm_base_url: None,
        llm_api_key_enc: None,
        ..Default::default()
    };
    SettingsStore::put_settings(&store, a, &updated)
        .await
        .expect("put");
    let got = SettingsStore::get_settings(&store, a).await.expect("get");
    assert!(got.llm_model.is_none());
    assert_eq!(got.embed_model.as_deref(), Some("nomic-embed-text"));
}

/// The provider key is ciphertext in the database - verify at the SQL
/// level that plaintext never reaches storage.
#[tokio::test]
async fn pg_provider_key_is_ciphertext_at_rest() {
    let Some(store) = store().await else {
        eprintln!("NORDSVAR_TEST_DATABASE_URL unset; skipping");
        return;
    };
    use nordsvar_api::store::SettingsStore;
    let t = TenantId::new();
    let key = [9u8; 32];
    let enc = nordsvar_api::crypto::encrypt(&key, "sk-plaintext-must-not-appear").expect("encrypt");
    let settings = nordsvar_api::store::TenantSettings {
        llm_model: Some("gpt-4o-mini".into()),
        embed_model: None,
        stt_language: None,
        llm_base_url: Some("https://api.openai.com/v1".into()),
        llm_api_key_enc: Some(enc),
        ..Default::default()
    };
    SettingsStore::put_settings(&store, t, &settings)
        .await
        .expect("put");
    let got = SettingsStore::get_settings(&store, t).await.expect("get");
    assert_eq!(
        got.llm_base_url.as_deref(),
        Some("https://api.openai.com/v1")
    );
    let blob = got.llm_api_key_enc.expect("ciphertext stored");
    // The stored bytes are not the plaintext and decrypt back to it.
    assert_ne!(
        std::str::from_utf8(&blob).unwrap_or(""),
        "sk-plaintext-must-not-appear"
    );
    assert_eq!(
        nordsvar_api::crypto::decrypt(&key, &blob).expect("decrypt"),
        "sk-plaintext-must-not-appear"
    );
}

#[tokio::test]
async fn pg_session_get_by_id_resolves_the_owning_tenant() {
    let Some(store) = store().await else {
        eprintln!("NORDSVAR_TEST_DATABASE_URL unset; skipping");
        return;
    };
    let tenant = TenantId::new();
    let session = SessionStore::create(&store, tenant, Session::new(tenant, "caller"))
        .await
        .expect("create");
    // Tenant-free lookup (internal footprint route) finds the same row.
    let found = SessionStore::get_by_id(&store, session.id)
        .await
        .expect("get_by_id")
        .expect("session exists");
    assert_eq!(found.tenant, tenant);
    assert_eq!(found.room, session.room);
    // Unknown id -> None, not an error.
    let missing = SessionStore::get_by_id(
        &store,
        nordsvar_api::store::SessionId::parse(&uuid::Uuid::new_v4().to_string()).unwrap(),
    )
    .await
    .expect("get_by_id missing");
    assert!(missing.is_none());
}
