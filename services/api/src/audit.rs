//! Tenant-scoped audit logging (see docs/SECURITY.md). Every mutating
//! action records who did what, in which tenant, and when. Audit records
//! are stored inside the enterprise boundary; the in-memory implementation
//! backs tests, PostgreSQL backs deployments.

use async_trait::async_trait;
use nordsvar_tenancy::TenantId;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::sync::RwLock;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEvent {
    pub id: Uuid,
    pub tenant: TenantId,
    pub actor: String,
    pub action: String,
    pub target: String,
    pub detail: serde_json::Value,
    pub at_unix: u64,
}

impl AuditEvent {
    pub fn new(
        tenant: TenantId,
        actor: &str,
        action: &str,
        target: &str,
        detail: serde_json::Value,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            tenant,
            actor: actor.to_string(),
            action: action.to_string(),
            target: target.to_string(),
            detail,
            at_unix: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
        }
    }
}

#[async_trait]
pub trait AuditLog: Send + Sync {
    /// The event arrives already scoped; the log must store it under its
    /// own tenant and nowhere else.
    async fn record(
        &self,
        event: nordsvar_tenancy::TenantScoped<AuditEvent>,
    ) -> Result<(), crate::store::StoreError>;
    /// List one tenant's stream. There is intentionally no cross-tenant view.
    async fn list(&self, tenant: TenantId) -> Result<Vec<AuditEvent>, crate::store::StoreError>;
}

#[derive(Debug, Default)]
pub struct InMemoryAuditLog {
    inner: Arc<RwLock<Vec<AuditEvent>>>,
}

#[async_trait]
impl AuditLog for InMemoryAuditLog {
    async fn record(
        &self,
        event: nordsvar_tenancy::TenantScoped<AuditEvent>,
    ) -> Result<(), crate::store::StoreError> {
        self.inner.write().await.push(event.into_inner());
        Ok(())
    }

    async fn list(&self, tenant: TenantId) -> Result<Vec<AuditEvent>, crate::store::StoreError> {
        Ok(self
            .inner
            .read()
            .await
            .iter()
            .filter(|e| e.tenant == tenant)
            .cloned()
            .collect())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use nordsvar_tenancy::TenantScoped;

    #[tokio::test]
    async fn audit_streams_are_tenant_partitioned() {
        let log = InMemoryAuditLog::default();
        let a = TenantId::new();
        let b = TenantId::new();
        log.record(TenantScoped::new(
            a,
            AuditEvent::new(a, "alice", "session.created", "s1", serde_json::json!({})),
        ))
        .await
        .unwrap();
        assert_eq!(log.list(a).await.unwrap().len(), 1);
        assert!(log.list(b).await.unwrap().is_empty());
    }
}
