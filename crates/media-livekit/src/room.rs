//! LiveKit room adapter: the real MediaGateway. Joins a room as the AI
//! participant, receives the caller's audio track, and publishes TTS audio.
//!
//! Build note: the `livekit` crate compiles a C++ bridge and requires
//! clang++ (webrtc-sys links a prebuilt libwebrtc). CI images have clang;
//! local builders need clang++ on PATH or CXX set.

use async_trait::async_trait;
use livekit::options::TrackPublishOptions;
use livekit::prelude::*;
use livekit::webrtc::audio_source::native::NativeAudioSource;
use livekit::webrtc::audio_stream::native::NativeAudioStream;
use livekit::Room;
use nordsvar_ai_core::types::{AudioChunk, Utterance};
use std::sync::atomic::{AtomicBool, Ordering};
use tokio::sync::mpsc;
use tokio::sync::Mutex;

/// LiveKit-backed gateway. One instance per session (created per claim).
pub struct LiveKitGateway {
    room: Mutex<Option<Room>>,
    /// Caller utterances assembled from the subscribed audio track.
    utterances: Mutex<mpsc::UnboundedReceiver<Utterance>>,
    /// Moved into the room event task on join; when the task ends (room
    /// empty or disconnected), the sender drops and the receiver sees the
    /// channel close - that is how sessions end.
    utterance_tx: Mutex<Option<mpsc::UnboundedSender<Utterance>>>,
    audio_source: Mutex<Option<NativeAudioSource>>,
    connected: AtomicBool,
}

impl LiveKitGateway {
    pub fn new() -> Self {
        let (tx, rx) = mpsc::unbounded_channel();
        Self {
            room: Mutex::new(None),
            utterances: Mutex::new(rx),
            utterance_tx: Mutex::new(Some(tx)),
            audio_source: Mutex::new(None),
            connected: AtomicBool::new(false),
        }
    }
}

impl Default for LiveKitGateway {
    fn default() -> Self {
        Self::new()
    }
}

fn base64_decode_lenient(input: &str, pad: &str) -> Option<Vec<u8>> {
    // URL-safe base64 without pulling in a crate: manual alphabet decode.
    let s = format!("{input}{pad}");
    let mut out = Vec::new();
    let bytes: Vec<u8> = s
        .bytes()
        .filter_map(|c| match c {
            b'A'..=b'Z' => Some(c - b'A'),
            b'a'..=b'z' => Some(c - b'a' + 26),
            b'0'..=b'9' => Some(c - b'0' + 52),
            b'-' => Some(62),
            b'_' => Some(63),
            _ => None,
        })
        .collect();
    for chunk in bytes.chunks(4) {
        if chunk.len() < 2 {
            break;
        }
        let n = chunk.iter().fold(0u32, |acc, &v| (acc << 6) | v as u32);
        out.push((n >> 16) as u8);
        if chunk.len() > 2 {
            out.push((n >> 8) as u8);
        }
        if chunk.len() > 3 {
            out.push(n as u8);
        }
    }
    Some(out)
}

#[async_trait]
impl nordsvar_ai_core::media::MediaGateway for LiveKitGateway {
    async fn join(
        &self,
        session: &nordsvar_ai_core::media::SessionDescriptor,
    ) -> Result<(), String> {
        let (room, mut events) = Room::connect(
            &session.livekit_url,
            &session.join_token,
            livekit::RoomOptions::default(),
        )
        .await
        .map_err(|e| format!("join room {}: {e}", session.room))?;

        // Publish our TTS output as a native audio track.
        let source = NativeAudioSource::new(Default::default(), 16_000, 1, 1_000);
        let track = LocalAudioTrack::create_audio_track(
            "nordsvar-voice",
            livekit::webrtc::audio_source::RtcAudioSource::Native(source.clone()),
        );
        room.local_participant()
            .publish_track(LocalTrack::Audio(track), TrackPublishOptions::default())
            .await
            .map_err(|e| format!("publish audio track: {e}"))?;
        *self.audio_source.lock().await = Some(source);

        // Subscribe to the caller's audio and forward utterance frames.
        // Lifecycle: when the last remote participant leaves (or the server
        // disconnects us), close the utterance channel so the runtime ends
        // the session and leaves the room - the AI must never linger alone
        // in a room.
        let tx = self
            .utterance_tx
            .lock()
            .await
            .take()
            .ok_or("gateway already joined or closed")?;
        let who = session
            .join_token
            .split('.')
            .nth(1)
            .and_then(|p| {
                let pad = match p.len() % 4 {
                    2 => "==",
                    3 => "=",
                    _ => "",
                };
                base64_decode_lenient(p, pad)
            })
            .and_then(|b| String::from_utf8(b).ok())
            .and_then(|j| {
                j.split("\"sub\":\"")
                    .nth(1)?
                    .split('\"')
                    .next()
                    .map(str::to_owned)
            })
            .unwrap_or_else(|| "?".into());
        tokio::spawn(async move {
            let mut remote_participants: usize = 0;
            // Audio forwarding tasks hold a clone of the utterance sender;
            // the channel only closes once they are all gone. Their streams
            // do not reliably terminate on unsubscribe, so they are aborted
            // explicitly when the session ends.
            let mut audio_tasks = tokio::task::JoinSet::new();
            let debug = std::env::var("NORDSVAR_LK_DEBUG").is_ok();
            while let Some(event) = events.recv().await {
                if debug {
                    let text = format!("{event:?}");
                    let cut: String = text.chars().take(250).collect();
                    eprintln!("[lk-events:{who}] {cut}");
                }
                match event {
                    RoomEvent::TrackSubscribed {
                        track: RemoteTrack::Audio(audio),
                        ..
                    } => {
                        let tx = tx.clone();
                        audio_tasks.spawn(async move {
                            let mut stream = NativeAudioStream::new(audio.rtc_track(), 16_000, 1);
                            // VAD: segment speech into utterances; silence
                            // and comfort noise never reach STT (whisper
                            // hallucinates text from noise). See
                            // nordsvar_ai_core::vad.
                            let mut segmenter = nordsvar_ai_core::vad::UtteranceSegmenter::new(
                                nordsvar_ai_core::vad::VadConfig::default_16k(),
                            );
                            let vad_debug = std::env::var("NORDSVAR_VAD_DEBUG").is_ok();
                            let mut dbg_frames = 0usize;
                            while let Some(frame) = futures_util::StreamExt::next(&mut stream).await
                            {
                                if vad_debug {
                                    dbg_frames += 1;
                                    if dbg_frames % 50 == 1 {
                                        let e: f64 = frame
                                            .data
                                            .iter()
                                            .map(|&s| (s as f64) * (s as f64))
                                            .sum();
                                        let rms = if frame.data.is_empty() {
                                            0.0
                                        } else {
                                            (e / frame.data.len() as f64).sqrt()
                                        };
                                        eprintln!(
                                            "[vad] frame {dbg_frames} n={} rms={rms:.0}",
                                            frame.data.len()
                                        );
                                    }
                                }
                                for samples in segmenter.push(&frame.data) {
                                    if tx.send(Utterance::pcm16(samples)).is_err() {
                                        return;
                                    }
                                }
                            }
                            if let Some(samples) = segmenter.flush() {
                                let _ = tx.send(Utterance::pcm16(samples));
                            }
                        });
                    }
                    RoomEvent::ParticipantConnected(_) => {
                        remote_participants += 1;
                    }
                    RoomEvent::ParticipantDisconnected(_) => {
                        remote_participants = remote_participants.saturating_sub(1);
                        if remote_participants == 0 {
                            // Dropping the last sender closes the channel;
                            // next_utterance returns None and the session
                            // ends cleanly.
                            audio_tasks.abort_all();
                            return;
                        }
                    }
                    RoomEvent::Disconnected { .. } => {
                        audio_tasks.abort_all();
                        return;
                    }
                    _ => {}
                }
            }
        });

        *self.room.lock().await = Some(room);
        self.connected.store(true, Ordering::SeqCst);
        Ok(())
    }

    async fn next_utterance(&self) -> Result<Option<Utterance>, String> {
        let mut guard = self.utterances.lock().await;
        match guard.recv().await {
            Some(u) => Ok(Some(u)),
            // Channel closed: all senders dropped (room event loop ended).
            None if self.connected.load(Ordering::SeqCst) => Ok(None),
            None => Ok(None),
        }
    }

    async fn publish_audio(&self, audio: &AudioChunk) -> Result<(), String> {
        let guard = self.audio_source.lock().await;
        let source = guard.as_ref().ok_or("not joined")?;
        let frame = livekit::webrtc::audio_frame::AudioFrame {
            data: audio.samples.clone().into(),
            sample_rate: audio.sample_rate_hz,
            num_channels: 1,
            samples_per_channel: audio.samples.len() as u32,
        };
        source
            .capture_frame(&frame)
            .await
            .map_err(|e| format!("capture frame: {e}"))
    }

    async fn leave(&self) -> Result<(), String> {
        self.connected.store(false, Ordering::SeqCst);
        let taken = self.room.lock().await.take();
        if let Some(room) = taken {
            room.close().await.map_err(|e| e.to_string())?;
        }
        Ok(())
    }
}
