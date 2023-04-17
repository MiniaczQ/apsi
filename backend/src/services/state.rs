use axum::extract::FromRef;
use s3::Bucket;

use super::{auth::auth_keys::AuthKeys, database::DbPool};

#[derive(FromRef, Clone)]
pub struct AppState {
    pub auth_keys: AuthKeys,
    pub database: DbPool,
    pub s3storage: Bucket,
}
