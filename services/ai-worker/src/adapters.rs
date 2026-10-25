//! HTTP adapters to the operator-hosted model services. Every adapter is
//! configured by base URL; none is constructed with a public endpoint by
//! default. Compose wiring lives in docker-compose.yml.

use async_trait::async_trait;
use nordsvar_ai_core::ports::{Llm, Stt, Tts};
use nordsvar_ai_core::types::{Transcript, TtsAudio, Utterance};

/// LLM via Ollama's /api/generate (dev) or any endpoint speaking the same
/// shape (vLLM's Ollama-compatible layer in production).
pub struct OllamaLlm {
    base_url: String,
    model: String,
    client: reqwest::Client,
}

impl OllamaLlm {
    pub fn new(base_url: impl Into<String>, model: impl Into<String>) -> Self {
        Self {
            base_url: base_url.into().trim_end_matches('/').to_string(),
            model: model.into(),
            client: reqwest::Client::new(),
        }
    }

    pub fn generate_url(&self) -> String {
        format!("{}/api/generate", self.base_url)
    }
}

#[async_trait]
impl Llm for OllamaLlm {
    async fn complete(&self, prompt: &str) -> Result<String, String> {
        #[derive(serde::Deserialize)]
        struct Resp {
            response: String,
        }
        let resp: Resp = self
            .client
            .post(self.generate_url())
            .json(&serde_json::json!({
                "model": self.model,
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
}

pub use nordsvar_ai_core::ollama::OllamaEmbedder;

/// LLM via any OpenAI-compatible chat-completions endpoint (cloud
/// providers like OpenAI/OpenRouter, or a local vLLM server). The
/// optional bearer key is the operator-provided provider key.
pub struct OpenAiCompatLlm {
    base_url: String,
    model: String,
    api_key: Option<String>,
    client: reqwest::Client,
}

impl OpenAiCompatLlm {
    pub fn new(
        base_url: impl Into<String>,
        model: impl Into<String>,
        api_key: Option<String>,
    ) -> Self {
        Self {
            base_url: base_url.into().trim_end_matches('/').to_string(),
            model: model.into(),
            api_key,
            client: reqwest::Client::new(),
        }
    }
}

#[async_trait]
impl Llm for OpenAiCompatLlm {
    async fn complete(&self, prompt: &str) -> Result<String, String> {
        #[derive(serde::Deserialize)]
        struct Resp {
            choices: Vec<Choice>,
        }
        #[derive(serde::Deserialize)]
        struct Choice {
            message: Msg,
        }
        #[derive(serde::Deserialize)]
        struct Msg {
            content: String,
        }
        let mut req = self
            .client
            .post(format!("{}/chat/completions", self.base_url))
            .json(&serde_json::json!({
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
                "stream": false,
            }));
        if let Some(key) = &self.api_key {
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
}

/// STT via a faster-whisper HTTP server (openai-whisper / faster-whisper
/// server shape: POST /inference, multipart file field).
pub struct WhisperHttpStt {
    base_url: String,
    language: String,
    client: reqwest::Client,
}

impl WhisperHttpStt {
    pub fn new(base_url: impl Into<String>, language: impl Into<String>) -> Self {
        Self {
            base_url: base_url.into().trim_end_matches('/').to_string(),
            language: language.into(),
            client: reqwest::Client::new(),
        }
    }
}

#[async_trait]
impl Stt for WhisperHttpStt {
    async fn transcribe(&self, audio: &Utterance) -> Result<Transcript, String> {
        let wav = wav_bytes(&audio.samples, audio.sample_rate_hz)?;
        let part = reqwest::multipart::Part::bytes(wav)
            .file_name("utterance.wav")
            .mime_str("audio/wav")
            .map_err(|e| e.to_string())?;
        let form = reqwest::multipart::Form::new()
            .part("audio_file", part)
            .text("response_format", "json");
        #[derive(serde::Deserialize)]
        struct Resp {
            text: String,
        }
        let resp: Resp = self
            .client
            .post(format!("{}/inference", self.base_url))
            .multipart(form)
            .send()
            .await
            .map_err(|e| e.to_string())?
            .error_for_status()
            .map_err(|e| e.to_string())?
            .json()
            .await
            .map_err(|e| e.to_string())?;
        Ok(Transcript {
            text: resp.text,
            language: self.language.clone(),
            confidence: None,
        })
    }
}

/// TTS via a Piper HTTP server: POST text, get WAV back.
pub struct PiperHttpTts {
    base_url: String,
    client: reqwest::Client,
}

impl PiperHttpTts {
    pub fn new(base_url: impl Into<String>) -> Self {
        Self {
            base_url: base_url.into().trim_end_matches('/').to_string(),
            client: reqwest::Client::new(),
        }
    }
}

#[async_trait]
impl Tts for PiperHttpTts {
    async fn synthesize(&self, text: &str) -> Result<TtsAudio, String> {
        let bytes = self
            .client
            .post(&self.base_url)
            .body(text.to_string())
            .send()
            .await
            .map_err(|e| e.to_string())?
            .error_for_status()
            .map_err(|e| e.to_string())?
            .bytes()
            .await
            .map_err(|e| e.to_string())?;
        parse_wav(&bytes)
    }
}

/// Encode 16-bit mono PCM as a WAV byte string.
pub fn wav_bytes(samples: &[i16], sample_rate_hz: u32) -> Result<Vec<u8>, String> {
    let mut cursor = std::io::Cursor::new(Vec::new());
    {
        let spec = hound::WavSpec {
            channels: 1,
            sample_rate: sample_rate_hz,
            bits_per_sample: 16,
            sample_format: hound::SampleFormat::Int,
        };
        let mut writer = hound::WavWriter::new(&mut cursor, spec).map_err(|e| e.to_string())?;
        for s in samples {
            writer.write_sample(*s).map_err(|e| e.to_string())?;
        }
        writer.finalize().map_err(|e| e.to_string())?;
    }
    Ok(cursor.into_inner())
}

/// Decode a WAV byte string into 16-bit mono PCM.
pub fn parse_wav(bytes: &[u8]) -> Result<TtsAudio, String> {
    let mut reader =
        hound::WavReader::new(std::io::Cursor::new(bytes)).map_err(|e| e.to_string())?;
    let spec = reader.spec();
    let samples: Vec<i16> = match (spec.bits_per_sample, spec.sample_format) {
        (16, hound::SampleFormat::Int) => reader
            .samples::<i16>()
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?,
        (32, hound::SampleFormat::Float) => reader
            .samples::<f32>()
            .map(|s| s.map(|v| (v.clamp(-1.0, 1.0) * f32::from(i16::MAX)) as i16))
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?,
        (bits, fmt) => {
            return Err(format!("unsupported WAV format: {bits} bits {fmt:?}"));
        }
    };
    // Downmix stereo to mono if needed.
    let mono: Vec<i16> = if spec.channels == 2 {
        samples
            .chunks_exact(2)
            .map(|c| ((i32::from(c[0]) + i32::from(c[1])) / 2) as i16)
            .collect()
    } else {
        samples
    };
    Ok(TtsAudio {
        samples: mono,
        sample_rate_hz: spec.sample_rate,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn wav_roundtrip_preserves_pcm() {
        let samples: Vec<i16> = (0..1600).map(|i| (i % 500) as i16 - 250).collect();
        let bytes = wav_bytes(&samples, 16_000).unwrap();
        let audio = parse_wav(&bytes).unwrap();
        assert_eq!(audio.sample_rate_hz, 16_000);
        assert_eq!(audio.samples, samples);
    }

    #[test]
    fn parse_wav_downmixes_stereo() {
        let mut cursor = std::io::Cursor::new(Vec::new());
        {
            let spec = hound::WavSpec {
                channels: 2,
                sample_rate: 22_050,
                bits_per_sample: 16,
                sample_format: hound::SampleFormat::Int,
            };
            let mut w = hound::WavWriter::new(&mut cursor, spec).unwrap();
            for (l, r) in [(100i16, 300i16), (0, 0)] {
                w.write_sample(l).unwrap();
                w.write_sample(r).unwrap();
            }
            w.finalize().unwrap();
        }
        let audio = parse_wav(&cursor.into_inner()).unwrap();
        assert_eq!(audio.samples, vec![200, 0]);
        assert_eq!(audio.sample_rate_hz, 22_050);
    }

    #[test]
    fn adapter_urls_strip_trailing_slash() {
        let llm = OllamaLlm::new("http://gpu.internal:11434/", "llama3");
        assert_eq!(llm.generate_url(), "http://gpu.internal:11434/api/generate");
    }

    /// Stub chat-completions server: records the auth header, returns a
    /// canned completion.
    async fn stub_chat_server() -> (String, tokio::sync::mpsc::Receiver<Option<String>>) {
        let (tx, rx) = tokio::sync::mpsc::channel::<Option<String>>(4);
        let app = axum::Router::new().route(
            "/chat/completions",
            axum::routing::post(
                move |headers: axum::http::HeaderMap, body: axum::Json<serde_json::Value>| {
                    let tx = tx.clone();
                    async move {
                        assert_eq!(body["model"], "gpt-4o-mini");
                        let auth = headers
                            .get("authorization")
                            .and_then(|v| v.to_str().ok())
                            .map(|s| s.to_string());
                        let _ = tx.send(auth).await;
                        axum::Json(serde_json::json!({
                            "choices": [{"message": {"role": "assistant", "content": "hej verden"}}]
                        }))
                    }
                },
            ),
        );
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let port = listener.local_addr().unwrap().port();
        tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
        (format!("http://127.0.0.1:{port}"), rx)
    }

    #[tokio::test]
    async fn openai_compat_sends_bearer_and_parses_content() {
        let (base, mut rx) = stub_chat_server().await;
        let llm = OpenAiCompatLlm::new(&base, "gpt-4o-mini", Some("sk-key-1".into()));
        let out = llm.complete("sig hej").await.unwrap();
        assert_eq!(out, "hej verden");
        let auth = rx.recv().await.unwrap();
        assert_eq!(auth.as_deref(), Some("Bearer sk-key-1"));

        // No key configured: no Authorization header at all.
        let (base, mut rx) = stub_chat_server().await;
        let llm = OpenAiCompatLlm::new(&base, "gpt-4o-mini", None);
        llm.complete("sig hej").await.unwrap();
        let auth = rx.recv().await.unwrap();
        assert!(auth.is_none());
    }
}
