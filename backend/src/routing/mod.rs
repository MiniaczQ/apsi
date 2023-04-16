pub mod api;
mod healthcheck;
mod static_files;

use axum::{extract::FromRef, Router};
use s3::Bucket;
use tower_http::{cors::CorsLayer, trace::TraceLayer};

use crate::services::{auth::auth_keys::AuthKeys, config::Config, database::DbPool};

use self::{api::api_router, healthcheck::healthcheck_router, static_files::static_files_service};

pub fn main_route<T>(config: &Config) -> Router<T>
where
    AuthKeys: FromRef<T>,
    DbPool: FromRef<T>,
    Bucket: FromRef<T>,
    T: 'static + Send + Sync + Clone,
{
    let mut router = Router::new()
        .merge(healthcheck_router())
        .nest("/api", api_router())
        .fallback_service(static_files_service())
        .layer(TraceLayer::new_for_http());

    if config.webserver.cors {
        router = router.layer(CorsLayer::permissive());
    }

    router
}
