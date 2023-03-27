use axum::{routing::get, Router};

// Simplest endpoint
// Arguments can load parts of request, states (from dependency injection) and formatter request body (like JSON)
// Return type needs the ability to turn into HTTP Response, which is implemented for static string slice
async fn health() -> &'static str {
    "healthy"
}

pub fn healthcheck_router() -> Router {
    Router::new().route("/health", get(health))
}
