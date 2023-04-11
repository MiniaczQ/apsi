mod config;
pub mod database;
mod routing;
mod signals;
pub mod state;
mod tracing;

use ::tracing::info;

use crate::{
    config::get_config, database::setup_database, routing::main_route, signals::shutdown_signal,
    state::AppState, tracing::setup_tracing,
};

#[tokio::main]
async fn main() {
    setup_tracing();

    // Setup config
    let config = get_config();

    // Setup database connection
    let database_pool = setup_database(&config)
        .await
        .expect("Could not setup database");

    // App state
    let state = AppState {
        authorization_keys: (&config.authorization_keys)
            .try_into()
            .expect("Missing PEMs"),
        database: database_pool,
    };

    // Example log
    info!("Hosting started. Listening on: {}", &config.url);
    // New server bound to provided address
    axum::Server::bind(&config.url)
        // Router turned into a service to be served
        .serve(main_route(&config).with_state(state).into_make_service())
        // Shutdown detected by a `Future` (Task / async function) finishing
        .with_graceful_shutdown(shutdown_signal())
        // Wait for future to finish
        .await
        .unwrap();
}
