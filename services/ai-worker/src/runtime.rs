//! Session runtime: one async task per support session, pooled per tenant
//! (D-003). The loop is deliberately small: utterance in, pipeline, audio
//! out, until the room ends.

use crate::gateway::{MediaGateway, SessionDescriptor};
use nordsvar_ai_core::pipeline::PipelineError;
use nordsvar_ai_core::SupportPipeline;
use std::sync::Arc;

#[derive(Debug, thiserror::Error)]
pub enum RuntimeError {
    #[error("media gateway: {0}")]
    Gateway(String),
    #[error("pipeline: {0}")]
    Pipeline(#[from] PipelineError),
}

/// Summary of one serviced session (used by tests and the audit hook).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SessionOutcome {
    pub room: String,
    pub utterances_handled: usize,
    pub answers_spoken: usize,
    /// Utterances whose pipeline run failed (transient provider outage).
    /// Counted, logged, and skipped - the session survives them.
    pub pipeline_failures: usize,
}

/// Receives one query footprint per processed utterance (PRD: the
/// compliance log tracks query footprints). The dispatch plane wires the
/// HTTP implementation; a failure to report never fails the session.
#[async_trait::async_trait]
pub trait FootprintReporter: Send + Sync {
    async fn report(&self, question: &str, citations: &[String], answered: bool);
}

/// Service one session to completion: join, loop over utterances, leave.
/// The pipeline is pre-built with its tenant bound (see ai-core), so this
/// function cannot mix tenants even if handed a mismatched descriptor.
pub async fn run_session(
    gateway: Arc<dyn MediaGateway>,
    pipeline: Arc<SupportPipeline>,
    session: &SessionDescriptor,
    footprints: Option<Arc<dyn FootprintReporter>>,
) -> Result<SessionOutcome, RuntimeError> {
    debug_assert_eq!(
        pipeline.tenant(),
        session.tenant,
        "pipeline and session tenant must match"
    );

    gateway.join(session).await.map_err(RuntimeError::Gateway)?;
    let mut outcome = SessionOutcome {
        room: session.room.clone(),
        utterances_handled: 0,
        answers_spoken: 0,
        pipeline_failures: 0,
    };

    loop {
        let utterance = match gateway.next_utterance().await {
            Ok(Some(u)) => u,
            Ok(None) => break,
            Err(e) => {
                let _ = gateway.leave().await;
                return Err(RuntimeError::Gateway(e));
            }
        };
        outcome.utterances_handled += 1;

        // A provider failure (STT/retrieval/LLM/TTS) is per-utterance, not
        // per-session: log it, count it, and keep listening. Media-gateway
        // failures above are the fatal kind - without a room there is no
        // session to continue.
        let response = match pipeline.handle_utterance(&utterance).await {
            Ok(r) => r,
            Err(e) => {
                outcome.pipeline_failures += 1;
                tracing::warn!(room = %session.room, error = %e, "utterance failed; session continues");
                if let Some(fp) = &footprints {
                    // No transcript available on failure; the empty
                    // question marks the failed query for ops.
                    fp.report("", &[], false).await;
                }
                continue;
            }
        };
        // Footprint only real queries: silence short-circuits the
        // pipeline and is not a question. The question text comes from
        // the pipeline's transcript, not the raw audio.
        if let Some(fp) = &footprints {
            if !response.transcript.is_silence() {
                let citations: Vec<String> = response
                    .citations
                    .iter()
                    .map(|c| c.source.clone())
                    .collect();
                fp.report(
                    &response.transcript.text,
                    &citations,
                    response.audio.is_some(),
                )
                .await;
            }
        }
        if let Some(audio) = &response.audio {
            gateway
                .publish_audio(audio)
                .await
                .map_err(RuntimeError::Gateway)?;
            outcome.answers_spoken += 1;
        }
    }

    gateway.leave().await.map_err(RuntimeError::Gateway)?;
    Ok(outcome)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::gateway::ScriptedGateway;
    use nordsvar_ai_core::fakes::{
        FailingTts, FakeStt, FlakyStt, InMemoryRetriever, ScriptedLlm, TtsStub,
    };
    use nordsvar_ai_core::media::FailAfterGateway;
    use nordsvar_ai_core::types::Utterance;
    use nordsvar_tenancy::TenantId;

    fn pipeline_for(tenant: TenantId) -> Arc<SupportPipeline> {
        Arc::new(SupportPipeline::new(
            tenant,
            Arc::new(FakeStt::fixed("Hjælp med printeren")),
            Arc::new(InMemoryRetriever::default()),
            Arc::new(ScriptedLlm::fixed("Genstart printspooleren.")),
            Arc::new(TtsStub::default()),
        ))
    }

    #[tokio::test]
    async fn session_processes_every_utterance_then_leaves() {
        let tenant = TenantId::new();
        let gateway = Arc::new(ScriptedGateway::with_utterances(vec![
            Utterance::pcm16(vec![0; 1600]),
            Utterance::pcm16(vec![1; 3200]),
        ]));
        let session = SessionDescriptor {
            room: "session-x".into(),
            join_token: "token".into(),
            livekit_url: "ws://livekit.test:7880".into(),
            tenant,
        };
        let outcome = run_session(gateway.clone(), pipeline_for(tenant), &session, None)
            .await
            .unwrap();
        assert_eq!(outcome.utterances_handled, 2);
        assert_eq!(outcome.answers_spoken, 2);
        assert_eq!(gateway.published().len(), 2);
        assert!(gateway.was_left());
        assert_eq!(gateway.joined_room().as_deref(), Some("session-x"));
    }

    #[derive(Default)]
    struct RecordingReporter {
        calls: std::sync::Mutex<Vec<(String, Vec<String>, bool)>>,
    }

    #[async_trait::async_trait]
    impl FootprintReporter for RecordingReporter {
        async fn report(&self, question: &str, citations: &[String], answered: bool) {
            self.calls
                .lock()
                .unwrap()
                .push((question.to_string(), citations.to_vec(), answered));
        }
    }

    #[tokio::test]
    async fn footprints_report_transcript_citations_and_outcome_per_query() {
        let tenant = TenantId::new();
        let gateway = Arc::new(ScriptedGateway::with_utterances(vec![Utterance::pcm16(
            vec![0; 1600],
        )]));
        let session = SessionDescriptor {
            room: "session-fp".into(),
            join_token: "t".into(),
            livekit_url: "ws://livekit.test:7880".into(),
            tenant,
        };
        let reporter = Arc::new(RecordingReporter::default());
        let outcome = run_session(
            gateway,
            pipeline_for(tenant),
            &session,
            Some(reporter.clone()),
        )
        .await
        .unwrap();
        assert_eq!(outcome.answers_spoken, 1);
        let calls = reporter.calls.lock().unwrap();
        assert_eq!(calls.len(), 1);
        assert_eq!(calls[0].0, "Hjælp med printeren"); // the STT transcript
        assert!(calls[0].2, "answered=true when audio was spoken");
    }

    #[tokio::test]
    async fn pipeline_failure_still_reports_an_unanswered_footprint() {
        let tenant = TenantId::new();
        let gateway = Arc::new(ScriptedGateway::with_utterances(vec![Utterance::pcm16(
            vec![0; 1600],
        )]));
        let pipeline = Arc::new(SupportPipeline::new(
            tenant,
            Arc::new(FakeStt::fixed("spørgsmål")),
            Arc::new(InMemoryRetriever::default()),
            Arc::new(ScriptedLlm::fixed("svar")),
            Arc::new(FailingTts),
        ));
        let session = SessionDescriptor {
            room: "session-fp2".into(),
            join_token: "t".into(),
            livekit_url: "ws://livekit.test:7880".into(),
            tenant,
        };
        let reporter = Arc::new(RecordingReporter::default());
        let outcome = run_session(gateway, pipeline, &session, Some(reporter.clone()))
            .await
            .unwrap();
        assert_eq!(outcome.pipeline_failures, 1);
        let calls = reporter.calls.lock().unwrap();
        assert_eq!(calls.len(), 1);
        assert!(!calls[0].2, "answered=false on pipeline failure");
    }

    #[tokio::test]
    async fn empty_session_ends_cleanly() {
        let tenant = TenantId::new();
        let gateway = Arc::new(ScriptedGateway::default());
        let session = SessionDescriptor {
            room: "room".into(),
            join_token: "t".into(),
            livekit_url: "ws://livekit.test:7880".into(),
            tenant,
        };
        let outcome = run_session(gateway.clone(), pipeline_for(tenant), &session, None)
            .await
            .unwrap();
        assert_eq!(outcome.utterances_handled, 0);
        assert!(gateway.was_left());
    }

    #[tokio::test]
    async fn transient_stt_failure_skips_one_utterance_and_continues() {
        let tenant = TenantId::new();
        let gateway = Arc::new(ScriptedGateway::with_utterances(vec![
            Utterance::pcm16(vec![0; 1600]),
            Utterance::pcm16(vec![1; 1600]),
            Utterance::pcm16(vec![2; 1600]),
        ]));
        let pipeline = Arc::new(SupportPipeline::new(
            tenant,
            Arc::new(FlakyStt::new(1, "Hjælp med printeren")),
            Arc::new(InMemoryRetriever::default()),
            Arc::new(ScriptedLlm::fixed("Genstart printspooleren.")),
            Arc::new(TtsStub::default()),
        ));
        let session = SessionDescriptor {
            room: "session-flaky".into(),
            join_token: "token".into(),
            livekit_url: "ws://livekit.test:7880".into(),
            tenant,
        };
        let outcome = run_session(gateway.clone(), pipeline, &session, None)
            .await
            .unwrap();
        assert_eq!(outcome.utterances_handled, 3);
        assert_eq!(outcome.pipeline_failures, 1);
        assert_eq!(outcome.answers_spoken, 2);
        assert!(gateway.was_left());
    }

    #[tokio::test]
    async fn dead_tts_service_does_not_kill_the_session() {
        let tenant = TenantId::new();
        let gateway = Arc::new(ScriptedGateway::with_utterances(vec![
            Utterance::pcm16(vec![0; 1600]),
            Utterance::pcm16(vec![1; 1600]),
        ]));
        let pipeline = Arc::new(SupportPipeline::new(
            tenant,
            Arc::new(FakeStt::fixed("Hjælp")),
            Arc::new(InMemoryRetriever::default()),
            Arc::new(ScriptedLlm::fixed("Svar")),
            Arc::new(FailingTts),
        ));
        let session = SessionDescriptor {
            room: "session-no-tts".into(),
            join_token: "token".into(),
            livekit_url: "ws://livekit.test:7880".into(),
            tenant,
        };
        let outcome = run_session(gateway.clone(), pipeline, &session, None)
            .await
            .unwrap();
        assert_eq!(outcome.utterances_handled, 2);
        assert_eq!(outcome.pipeline_failures, 2);
        assert_eq!(outcome.answers_spoken, 0);
        assert!(gateway.was_left());
    }

    #[tokio::test]
    async fn media_drop_mid_session_ends_cleanly_with_error() {
        let tenant = TenantId::new();
        let gateway = Arc::new(FailAfterGateway::new(
            vec![Utterance::pcm16(vec![0; 1600])],
            1,
        ));
        let session = SessionDescriptor {
            room: "session-drop".into(),
            join_token: "token".into(),
            livekit_url: "ws://livekit.test:7880".into(),
            tenant,
        };
        let err = run_session(gateway.clone(), pipeline_for(tenant), &session, None)
            .await
            .unwrap_err();
        assert!(matches!(err, RuntimeError::Gateway(_)));
        // The room is always left, even on failure: no ghost AI participant.
        assert!(gateway.was_left());
    }
}
