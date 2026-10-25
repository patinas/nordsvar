//! Ollama HTTP adapters shared by the API (ingestion) and the AI worker
//! (retrieval-time query embedding). Local-only: plain HTTP to an Ollama
//! the operator runs themselves.

use crate::ports::Embedder;
use async_trait::async_trait;

/// Embeddings via Ollama's /api/embed.
pub struct OllamaEmbedder {
    base_url: String,
    model: String,
    client: reqwest::Client,
}

impl OllamaEmbedder {
    pub fn new(base_url: impl Into<String>, model: impl Into<String>) -> Self {
        Self {
            base_url: base_url.into().trim_end_matches('/').to_string(),
            model: model.into(),
            client: reqwest::Client::new(),
        }
    }
}

#[async_trait]
impl Embedder for OllamaEmbedder {
    async fn embed(&self, texts: &[String]) -> Result<Vec<Vec<f32>>, String> {
        #[derive(serde::Deserialize)]
        struct Resp {
            embeddings: Vec<Vec<f32>>,
        }
        let resp: Resp = self
            .client
            .post(format!("{}/api/embed", self.base_url))
            .json(&serde_json::json!({ "model": self.model, "input": texts }))
            .send()
            .await
            .map_err(|e| e.to_string())?
            .error_for_status()
            .map_err(|e| e.to_string())?
            .json()
            .await
            .map_err(|e| e.to_string())?;
        Ok(resp.embeddings)
    }
}
