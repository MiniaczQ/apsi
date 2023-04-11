use axum::extract::FromRef;
use bb8::Pool;
use bb8_postgres::PostgresConnectionManager;
use tokio_postgres::NoTls;

use crate::routing::api::auth::authorization_keys::AuthorizationKeys;

#[derive(FromRef, Clone)]
pub struct AppState {
    pub authorization_keys: AuthorizationKeys,
    pub database: Pool<PostgresConnectionManager<NoTls>>,
}
