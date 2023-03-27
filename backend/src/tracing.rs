use tracing_appender::rolling::daily;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub fn setup_tracing() {
    // Setup logging
    tracing_subscriber::registry()
        // Filtering layer
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "webserver=debug,tower_http=debug".into()),
        )
        // File sink layer in JSON format with daily rolling
        .with(
            tracing_subscriber::fmt::layer()
                .json()
                .with_writer(daily("logs", "webserver")),
        )
        // Console sink layer in human readable format
        .with(tracing_subscriber::fmt::layer().pretty())
        .init();
}
