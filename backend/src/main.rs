mod routing;
mod services;

use ::tracing::info;

use crate::{
    routing::main_route,
    services::{
        config::setup_config, database::setup_database, s3storage::setup_s3storage,
        signals::shutdown_signal, state::AppState, tracing::setup_tracing,
    },
};

#[tokio::main]
async fn main() {
    let config = setup_config();
    setup_tracing(&config);
    let auth_keys = (&config.auth_keys).try_into().expect("Missing PEMs");
    let database = setup_database(&config).await;
    let s3storage = setup_s3storage(&config).await;

    let state = AppState {
        auth_keys,
        database,
        s3storage,
    };

    info!("Hosting started. Listening on: {}", &config.webserver.url);
    axum::Server::bind(&config.webserver.url)
        .serve(main_route(&config).with_state(state).into_make_service())
        .with_graceful_shutdown(shutdown_signal())
        .await
        .unwrap();
}
