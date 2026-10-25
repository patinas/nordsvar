//! Value types flowing through the support pipeline.

use serde::{Deserialize, Serialize};

/// One utterance of caller audio: 16 kHz mono PCM samples.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Utterance {
    pub samples: Vec<i16>,
    pub sample_rate_hz: u32,
}

impl Utterance {
    pub fn pcm16(samples: Vec<i16>) -> Self {
        Self {
            samples,
            sample_rate_hz: 16_000,
        }
    }

    pub fn duration_ms(&self) -> u64 {
        if self.sample_rate_hz == 0 {
            return 0;
        }
        (self.samples.len() as u64 * 1000) / u64::from(self.sample_rate_hz)
    }
}

/// Speech-to-text output.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Transcript {
    pub text: String,
    /// BCP-47 tag reported by the STT engine, e.g. "da".
    pub language: String,
    /// Engine-reported confidence in [0, 1] when available.
    pub confidence: Option<f32>,
}

impl Transcript {
    pub fn is_silence(&self) -> bool {
        self.text.trim().is_empty()
    }
}

/// A knowledge-base chunk with its retrieval score.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ScoredChunk {
    /// Stable id of the chunk within the tenant collection.
    pub chunk_id: String,
    /// Human-readable source label (document name, page/section).
    pub source: String,
    pub text: String,
    pub score: f32,
}

/// A grounding citation attached to an answer.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Citation {
    pub chunk_id: String,
    pub source: String,
}

/// Synthesized speech: 16-bit mono PCM.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TtsAudio {
    pub samples: Vec<i16>,
    pub sample_rate_hz: u32,
}

/// Audio leaving the pipeline toward the caller.
pub type AudioChunk = TtsAudio;

/// Everything produced for one caller utterance.
#[derive(Debug, Clone, PartialEq)]
pub struct PipelineResponse {
    pub transcript: Transcript,
    /// None when the utterance was silence; no LLM/TTS call was made.
    pub answer: Option<String>,
    pub audio: Option<TtsAudio>,
    pub citations: Vec<Citation>,
    /// True when no KB chunks grounded the answer.
    pub ungrounded: bool,
}
