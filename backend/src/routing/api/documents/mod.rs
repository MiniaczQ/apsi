mod attachments;
mod documents;
mod permission;
mod states;
mod versions;

use axum::{extract::FromRef, Router};
use s3::Bucket;

use crate::services::{auth::auth_keys::AuthKeys, database::DbPool};

pub fn documents_router<T>() -> Router<T>
where
    AuthKeys: FromRef<T>,
    DbPool: FromRef<T>,
    Bucket: FromRef<T>,
    T: 'static + Send + Sync + Clone,
{
    Router::new()
        .merge(attachments::attachments_router())
        .merge(documents::documents_router())
        .merge(permission::permission_router())
        .merge(states::states_router())
        .merge(versions::versions_router())
}
