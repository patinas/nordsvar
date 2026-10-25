//! Nordsvar AI worker binary.

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "nordsvar_ai_worker=info".into()),
        )
        .init();
    let config = nordsvar_ai_worker::dispatch::WorkerConfig::from_env();
    if config.internal_token.is_empty() {
        tracing::error!("INTERNAL_TOKEN is required (shared secret with the API); exiting");
        std::process::exit(1);
    }
    tracing::info!(
        api = %config.api_url,
        llm = %config.llm_url,
        "nordsvar-ai-worker dispatch loop starting"
    );
    // Media gateway selection: MEDIA_DRIVER=livekit joins real LiveKit rooms
    // through crates/media-livekit; anything else keeps the scripted gateway
    // used by tests and offline development.
    let driver = std::env::var("MEDIA_DRIVER").unwrap_or_else(|_| "scripted".to_string());
    if driver == "livekit" {
        tracing::info!("media driver: livekit");
        nordsvar_ai_worker::dispatch::run(config, || {
            std::sync::Arc::new(nordsvar_media_livekit::room::LiveKitGateway::new())
        })
        .await;
    } else {
        tracing::info!(driver = %driver, "media driver: scripted (set MEDIA_DRIVER=livekit for real rooms)");
        nordsvar_ai_worker::dispatch::run(config, || {
            std::sync::Arc::new(nordsvar_ai_worker::gateway::ScriptedGateway::default())
        })
        .await;
    }
}
