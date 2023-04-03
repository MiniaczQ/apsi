pub mod api;
mod healthcheck;
mod static_files;

use axum::{extract::FromRef, Router};
use tower_http::{cors::CorsLayer, trace::TraceLayer};

use crate::config::AppConfig;

use self::{
    api::{api_router, auth::authorization_keys::AuthorizationKeys},
    healthcheck::healthcheck_router,
    static_files::static_files_service,
};

#[derive(FromRef, Clone)]
struct AppState {
    authorization_keys: AuthorizationKeys,
}

pub fn main_route<T>(config: &AppConfig) -> Router<T>
where
    T: 'static + Send + Sync + Clone,
{
    let state = AppState {
        authorization_keys: (&config.authorization_keys)
            .try_into()
            .expect("Missing PEMs"),
    };

    let mut router = Router::new()
        .merge(healthcheck_router())
        .nest("/api", api_router())
        .fallback_service(static_files_service())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    if config.cors {
        router = router.layer(CorsLayer::permissive());
    }

    router
}
