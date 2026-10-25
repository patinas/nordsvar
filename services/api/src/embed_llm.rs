//! Text completion for the embed widget's chat path. Mirrors the worker's
//! adapter selection (services/ai-worker/src/adapters.rs) one level up:
//! the tenant's configured OpenAI-compatible provider when one is stored,
//! otherwise the deployment's own LLM_URL (Ollama/vLLM) when the operator
//! set one on the API. The provider key is decrypted server-side and never
//! leaves this process.

use serde::Deserialize;

/// LLM via any OpenAI-compatible chat-completions endpoint.
pub async fn chat_complete(
    base_url: &str,
    model: &str,
    api_key: Option<&str>,
    prompt: &str,
) -> Result<String, String> {
    #[derive(Deserialize)]
    struct Resp {
        choices: Vec<Choice>,
    }
    #[derive(Deserialize)]
    struct Choice {
        message: Msg,
    }
    #[derive(Deserialize)]
    struct Msg {
        content: String,
    }
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;
    let mut req = client
        .post(format!(
            "{}/chat/completions",
            base_url.trim_end_matches('/')
        ))
        .json(&serde_json::json!({
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "stream": false,
        }));
    if let Some(key) = api_key {
        req = req.bearer_auth(key);
    }
    let resp: Resp = req
        .send()
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    resp.choices
        .into_iter()
        .next()
        .map(|c| c.message.content)
        .ok_or_else(|| "provider returned no choices".to_string())
}

/// LLM via Ollama's /api/generate (also vLLM's Ollama-compatible layer).
pub async fn ollama_complete(base_url: &str, model: &str, prompt: &str) -> Result<String, String> {
    #[derive(Deserialize)]
    struct Resp {
        response: String,
    }
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;
    let resp: Resp = client
        .post(format!("{}/api/generate", base_url.trim_end_matches('/')))
        .json(&serde_json::json!({
            "model": model,
            "prompt": prompt,
            "stream": false,
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    Ok(resp.response)
}
