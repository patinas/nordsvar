//! Vector storage ports and adapters. One collection per tenant (Qdrant)
//! or one partition per tenant (in-memory). The in-memory implementation
//! is real code, not a mock: it powers tests and single-node development.

use async_trait::async_trait;
use nordsvar_ai_core::ports::Embedder;
use nordsvar_ai_core::types::ScoredChunk;
use nordsvar_tenancy::{TenantId, TenantScoped};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// One embedded chunk ready for indexing.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct VectorPoint {
    /// Stable point id: "{document_id}:{chunk_ordinal}".
    pub id: String,
    pub vector: Vec<f32>,
    pub document_id: String,
    pub chunk_ordinal: u32,
    pub source: String,
    pub text: String,
}

#[async_trait]
pub trait VectorIndex: Send + Sync {
    /// Create the tenant's collection if it does not exist yet.
    async fn ensure_collection(&self, tenant: TenantId, dim: usize) -> Result<(), String>;
    /// Insert or replace points in the tenant's collection.
    async fn upsert(&self, tenant: TenantId, points: Vec<VectorPoint>) -> Result<(), String>;
    /// Cosine-similarity search within the tenant's collection only.
    async fn search(
        &self,
        tenant: TenantId,
        vector: &[f32],
        k: usize,
    ) -> Result<Vec<ScoredChunk>, String>;
    /// Remove every chunk of one document from the tenant's collection.
    async fn delete_document(&self, tenant: TenantId, document_id: &str) -> Result<(), String>;
}

/// Arc forwarding so shared indexes can be used where an index is owned.
#[async_trait]
impl<T: VectorIndex + ?Sized> VectorIndex for Arc<T> {
    async fn ensure_collection(&self, tenant: TenantId, dim: usize) -> Result<(), String> {
        (**self).ensure_collection(tenant, dim).await
    }

    async fn upsert(&self, tenant: TenantId, points: Vec<VectorPoint>) -> Result<(), String> {
        (**self).upsert(tenant, points).await
    }

    async fn search(
        &self,
        tenant: TenantId,
        vector: &[f32],
        k: usize,
    ) -> Result<Vec<ScoredChunk>, String> {
        (**self).search(tenant, vector, k).await
    }

    async fn delete_document(&self, tenant: TenantId, document_id: &str) -> Result<(), String> {
        (**self).delete_document(tenant, document_id).await
    }
}

/// Qdrant collection name for a tenant. Derives from the tenant UUID, so a
/// tenant's collection is deterministic and collision-free.
pub fn collection_name(tenant: TenantId) -> String {
    format!("tenant_{}", tenant.as_uuid().simple())
}

/// Tenant-partitioned in-memory index with exact cosine search.
#[derive(Debug, Default)]
pub struct InMemoryVectorIndex {
    by_tenant: Arc<Mutex<HashMap<TenantId, Vec<VectorPoint>>>>,
}

#[async_trait]
impl VectorIndex for InMemoryVectorIndex {
    async fn ensure_collection(&self, tenant: TenantId, _dim: usize) -> Result<(), String> {
        self.by_tenant.lock().unwrap().entry(tenant).or_default();
        Ok(())
    }

    async fn upsert(&self, tenant: TenantId, points: Vec<VectorPoint>) -> Result<(), String> {
        let mut guard = self.by_tenant.lock().unwrap();
        let store = guard.entry(tenant).or_default();
        for point in points {
            match store.iter().position(|p| p.id == point.id) {
                Some(i) => store[i] = point,
                None => store.push(point),
            }
        }
        Ok(())
    }

    async fn search(
        &self,
        tenant: TenantId,
        vector: &[f32],
        k: usize,
    ) -> Result<Vec<ScoredChunk>, String> {
        let guard = self.by_tenant.lock().unwrap();
        let store = guard.get(&tenant).cloned().unwrap_or_default();
        let mut scored: Vec<(f32, VectorPoint)> = store
            .into_iter()
            .map(|p| (cosine(vector, &p.vector), p))
            .collect();
        scored.sort_by(|a, b| b.0.total_cmp(&a.0));
        Ok(scored
            .into_iter()
            .take(k)
            .map(|(score, p)| ScoredChunk {
                chunk_id: p.id,
                source: p.source,
                text: p.text,
                score,
            })
            .collect())
    }

    async fn delete_document(&self, tenant: TenantId, document_id: &str) -> Result<(), String> {
        let mut guard = self.by_tenant.lock().unwrap();
        if let Some(store) = guard.get_mut(&tenant) {
            store.retain(|p| p.document_id != document_id);
        }
        Ok(())
    }
}

fn cosine(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() || a.is_empty() {
        return 0.0;
    }
    let dot: f32 = a.iter().zip(b).map(|(x, y)| x * y).sum();
    let na: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let nb: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();
    if na == 0.0 || nb == 0.0 {
        0.0
    } else {
        dot / (na * nb)
    }
}

/// Retrieval over a vector index: embed the query with the local embedder,
/// then search the scoped tenant's collection.
pub struct RetrieverOverIndex<E, I> {
    embedder: E,
    index: I,
}

impl<E, I> RetrieverOverIndex<E, I> {
    pub fn new(embedder: E, index: I) -> Self {
        Self { embedder, index }
    }
}

#[async_trait]
impl<E, I> nordsvar_ai_core::ports::Retriever for RetrieverOverIndex<E, I>
where
    E: Embedder,
    I: VectorIndex,
{
    async fn search(
        &self,
        query: TenantScoped<&str>,
        k: usize,
    ) -> Result<Vec<ScoredChunk>, String> {
        let vectors = self.embedder.embed(&[query.value().to_string()]).await?;
        let vector = vectors
            .into_iter()
            .next()
            .ok_or_else(|| "embedder returned no vector for query".to_string())?;
        self.index.search(query.tenant(), &vector, k).await
    }
}

/// Qdrant REST adapter. Speaks only to the operator's self-hosted Qdrant.
pub struct QdrantIndex {
    base_url: String,
    client: reqwest::Client,
}

impl QdrantIndex {
    pub fn new(base_url: impl Into<String>) -> Self {
        Self {
            base_url: base_url.into().trim_end_matches('/').to_string(),
            client: reqwest::Client::new(),
        }
    }

    fn collection_url(&self, tenant: TenantId) -> String {
        format!("{}/collections/{}", self.base_url, collection_name(tenant))
    }
}

#[async_trait]
impl VectorIndex for QdrantIndex {
    async fn ensure_collection(&self, tenant: TenantId, dim: usize) -> Result<(), String> {
        let url = self.collection_url(tenant);
        // GET first: creating an existing collection errors in Qdrant.
        let exists = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| e.to_string())?
            .status()
            .is_success();
        if exists {
            return Ok(());
        }
        let body = serde_json::json!({
            "vectors": { "size": dim, "distance": "Cosine" }
        });
        let resp = self
            .client
            .put(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| e.to_string())?;
        if resp.status().is_success() {
            Ok(())
        } else {
            Err(format!("create collection: HTTP {}", resp.status()))
        }
    }

    async fn upsert(&self, tenant: TenantId, points: Vec<VectorPoint>) -> Result<(), String> {
        let url = format!("{}/points?wait=true", self.collection_url(tenant));
        let body = serde_json::json!({
            "points": points.iter().map(|p| serde_json::json!({
                "id": p.id,
                "vector": p.vector,
                "payload": {
                    "document_id": p.document_id,
                    "chunk_ordinal": p.chunk_ordinal,
                    "source": p.source,
                    "text": p.text,
                }
            })).collect::<Vec<_>>()
        });
        let resp = self
            .client
            .put(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| e.to_string())?;
        if resp.status().is_success() {
            Ok(())
        } else {
            Err(format!("upsert: HTTP {}", resp.status()))
        }
    }

    async fn search(
        &self,
        tenant: TenantId,
        vector: &[f32],
        k: usize,
    ) -> Result<Vec<ScoredChunk>, String> {
        let url = format!("{}/points/search", self.collection_url(tenant));
        let body = serde_json::json!({
            "vector": vector,
            "limit": k,
            "with_payload": true,
        });
        let resp = self
            .client
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| e.to_string())?;
        if !resp.status().is_success() {
            return Err(format!("search: HTTP {}", resp.status()));
        }
        #[derive(Deserialize)]
        struct Hit {
            id: serde_json::Value,
            score: f32,
            payload: Option<Payload>,
        }
        #[derive(Deserialize)]
        struct Payload {
            source: String,
            text: String,
        }
        #[derive(Deserialize)]
        struct Result_ {
            result: Vec<Hit>,
        }
        let parsed: Result_ = resp.json().await.map_err(|e| e.to_string())?;
        Ok(parsed
            .result
            .into_iter()
            .map(|h| ScoredChunk {
                chunk_id: match h.id {
                    serde_json::Value::String(s) => s,
                    other => other.to_string(),
                },
                score: h.score,
                source: h
                    .payload
                    .as_ref()
                    .map(|p| p.source.clone())
                    .unwrap_or_default(),
                text: h.payload.map(|p| p.text).unwrap_or_default(),
            })
            .collect())
    }

    async fn delete_document(&self, tenant: TenantId, document_id: &str) -> Result<(), String> {
        let url = format!("{}/points/delete?wait=true", self.collection_url(tenant));
        let body = serde_json::json!({
            "filter": {
                "must": [{ "key": "document_id", "match": { "value": document_id } }]
            }
        });
        let resp = self
            .client
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| e.to_string())?;
        if resp.status().is_success() {
            Ok(())
        } else {
            Err(format!("delete: HTTP {}", resp.status()))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use nordsvar_ai_core::fakes::FakeEmbedder;
    use nordsvar_ai_core::ports::Retriever;

    fn point(id: &str, v: Vec<f32>) -> VectorPoint {
        VectorPoint {
            id: id.into(),
            vector: v,
            document_id: "doc".into(),
            chunk_ordinal: 0,
            source: "doc.md".into(),
            text: format!("text for {id}"),
        }
    }

    #[test]
    fn collection_names_are_deterministic_and_tenant_unique() {
        let a = TenantId::new();
        let b = TenantId::new();
        assert_eq!(collection_name(a), collection_name(a));
        assert_ne!(collection_name(a), collection_name(b));
        assert!(collection_name(a).starts_with("tenant_"));
    }

    #[tokio::test]
    async fn in_memory_index_is_tenant_partitioned() {
        let index = InMemoryVectorIndex::default();
        let a = TenantId::new();
        let b = TenantId::new();
        index.ensure_collection(a, 2).await.unwrap();
        index
            .upsert(a, vec![point("a1", vec![1.0, 0.0])])
            .await
            .unwrap();
        index.ensure_collection(b, 2).await.unwrap();
        index
            .upsert(b, vec![point("b1", vec![0.0, 1.0])])
            .await
            .unwrap();

        let hits_a = index.search(a, &[1.0, 0.0], 5).await.unwrap();
        assert_eq!(hits_a.len(), 1);
        assert_eq!(hits_a[0].chunk_id, "a1");
        let hits_b = index.search(b, &[1.0, 0.0], 5).await.unwrap();
        assert_eq!(hits_b.len(), 1);
        assert_eq!(hits_b[0].chunk_id, "b1");
    }

    #[tokio::test]
    async fn cosine_ranking_orders_best_first() {
        let index = InMemoryVectorIndex::default();
        let t = TenantId::new();
        index.ensure_collection(t, 2).await.unwrap();
        index
            .upsert(
                t,
                vec![point("far", vec![-1.0, 0.0]), point("near", vec![0.9, 0.1])],
            )
            .await
            .unwrap();
        let hits = index.search(t, &[1.0, 0.0], 2).await.unwrap();
        assert_eq!(hits[0].chunk_id, "near");
        assert!(hits[0].score > hits[1].score);
    }

    #[tokio::test]
    async fn retriever_embeds_query_and_scopes_search() {
        let index = InMemoryVectorIndex::default();
        let t = TenantId::new();
        let embedder = FakeEmbedder { dim: 8 };
        // Index a chunk by embedding its text with the same fake embedder.
        let chunk_text = "Genstart printspooleren".to_string();
        let vector = embedder
            .embed(std::slice::from_ref(&chunk_text))
            .await
            .unwrap()
            .remove(0);
        index.ensure_collection(t, 8).await.unwrap();
        index
            .upsert(
                t,
                vec![VectorPoint {
                    id: "d:0".into(),
                    vector,
                    document_id: "d".into(),
                    chunk_ordinal: 0,
                    source: "printer.md".into(),
                    text: chunk_text,
                }],
            )
            .await
            .unwrap();

        let retriever = RetrieverOverIndex::new(FakeEmbedder { dim: 8 }, index);
        let hits = retriever
            .search(TenantScoped::new(t, "Genstart printspooleren"), 3)
            .await
            .unwrap();
        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].source, "printer.md");
        assert!(hits[0].score > 0.99, "identical text should score ~1.0");

        let other = TenantId::new();
        let hits = retriever
            .search(TenantScoped::new(other, "Genstart printspooleren"), 3)
            .await
            .unwrap();
        assert!(hits.is_empty());
    }
}
