//! Nordsvar API binary: session manager and REST/token surface.

use nordsvar_api::app::{build_router, AppState};
use nordsvar_api::config::Config;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "nordsvar_api=info,tower_http=info".into()),
        )
        .init();

    let config = Config::from_env();
    let bind = config.bind_addr.clone();
    let state = match std::env::var("DATABASE_URL") {
        Ok(url) => {
            let pg = nordsvar_api::store_pg::PgStore::connect(&url)
                .await
                .expect("postgres connect");
            pg.migrate().await.expect("migrations");
            tracing::info!("postgres-backed stores active");
            AppState::postgres(config, pg)
        }
        Err(_) => {
            tracing::warn!("DATABASE_URL unset; using in-memory stores (development only)");
            AppState::in_memory(config)
        }
    };
    let app = build_router(state);

    let listener = tokio::net::TcpListener::bind(&bind)
        .await
        .unwrap_or_else(|e| panic!("failed to bind {bind}: {e}"));
    tracing::info!(%bind, "nordsvar-api listening");
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .expect("server error");
}

async fn shutdown_signal() {
    let _ = tokio::signal::ctrl_c().await;
    tracing::info!("shutdown signal received");
}
