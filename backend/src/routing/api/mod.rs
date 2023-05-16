//! Api server

pub mod auth;
pub mod docs;

use axum::{extract::FromRef, http::StatusCode, response::IntoResponse, Router};
use s3::Bucket;

use crate::services::{auth::auth_keys::AuthKeys, database::DbPool};

use self::{auth::auth_router, docs::documents_router};

pub fn api_router<T>() -> Router<T>
where
    AuthKeys: FromRef<T>,
    DbPool: FromRef<T>,
    Bucket: FromRef<T>,
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
