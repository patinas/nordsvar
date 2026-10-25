//! Utterance segmentation over synthetic PCM: the contract the media
//! adapter relies on in a live room.

use nordsvar_ai_core::vad::{UtteranceSegmenter, VadConfig};

fn tone(samples: usize, amplitude: i16) -> Vec<i16> {
    // A simple alternating waveform is enough for energy-based detection.
    (0..samples)
        .map(|i| if i % 2 == 0 { amplitude } else { -amplitude })
        .collect()
}

fn silence(samples: usize) -> Vec<i16> {
    vec![0; samples]
}

fn comfort_noise(samples: usize) -> Vec<i16> {
    // WebRTC comfort noise is very quiet; 20 RMS is already generous.
    tone(samples, 20)
}

#[test]
fn silence_produces_no_utterances() {
    let mut seg = UtteranceSegmenter::new(VadConfig::default_16k());
    let closed = seg.push(&silence(16_000 * 5));
    assert!(closed.is_empty());
    assert!(seg.flush().is_none());
}

#[test]
fn comfort_noise_never_opens_an_utterance() {
    let mut seg = UtteranceSegmenter::new(VadConfig::default_16k());
    for _ in 0..20 {
        assert!(seg.push(&comfort_noise(16_000 / 2)).is_empty());
    }
    assert!(seg.flush().is_none());
}

#[test]
fn speech_then_pause_closes_one_utterance_after_hangover() {
    let mut seg = UtteranceSegmenter::new(VadConfig::default_16k());
    assert!(seg.push(&tone(16_000 * 2, 3_000)).is_empty()); // still talking
    let closed = seg.push(&silence(16_000)); // 1 s > 700 ms hangover
    assert_eq!(closed.len(), 1);
    // The 2 s of speech, trailing hangover silence trimmed.
    assert!(closed[0].len() >= 16_000 * 2);
    assert!(closed[0].len() <= 16_000 * 2 + 1_600);
    assert!(seg.flush().is_none());
}

#[test]
fn two_sentences_with_a_pause_become_two_utterances() {
    let mut seg = UtteranceSegmenter::new(VadConfig::default_16k());
    let mut all = Vec::new();
    all.extend(seg.push(&tone(16_000, 3_000)));
    all.extend(seg.push(&silence(16_000)));
    all.extend(seg.push(&tone(16_000, 3_000)));
    all.extend(seg.push(&silence(16_000)));
    assert_eq!(all.len(), 2);
}

#[test]
fn short_clicks_are_dropped() {
    let mut seg = UtteranceSegmenter::new(VadConfig::default_16k());
    // 100 ms of loud noise then silence: above the floor but below the
    // 300 ms minimum utterance length.
    assert!(seg.push(&tone(1_600, 6_000)).is_empty());
    assert!(seg.push(&silence(16_000)).is_empty());
    assert!(seg.flush().is_none());
}

#[test]
fn endless_speech_is_force_closed_at_the_cap() {
    let mut seg = UtteranceSegmenter::new(VadConfig::default_16k());
    let mut all = Vec::new();
    for _ in 0..40 {
        all.extend(seg.push(&tone(16_000, 3_000))); // 1 s each
    }
    // 40 s of continuous speech, 15 s cap: at least two closes, each at
    // the cap, and something still open at the end.
    assert!(all.len() >= 2);
    assert!(all.iter().all(|u| u.len() >= 240_000));
    assert!(seg.flush().is_some());
}

#[test]
fn flush_mid_speech_returns_the_partial_utterance() {
    let mut seg = UtteranceSegmenter::new(VadConfig::default_16k());
    assert!(seg.push(&tone(16_000, 3_000)).is_empty());
    let last = seg.flush().expect("open speech should flush");
    assert!(last.len() >= 16_000);
}

#[test]
fn noise_floor_adapts_without_swallowing_speech() {
    let mut seg = UtteranceSegmenter::new(VadConfig::default_16k());
    // A noisy line (fans, traffic hum) at 600 RMS for 10 s.
    for _ in 0..20 {
        assert!(seg.push(&tone(16_000 / 2, 600)).is_empty());
    }
    // Speech well above the adapted floor still opens an utterance.
    assert!(seg.push(&tone(16_000, 5_000)).is_empty());
    let closed = seg.push(&silence(16_000));
    assert_eq!(closed.len(), 1);
}

#[test]
fn frames_survive_arbitrary_push_boundaries() {
    // Real NativeAudioStream frames are 10/20 ms but nothing guarantees
    // it; segmentation must not depend on call chunking.
    let mut seg = UtteranceSegmenter::new(VadConfig::default_16k());
    let signal: Vec<i16> = [tone(16_000 * 2, 3_000), silence(16_000)].concat();
    let mut odd_calls = Vec::new();
    for chunk in signal.chunks(137) {
        odd_calls.extend(seg.push(chunk));
    }
    assert_eq!(odd_calls.len(), 1);
}
