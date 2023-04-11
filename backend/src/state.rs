use axum::extract::FromRef;

use crate::{database::DbPool, routing::api::auth::authorization_keys::AuthorizationKeys};

#[derive(FromRef, Clone)]
pub struct AppState {
    pub authorization_keys: AuthorizationKeys,
    pub database: DbPool,
}
