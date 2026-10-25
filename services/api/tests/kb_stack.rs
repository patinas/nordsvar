//! KB wiring selection: the API must ingest into the same Ollama + Qdrant
//! the worker retrieves from when QDRANT_URL is set, and must fall back to
//! in-memory fakes (never fail closed silently) when it is not.

use nordsvar_api::app::kb_stack;
use nordsvar_api::config::Config;
use nordsvar_kb_ingest::{Ingestor, SourceDocument};

#[test]
fn kb_config_defaults_to_in_memory_without_qdrant_url() {
    let config = Config::test();
    assert!(config.kb.qdrant_url.is_none());
    // kb_stack must not panic; it returns the in-memory fake pair.
    let (_embedder, _index) = kb_stack(&config);
}

#[tokio::test]
async fn ingestor_runs_over_trait_objects() {
    // The production type: Ingestor over Arc<dyn Embedder> + Arc<dyn
    // VectorIndex>. Proves the dyn forwarding used by AppState composes.
    let config = Config::test();
    let (embedder, index) = kb_stack(&config);
    let ingestor = Ingestor::new(embedder, index);
    let tenant = nordsvar_tenancy::TenantId::new();
    let doc = SourceDocument {
        name: "politik.md".into(),
        bytes: b"# Ferie\n\nAlle medarbejdere har 25 feriedage om aaret.".to_vec(),
    };
    let report = ingestor.ingest(tenant, &doc).await.expect("ingest");
    assert!(report.chunks_indexed >= 1);
}

#[test]
fn kb_config_picks_up_qdrant_url() {
    let mut config = Config::test();
    config.kb.qdrant_url = Some("http://qdrant:6333".into());
    // Live pair construction must not dial anything eagerly: QdrantIndex
    // and OllamaEmbedder connect lazily on first use.
    let (_embedder, _index) = kb_stack(&config);
}
