use axum::{
    extract::{FromRef, Path},
    http::StatusCode,
    routing::post,
    Router,
};
use s3::Bucket;
use tracing::error;
use uuid::Uuid;

use crate::{
    models::version_state::DocumentVersionState,
    services::{
        auth::{auth_keys::AuthKeys, claims::Claims},
        database::{repositories::documents::DocumentsRepository, DbPool},
    },
};

async fn change_state(
    documents_repository: DocumentsRepository,
    _: Claims,
    Path((document_id, version_id, new_state)): Path<(Uuid, Uuid, DocumentVersionState)>,
) -> StatusCode {
    match documents_repository
        .change_state(document_id, version_id, new_state)
        .await
    {
        Ok(true) => StatusCode::OK,
        Ok(false) => StatusCode::BAD_REQUEST,
        Err(error) => {
            error!({ error = error.to_string() }, "Error when changing state");
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

pub fn states_router<T>() -> Router<T>
where
    AuthKeys: FromRef<T>,
    DbPool: FromRef<T>,
    Bucket: FromRef<T>,
    T: 'static + Send + Sync + Clone,
{
    Router::new().route(
        "/:document_id/:version_id/change-state/:state",
        post(change_state),
    )
}
