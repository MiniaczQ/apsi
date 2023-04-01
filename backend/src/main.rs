mod config;
mod routing;
mod signals;
mod tracing;

use ::tracing::info;

use crate::{
    config::get_config, routing::main_route, signals::shutdown_signal, tracing::setup_tracing,
};

#[tokio::main]
async fn main() {
    setup_tracing();

    // Setup config
    let config = get_config();

    // Example log
    info!("Hosting started. Listening on: {}", &config.url);
    // New server bound to provided address
    axum::Server::bind(&config.url)
        // Router turned into a service to be served
        .serve(main_route(&config).into_make_service())
        // Shutdown detected by a `Future` (Task / async function) finishing
        .with_graceful_shutdown(shutdown_signal())
        // Wait for future to finish
        .await
        .unwrap();
}
