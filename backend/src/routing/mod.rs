mod api;
mod healthcheck;
mod static_files;

use axum::Router;
use tower_http::trace::TraceLayer;

use self::{api::api_router, healthcheck::healthcheck_router, static_files::static_files_service};

pub fn main_route() -> Router {
    Router::new()
        .layer(TraceLayer::new_for_http())
        .merge(healthcheck_router())
        .nest("/api", api_router())
        .fallback_service(static_files_service())
}
