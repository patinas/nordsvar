//! The support conversation pipeline: one utterance in, one grounded,
//! spoken answer out. Pure orchestration over the ports; no I/O of its own.

use crate::ports::{Llm, Retriever, Stt, Tts};
use crate::types::{AudioChunk, Citation, PipelineResponse, ScoredChunk, Utterance};
use nordsvar_tenancy::TenantId;
use std::sync::Arc;

/// Default number of KB chunks retrieved per utterance.
pub const DEFAULT_RETRIEVAL_K: usize = 5;

#[derive(Debug, thiserror::Error)]
pub enum PipelineError {
    #[error("speech-to-text failed: {0}")]
    Stt(String),
    #[error("retrieval failed: {0}")]
    Retrieval(String),
    #[error("language model failed: {0}")]
    Llm(String),
    #[error("text-to-speech failed: {0}")]
    Tts(String),
}

/// Orchestrates STT -> retrieve -> LLM -> TTS for one tenant.
///
/// The tenant is fixed at construction (per-session): the pipeline struct
/// physically cannot retrieve across tenants because the scope is built
/// here from its own field.
pub struct SupportPipeline {
    tenant: TenantId,
    stt: Arc<dyn Stt>,
    retriever: Arc<dyn Retriever>,
    llm: Arc<dyn Llm>,
    tts: Arc<dyn Tts>,
    retrieval_k: usize,
    /// When set, retrieved chunks below this score are dropped and, if
    /// none are left, the assistant declines instead of guessing.
    min_score: Option<f32>,
}

/// Danish reply used when the knowledge base has nothing relevant. It asks
/// for a clearer question and offers a human, instead of letting the model
/// improvise an answer.
pub const NO_ANSWER_REPLY_DA: &str = "Jeg kan ikke finde et sikkert svar på det i virksomhedens \
vejledninger. Kan du beskrive problemet lidt mere præcist, for eksempel hvilket program eller \
hvilken fejlbesked det drejer sig om? Ellers kan jeg bede en medarbejder hjælpe dig.";

/// Outcome of checking retrieval results against a minimum relevance score.
#[derive(Debug, Clone, PartialEq)]
pub enum Grounding {
    /// Chunks the answer may be built on. Empty only when no threshold is set.
    Grounded(Vec<ScoredChunk>),
    /// A threshold is set and nothing reached it: decline, do not call the LLM.
    NoRelevant,
}

/// Keep chunks with `score >= min_score`. With `None` the chunks pass through
/// unchanged (the previous behaviour: an empty result still goes to the LLM
/// marked ungrounded). With a threshold, an empty result is `NoRelevant`.
pub fn judge_retrieval(chunks: Vec<ScoredChunk>, min_score: Option<f32>) -> Grounding {
    match min_score {
        None => Grounding::Grounded(chunks),
        Some(min) => {
            let kept: Vec<ScoredChunk> = chunks.into_iter().filter(|c| c.score >= min).collect();
            if kept.is_empty() {
                Grounding::NoRelevant
            } else {
                Grounding::Grounded(kept)
            }
        }
    }
}

/// Default relevance floor. Only removes clearly unrelated chunks.
pub const DEFAULT_MIN_SCORE: f32 = 0.25;

/// Read RETRIEVAL_MIN_SCORE. Unset gives the default; `off`, `none` or a
/// value of 0 or below disables the guard (old behaviour).
pub fn min_score_from_env() -> Option<f32> {
    parse_min_score(std::env::var("RETRIEVAL_MIN_SCORE").ok().as_deref())
}

pub fn parse_min_score(raw: Option<&str>) -> Option<f32> {
    match raw.map(str::trim) {
        None | Some("") => Some(DEFAULT_MIN_SCORE),
        Some(v) if v.eq_ignore_ascii_case("off") || v.eq_ignore_ascii_case("none") => None,
        Some(v) => match v.parse::<f32>() {
            Ok(x) if x > 0.0 => Some(x),
            Ok(_) => None,
            Err(_) => Some(DEFAULT_MIN_SCORE),
        },
    }
}

impl SupportPipeline {
    pub fn new(
        tenant: TenantId,
        stt: Arc<dyn Stt>,
        retriever: Arc<dyn Retriever>,
        llm: Arc<dyn Llm>,
        tts: Arc<dyn Tts>,
    ) -> Self {
        Self {
            tenant,
            stt,
            retriever,
            llm,
            tts,
            retrieval_k: DEFAULT_RETRIEVAL_K,
            min_score: None,
        }
    }

    /// Decline instead of guessing when no retrieved chunk scores at least
    /// `min`. Retrieval backend failures still fall back to the ungrounded
    /// path, so an outage does not silence the assistant.
    pub fn with_min_score(mut self, min: Option<f32>) -> Self {
        self.min_score = min;
        self
    }

    pub fn with_retrieval_k(mut self, k: usize) -> Self {
        self.retrieval_k = k;
        self
    }

    pub fn tenant(&self) -> TenantId {
        self.tenant
    }

    /// Handle one caller utterance end to end.
    ///
    /// Silence short-circuits: no retrieval, no LLM call, no TTS - so a
    /// quiet line never burns GPU time and never invents an answer.
    pub async fn handle_utterance(
        &self,
        audio: &Utterance,
    ) -> Result<PipelineResponse, PipelineError> {
        let transcript = self
            .stt
            .transcribe(audio)
            .await
            .map_err(PipelineError::Stt)?;

        if transcript.is_silence() {
            return Ok(PipelineResponse {
                transcript,
                answer: None,
                audio: None,
                citations: Vec::new(),
                ungrounded: false,
            });
        }

        let scope = nordsvar_tenancy::TenantScoped::new(self.tenant, transcript.text.as_str());
        // A dead retrieval backend must not silence the assistant: answer
        // ungrounded (the response is marked ungrounded either way) and let
        // the session continue.
        let (chunks, retrieval_ok) = match self.retriever.search(scope, self.retrieval_k).await {
            Ok(chunks) => (chunks, true),
            Err(e) => {
                tracing::warn!(error = %e, "retrieval failed; answering ungrounded");
                (Vec::new(), false)
            }
        };
        let chunks = if retrieval_ok {
            match judge_retrieval(chunks, self.min_score) {
                Grounding::Grounded(kept) => kept,
                Grounding::NoRelevant => {
                    let spoken = self
                        .tts
                        .synthesize(NO_ANSWER_REPLY_DA)
                        .await
                        .map_err(PipelineError::Tts)?;
                    return Ok(PipelineResponse {
                        transcript,
                        answer: Some(NO_ANSWER_REPLY_DA.to_string()),
                        audio: Some(AudioChunk {
                            samples: spoken.samples,
                            sample_rate_hz: spoken.sample_rate_hz,
                        }),
                        citations: Vec::new(),
                        ungrounded: true,
                    });
                }
            }
        } else {
            chunks
        };

        let prompt = build_grounded_prompt(&transcript.text, &chunks);
        let answer = self
            .llm
            .complete(&prompt)
            .await
            .map_err(PipelineError::Llm)?;
        let spoken = self
            .tts
            .synthesize(&answer)
            .await
            .map_err(PipelineError::Tts)?;

        let citations = chunks
            .iter()
            .map(|c| Citation {
                chunk_id: c.chunk_id.clone(),
                source: c.source.clone(),
            })
            .collect();

        Ok(PipelineResponse {
            transcript,
            answer: Some(answer),
            audio: Some(AudioChunk {
                samples: spoken.samples,
                sample_rate_hz: spoken.sample_rate_hz,
            }),
            citations,
            ungrounded: chunks.is_empty(),
        })
    }
}

/// Build the Danish-first grounded prompt. The grounding contract: the
/// model answers from the provided runbook chunks and says so when none apply.
pub fn build_grounded_prompt(user_text: &str, chunks: &[ScoredChunk]) -> String {
    let mut prompt = String::from(
        "Du er Nordsvar, en teknisk supportassistent. Svar kort og præcist på dansk. \
         Brug KUN viden fra virksomhedens egne vejledninger nedenfor. \
         Hvis vejledningerne ikke dækker spørgsmålet, sig det ærligt og foreslå, \
         at brugeren får hjælp af en medarbejder.\n\n",
    );
    if chunks.is_empty() {
        prompt.push_str("VEJLEDNINGER: (ingen relevante vejledninger fundet)\n\n");
    } else {
        prompt.push_str("VEJLEDNINGER:\n");
        for chunk in chunks {
            prompt.push_str(&format!(
                "[{}] ({})\n{}\n\n",
                chunk.chunk_id, chunk.source, chunk.text
            ));
        }
    }
    prompt.push_str(&format!("BRUGER: {user_text}\nSVAR:"));
    prompt
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fakes::{FakeStt, InMemoryRetriever, ScriptedLlm, TtsStub};
    use nordsvar_tenancy::TenantScoped;

    fn pipeline(tenant: TenantId) -> (SupportPipeline, InMemoryRetriever, ScriptedLlm, TtsStub) {
        let retriever = InMemoryRetriever::default();
        let llm = ScriptedLlm::fixed("Genstart printspooleren, se vejledningen.");
        let tts = TtsStub::default();
        let pipe = SupportPipeline::new(
            tenant,
            Arc::new(FakeStt::fixed("Min printer virker ikke")),
            Arc::new(retriever.clone()),
            Arc::new(llm.clone()),
            Arc::new(tts.clone()),
        );
        (pipe, retriever, llm, tts)
    }

    #[tokio::test]
    async fn happy_path_runs_all_stages_with_citations() {
        let tenant = TenantId::new();
        let (pipe, retriever, llm, tts) = pipeline(tenant);
        retriever.insert(TenantScoped::new(
            tenant,
            ScoredChunk {
                chunk_id: "c1".into(),
                source: "printer-runbook.md".into(),
                text: "Genstart printspooleren via services.msc".into(),
                score: 0.9,
            },
        ));

        let out = pipe
            .handle_utterance(&Utterance::pcm16(vec![0; 1600]))
            .await
            .unwrap();

        assert_eq!(out.transcript.text, "Min printer virker ikke");
        assert!(out.answer.unwrap().contains("printspooleren"));
        assert!(out.audio.is_some());
        assert!(!out.ungrounded);
        assert_eq!(out.citations.len(), 1);
        assert_eq!(out.citations[0].source, "printer-runbook.md");
        // The LLM saw the grounded prompt.
        let prompt = llm.last_prompt().unwrap();
        assert!(prompt.contains("printer-runbook.md"));
        assert!(prompt.contains("Min printer virker ikke"));
        // TTS spoke the LLM's answer.
        assert_eq!(
            tts.last_text().unwrap(),
            "Genstart printspooleren, se vejledningen."
        );
    }

    #[tokio::test]
    async fn silence_short_circuits_everything_downstream() {
        let tenant = TenantId::new();
        let (_pipe, retriever, llm, tts) = pipeline(tenant);
        let pipe = SupportPipeline::new(
            tenant,
            Arc::new(FakeStt::fixed("   ")),
            Arc::new(retriever.clone()),
            Arc::new(llm.clone()),
            Arc::new(tts.clone()),
        );
        let out = pipe
            .handle_utterance(&Utterance::pcm16(vec![0; 800]))
            .await
            .unwrap();
        assert!(out.answer.is_none() && out.audio.is_none() && out.citations.is_empty());
        assert!(llm.last_prompt().is_none());
        assert!(tts.last_text().is_none());
    }

    #[tokio::test]
    async fn retrieval_is_scoped_to_the_pipeline_tenant() {
        let tenant_a = TenantId::new();
        let tenant_b = TenantId::new();
        let (pipe, retriever, _, _) = pipeline(tenant_a);
        // Only tenant B has knowledge.
        retriever.insert(TenantScoped::new(
            tenant_b,
            ScoredChunk {
                chunk_id: "secret".into(),
                source: "b-runbook.md".into(),
                text: "Tenant B internal fix".into(),
                score: 1.0,
            },
        ));
        let out = pipe
            .handle_utterance(&Utterance::pcm16(vec![0; 1600]))
            .await
            .unwrap();
        assert!(out.ungrounded, "tenant A must not see tenant B chunks");
        assert!(out.citations.is_empty());
        assert_eq!(retriever.last_query_tenant(), Some(tenant_a));
    }

    #[tokio::test]
    async fn empty_kb_marks_answer_ungrounded_but_still_answers() {
        let tenant = TenantId::new();
        let (pipe, _, llm, _) = pipeline(tenant);
        let out = pipe
            .handle_utterance(&Utterance::pcm16(vec![0; 1600]))
            .await
            .unwrap();
        assert!(out.ungrounded);
        assert!(out.answer.is_some());
        assert!(llm
            .last_prompt()
            .unwrap()
            .contains("ingen relevante vejledninger"));
    }

    #[tokio::test]
    async fn stt_failure_propagates_as_pipeline_error() {
        let tenant = TenantId::new();
        let (_pipe, retriever, llm, tts) = pipeline(tenant);
        let pipe = SupportPipeline::new(
            tenant,
            Arc::new(FakeStt::failing("mic stream broke")),
            Arc::new(retriever),
            Arc::new(llm),
            Arc::new(tts),
        );
        let err = pipe
            .handle_utterance(&Utterance::pcm16(vec![0; 100]))
            .await
            .unwrap_err();
        assert!(matches!(err, PipelineError::Stt(_)));
    }

    #[tokio::test]
    async fn low_scoring_chunks_make_the_pipeline_decline_without_calling_the_llm() {
        let tenant = TenantId::new();
        let (pipe, retriever, llm, tts) = pipeline(tenant);
        let pipe = pipe.with_min_score(Some(0.4));
        retriever.insert(TenantScoped::new(
            tenant,
            ScoredChunk {
                chunk_id: "weak".into(),
                source: "unrelated.md".into(),
                text: "Noget helt andet".into(),
                score: 0.1,
            },
        ));
        let out = pipe
            .handle_utterance(&Utterance::pcm16(vec![0; 1600]))
            .await
            .unwrap();
        assert_eq!(out.answer.as_deref(), Some(NO_ANSWER_REPLY_DA));
        assert!(out.ungrounded && out.citations.is_empty());
        assert!(llm.last_prompt().is_none(), "the LLM must not be called");
        assert_eq!(tts.last_text().as_deref(), Some(NO_ANSWER_REPLY_DA));
    }

    #[tokio::test]
    async fn relevant_chunk_still_passes_when_a_threshold_is_set() {
        let tenant = TenantId::new();
        let (pipe, retriever, llm, _) = pipeline(tenant);
        let pipe = pipe.with_min_score(Some(0.4));
        retriever.insert(TenantScoped::new(
            tenant,
            ScoredChunk {
                chunk_id: "c1".into(),
                source: "printer-runbook.md".into(),
                text: "Genstart printspooleren".into(),
                score: 0.8,
            },
        ));
        let out = pipe
            .handle_utterance(&Utterance::pcm16(vec![0; 1600]))
            .await
            .unwrap();
        assert!(!out.ungrounded);
        assert!(llm.last_prompt().unwrap().contains("printer-runbook.md"));
    }

    #[test]
    fn min_score_env_parsing() {
        assert_eq!(parse_min_score(None), Some(DEFAULT_MIN_SCORE));
        assert_eq!(parse_min_score(Some("0.4")), Some(0.4));
        assert_eq!(parse_min_score(Some("off")), None);
        assert_eq!(parse_min_score(Some("0")), None);
        assert_eq!(parse_min_score(Some("abc")), Some(DEFAULT_MIN_SCORE));
    }

    #[test]
    fn judge_retrieval_keeps_old_behaviour_without_a_threshold() {
        assert_eq!(
            judge_retrieval(Vec::new(), None),
            Grounding::Grounded(Vec::new())
        );
        assert_eq!(
            judge_retrieval(Vec::new(), Some(0.3)),
            Grounding::NoRelevant
        );
        let chunk = |score| ScoredChunk {
            chunk_id: "x".into(),
            source: "s".into(),
            text: "t".into(),
            score,
        };
        match judge_retrieval(vec![chunk(0.2), chunk(0.5)], Some(0.3)) {
            Grounding::Grounded(kept) => assert_eq!(kept.len(), 1),
            Grounding::NoRelevant => panic!("a 0.5 chunk should pass a 0.3 threshold"),
        }
    }

    #[test]
    fn prompt_is_danish_first_and_lists_sources() {
        let chunks = vec![ScoredChunk {
            chunk_id: "c9".into(),
            source: "vpn.md".into(),
            text: "Brug split-tunnel".into(),
            score: 0.5,
        }];
        let p = build_grounded_prompt("VPN nede", &chunks);
        assert!(p.contains("Svar kort og præcist på dansk"));
        assert!(p.contains("[c9] (vpn.md)"));
        assert!(p.contains("BRUGER: VPN nede"));
    }
}
