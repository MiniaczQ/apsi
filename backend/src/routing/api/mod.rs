//! Api server

use axum::{http::StatusCode, response::IntoResponse, Router};

pub fn api_router() -> Router {
    Router::new().fallback(handler_404)
}

async fn handler_404() -> impl IntoResponse {
    StatusCode::NOT_FOUND
}
