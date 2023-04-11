//! Api server

pub mod auth;
pub mod documents;

use axum::{extract::FromRef, http::StatusCode, response::IntoResponse, Router};

use crate::database::DbPool;

use self::{
    auth::{auth_router, authorization_keys::AuthorizationKeys},
    documents::documents_router,
};

pub fn api_router<T>() -> Router<T>
where
    AuthorizationKeys: FromRef<T>,
    DbPool: FromRef<T>,
    T: 'static + Send + Sync + Clone,
{
    Router::new()
        .nest("/auth", auth_router())
        .nest("/documents", documents_router())
        .fallback(handler_404)
}

async fn handler_404() -> impl IntoResponse {
    StatusCode::NOT_FOUND
}
