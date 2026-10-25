//! Knowledge-base ingestion for Nordsvar.
//!
//! Input formats per the PRD: .pdf, .md, .txt, .docx, plus API-backed sources
//! (Confluence, Jira) in the enterprise tier. Documents are parsed, chunked,
//! embedded with a local embedding model, and indexed into the tenant's own
//! vector collection. Nothing here calls an external service.

pub mod chunk;
pub mod index;
pub mod parse;

use nordsvar_ai_core::ports::Embedder;
use nordsvar_tenancy::TenantId;
use uuid::Uuid;

pub use chunk::{chunk_markdown, chunk_text, Chunk};
pub use index::{InMemoryVectorIndex, QdrantIndex, RetrieverOverIndex, VectorIndex, VectorPoint};
pub use parse::{parse_document, ParsedDocument, SourceFormat};

/// Default chunk size in characters (roughly 250-400 tokens of Danish).
pub const DEFAULT_CHUNK_TARGET: usize = 1200;
/// Default overlap between consecutive chunks.
pub const DEFAULT_CHUNK_OVERLAP: usize = 150;

#[derive(Debug, thiserror::Error)]
pub enum IngestError {
    #[error("unsupported source format for {0:?}")]
    UnsupportedFormat(String),
    #[error("failed to parse document: {0}")]
    Parse(String),
    #[error("embedding failed: {0}")]
    Embed(String),
    #[error("indexing failed: {0}")]
    Index(String),
    #[error("document produced no indexable text")]
    Empty,
}

/// A document ready to ingest.
#[derive(Debug, Clone)]
pub struct SourceDocument {
    /// File or source name; the extension selects the parser.
    pub name: String,
    pub bytes: Vec<u8>,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
pub struct IngestReport {
    pub document_id: String,
    pub document_name: String,
    pub format: SourceFormat,
    pub chunks_indexed: usize,
}

/// Parse -> chunk -> embed -> index, all tenant-scoped.
pub struct Ingestor<E, I> {
    embedder: E,
    index: I,
    chunk_target: usize,
    chunk_overlap: usize,
}

impl<E: Embedder, I: VectorIndex> Ingestor<E, I> {
    pub fn new(embedder: E, index: I) -> Self {
        Self {
            embedder,
            index,
            chunk_target: DEFAULT_CHUNK_TARGET,
            chunk_overlap: DEFAULT_CHUNK_OVERLAP,
        }
    }

    pub fn with_chunking(mut self, target: usize, overlap: usize) -> Self {
        self.chunk_target = target;
        self.chunk_overlap = overlap;
        self
    }

    pub async fn ingest(
        &self,
        tenant: TenantId,
        doc: &SourceDocument,
    ) -> Result<IngestReport, IngestError> {
        let format = SourceFormat::from_name(&doc.name)
            .ok_or_else(|| IngestError::UnsupportedFormat(doc.name.clone()))?;
        let parsed =
            parse_document(format, &doc.bytes).map_err(|e| IngestError::Parse(e.to_string()))?;

        let chunks = match format {
            SourceFormat::Markdown => {
                chunk_markdown(&parsed.text, self.chunk_target, self.chunk_overlap)
            }
            _ => chunk_text(&parsed.text, self.chunk_target, self.chunk_overlap),
        };
        let chunks: Vec<Chunk> = chunks
            .into_iter()
            .filter(|c| !c.text.trim().is_empty())
            .collect();
        if chunks.is_empty() {
            return Err(IngestError::Empty);
        }

        let texts: Vec<String> = chunks.iter().map(|c| c.text.clone()).collect();
        let vectors = self
            .embedder
            .embed(&texts)
            .await
            .map_err(IngestError::Embed)?;
        if vectors.len() != chunks.len() {
            return Err(IngestError::Embed(format!(
                "embedder returned {} vectors for {} chunks",
                vectors.len(),
                chunks.len()
            )));
        }
        let dim = vectors[0].len();

        let document_id = Uuid::new_v4().to_string();
        self.index
            .ensure_collection(tenant, dim)
            .await
            .map_err(IngestError::Index)?;

        let points: Vec<VectorPoint> = chunks
            .into_iter()
            .zip(vectors)
            .map(|(chunk, vector)| VectorPoint {
                id: format!("{document_id}:{}", chunk.ordinal),
                vector,
                document_id: document_id.clone(),
                chunk_ordinal: chunk.ordinal,
                source: doc.name.clone(),
                text: chunk.text,
            })
            .collect();
        let count = points.len();
        self.index
            .upsert(tenant, points)
            .await
            .map_err(IngestError::Index)?;

        Ok(IngestReport {
            document_id,
            document_name: doc.name.clone(),
            format,
            chunks_indexed: count,
        })
    }
}
