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

pub fn main_route<T>(config: &AppConfig) -> Router<T>
where
    AuthorizationKeys: FromRef<T>,
    T: 'static + Send + Sync + Clone,
{
    let mut router = Router::new()
        .merge(healthcheck_router())
        .nest("/api", api_router())
        .fallback_service(static_files_service())
        .layer(TraceLayer::new_for_http());

    if config.cors {
        router = router.layer(CorsLayer::permissive());
    }

    router
}
