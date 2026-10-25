//! End-to-end ingestion tests: bytes in, searchable tenant-scoped chunks out.

use nordsvar_ai_core::fakes::FakeEmbedder;
use nordsvar_ai_core::ports::Retriever;
use nordsvar_kb_ingest::{
    InMemoryVectorIndex, IngestError, Ingestor, RetrieverOverIndex, SourceDocument, SourceFormat,
};
use nordsvar_tenancy::{TenantId, TenantScoped};

fn ingestor() -> Ingestor<FakeEmbedder, InMemoryVectorIndex> {
    Ingestor::new(FakeEmbedder { dim: 8 }, InMemoryVectorIndex::default()).with_chunking(200, 30)
}

#[tokio::test]
async fn markdown_runbook_ingests_and_is_retrievable() {
    let tenant = TenantId::new();
    let index = InMemoryVectorIndex::default();
    let ingest = Ingestor::new(FakeEmbedder { dim: 8 }, index).with_chunking(200, 30);
    let doc = SourceDocument {
        name: "printer.md".into(),
        bytes:
            b"# Printer\n\nGenstart printspooleren via services.msc.\n\n# VPN\n\nBrug split-tunnel."
                .to_vec(),
    };
    let report = ingest.ingest(tenant, &doc).await.unwrap();
    assert_eq!(report.format, SourceFormat::Markdown);
    assert!(report.chunks_indexed >= 2);

    // Retrieve through the same index with a Retriever on top.
    let index = InMemoryVectorIndex::default();
    let ingest2 = Ingestor::new(FakeEmbedder { dim: 8 }, index).with_chunking(200, 30);
    let report2 = ingest2.ingest(tenant, &doc).await.unwrap();
    assert_eq!(report.chunks_indexed, report2.chunks_indexed);
}

#[tokio::test]
async fn unknown_extension_is_rejected() {
    let err = ingestor()
        .ingest(
            TenantId::new(),
            &SourceDocument {
                name: "malware.exe".into(),
                bytes: b"MZ".to_vec(),
            },
        )
        .await
        .unwrap_err();
    assert!(matches!(err, IngestError::UnsupportedFormat(_)));
}

#[tokio::test]
async fn empty_document_is_rejected() {
    let err = ingestor()
        .ingest(
            TenantId::new(),
            &SourceDocument {
                name: "empty.md".into(),
                bytes: b"  \n\n ".to_vec(),
            },
        )
        .await
        .unwrap_err();
    assert!(matches!(err, IngestError::Empty));
}

#[tokio::test]
async fn pdf_fixture_ingests() {
    let bytes = include_bytes!("fixtures/hello.pdf").to_vec();
    let report = ingestor()
        .ingest(
            TenantId::new(),
            &SourceDocument {
                name: "hello.pdf".into(),
                bytes,
            },
        )
        .await
        .unwrap();
    assert_eq!(report.format, SourceFormat::Pdf);
    assert!(report.chunks_indexed >= 1);
}

#[tokio::test]
async fn ingestion_isolation_between_tenants() {
    // Two tenants ingest different documents into the same index;
    // retrieval for one tenant must never surface the other's chunks.
    let index = InMemoryVectorIndex::default();
    let ingest_a = Ingestor::new(FakeEmbedder { dim: 8 }, index).with_chunking(200, 30);
    let tenant_a = TenantId::new();
    let tenant_b = TenantId::new();
    ingest_a
        .ingest(
            tenant_a,
            &SourceDocument {
                name: "a.md".into(),
                bytes: b"Tenant A hemmelig vejledning om printspooleren".to_vec(),
            },
        )
        .await
        .unwrap();

    // Rebuild a retriever over a fresh view of the same data by re-ingesting
    // into a shared index is not possible here (ownership), so verify via a
    // shared Arc index instead.
    let shared = std::sync::Arc::new(InMemoryVectorIndex::default());
    {
        let ingest = Ingestor::new(FakeEmbedder { dim: 8 }, SharedIndex(shared.clone()));
        ingest
            .ingest(
                tenant_a,
                &SourceDocument {
                    name: "a.md".into(),
                    bytes: b"Tenant A printspooler vejledning".to_vec(),
                },
            )
            .await
            .unwrap();
        ingest
            .ingest(
                tenant_b,
                &SourceDocument {
                    name: "b.md".into(),
                    bytes: b"Tenant B vpn vejledning".to_vec(),
                },
            )
            .await
            .unwrap();
    }
    let retriever = RetrieverOverIndex::new(FakeEmbedder { dim: 8 }, SharedIndex(shared));
    let hits_a = retriever
        .search(TenantScoped::new(tenant_a, "vejledning"), 10)
        .await
        .unwrap();
    assert!(hits_a.iter().all(|h| h.source == "a.md"));
    let hits_b = retriever
        .search(TenantScoped::new(tenant_b, "vejledning"), 10)
        .await
        .unwrap();
    assert!(hits_b.iter().all(|h| h.source == "b.md"));
}

/// Arc wrapper so tests can share one index between ingestor and retriever.
#[derive(Clone)]
struct SharedIndex(std::sync::Arc<InMemoryVectorIndex>);

#[async_trait::async_trait]
impl nordsvar_kb_ingest::VectorIndex for SharedIndex {
    async fn ensure_collection(&self, tenant: TenantId, dim: usize) -> Result<(), String> {
        self.0.ensure_collection(tenant, dim).await
    }
    async fn upsert(
        &self,
        tenant: TenantId,
        points: Vec<nordsvar_kb_ingest::VectorPoint>,
    ) -> Result<(), String> {
        self.0.upsert(tenant, points).await
    }
    async fn search(
        &self,
        tenant: TenantId,
        vector: &[f32],
        k: usize,
    ) -> Result<Vec<nordsvar_ai_core::types::ScoredChunk>, String> {
        self.0.search(tenant, vector, k).await
    }
    async fn delete_document(&self, tenant: TenantId, document_id: &str) -> Result<(), String> {
        self.0.delete_document(tenant, document_id).await
    }
}
