//! Media gateway lives in ai-core (shared with crates/media-livekit).
//! This module re-exports it so worker code keeps its existing paths.

pub use nordsvar_ai_core::media::*;
