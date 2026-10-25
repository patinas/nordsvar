//! Energy-based voice activity detection for caller audio. The media
//! adapter feeds 16 kHz mono PCM16; this segments it into utterances:
//! speech starts after a short onset, ends after a silence hangover, and
//! never runs past a hard maximum length. An adaptive noise floor keeps
//! WebRTC comfort noise (NativeAudioStream emits it between frames) from
//! waking the STT with silence, which whisper-class models otherwise
//! hallucinate text from. No model, no dependency: RMS energy only.

/// Tuning for [`UtteranceSegmenter`]. Defaults target 16 kHz mono.
#[derive(Debug, Clone)]
pub struct VadConfig {
    /// Analysis frame size in samples (20 ms at 16 kHz).
    pub frame_samples: usize,
    /// Consecutive speech-classified frames before an utterance opens
    /// (60 ms). Shorter onsets are treated as clicks.
    pub onset_frames: usize,
    /// Silence frames that close an open utterance (700 ms).
    pub end_silence_frames: usize,
    /// Utterances shorter than this after close are dropped (300 ms).
    pub min_utterance_samples: usize,
    /// Hard cap: an open utterance closes here even mid-speech (15 s), so
    /// a talkative caller still reaches STT in bounded time.
    pub max_utterance_samples: usize,
    /// Absolute RMS floor for "speech". Below this, frames always update
    /// the noise floor and never open an utterance, whatever the adaptive
    /// floor says. Comfort noise sits far under this; speech far above.
    pub absolute_min_rms: f32,
    /// Speech requires RMS above noise_floor * this margin.
    pub floor_margin: f32,
    /// EMA smoothing for the noise floor (higher = slower adaptation).
    pub floor_smoothing: f32,
}

impl VadConfig {
    /// Defaults for 16 kHz mono PCM16.
    pub fn default_16k() -> Self {
        Self {
            frame_samples: 320,             // 20 ms
            onset_frames: 3,                // 60 ms
            end_silence_frames: 35,         // 700 ms
            min_utterance_samples: 4_800,   // 300 ms
            max_utterance_samples: 240_000, // 15 s
            absolute_min_rms: 250.0,
            floor_margin: 3.5,
            floor_smoothing: 0.95,
        }
    }
}

/// Turns a PCM16 sample stream into speech utterances.
pub struct UtteranceSegmenter {
    cfg: VadConfig,
    noise_floor: f32,
    /// Partial frame carried between push calls.
    pending: Vec<i16>,
    /// Onset streak while not yet in speech.
    onset_run: usize,
    /// Pre-roll of the last onset frames, kept so the utterance starts
    /// with the first consonant, not after it.
    pre_roll: Vec<Vec<i16>>,
    in_speech: bool,
    speech_buf: Vec<i16>,
    silence_run: usize,
}

fn rms(frame: &[i16]) -> f32 {
    if frame.is_empty() {
        return 0.0;
    }
    let energy: f64 = frame.iter().map(|&s| (s as f64) * (s as f64)).sum::<f64>();
    (energy / frame.len() as f64).sqrt() as f32
}

impl UtteranceSegmenter {
    pub fn new(cfg: VadConfig) -> Self {
        Self {
            noise_floor: cfg.absolute_min_rms,
            pending: Vec::new(),
            onset_run: 0,
            pre_roll: Vec::new(),
            in_speech: false,
            speech_buf: Vec::new(),
            silence_run: 0,
            cfg,
        }
    }

    /// Feed samples; returns every utterance that closed during this call
    /// (usually zero or one).
    pub fn push(&mut self, samples: &[i16]) -> Vec<Vec<i16>> {
        self.pending.extend_from_slice(samples);
        let mut closed = Vec::new();
        while self.pending.len() >= self.cfg.frame_samples {
            let frame: Vec<i16> = self.pending.drain(..self.cfg.frame_samples).collect();
            if let Some(u) = self.process_frame(frame) {
                closed.push(u);
            }
        }
        closed
    }

    /// End of stream: close any open utterance. Returns it when it meets
    /// the minimum length.
    pub fn flush(&mut self) -> Option<Vec<i16>> {
        if self.in_speech {
            return self.close_utterance();
        }
        None
    }

    fn is_speech(&self, frame: &[i16]) -> bool {
        let level = rms(frame);
        level >= self.cfg.absolute_min_rms && level >= self.noise_floor * self.cfg.floor_margin
    }

    fn process_frame(&mut self, frame: Vec<i16>) -> Option<Vec<i16>> {
        let level = rms(&frame);
        if !self.in_speech {
            // Frames below the absolute floor are certainly noise; learn
            // from them. (Speech-shaped frames pause adaptation so a loud
            // environment does not chase the caller's voice upward.)
            if level < self.cfg.absolute_min_rms {
                self.noise_floor = self.cfg.floor_smoothing * self.noise_floor
                    + (1.0 - self.cfg.floor_smoothing) * level;
            }
            if self.is_speech(&frame) {
                self.onset_run += 1;
                self.pre_roll.push(frame);
                if self.onset_run >= self.cfg.onset_frames {
                    self.in_speech = true;
                    self.silence_run = 0;
                    self.speech_buf = self.pre_roll.concat();
                    self.pre_roll.clear();
                }
            } else {
                self.onset_run = 0;
                self.pre_roll.clear();
            }
            return None;
        }

        // In speech.
        if self.is_speech(&frame) {
            self.silence_run = 0;
        } else {
            self.silence_run += 1;
        }
        self.speech_buf.extend_from_slice(&frame);
        if self.silence_run >= self.cfg.end_silence_frames {
            // The hangover silence is not speech: trim it before the
            // minimum-length check and before STT (endpointer semantics -
            // a 100 ms click padded with 700 ms of silence is still a
            // click, not an utterance).
            let trim = self.silence_run * self.cfg.frame_samples;
            self.speech_buf.truncate(self.speech_buf.len() - trim);
            return self.close_utterance();
        }
        if self.speech_buf.len() >= self.cfg.max_utterance_samples {
            return self.close_utterance();
        }
        None
    }

    fn close_utterance(&mut self) -> Option<Vec<i16>> {
        self.in_speech = false;
        self.onset_run = 0;
        self.silence_run = 0;
        let buf = std::mem::take(&mut self.speech_buf);
        if buf.len() >= self.cfg.min_utterance_samples {
            Some(buf)
        } else {
            None
        }
    }
}
