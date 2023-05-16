use axum::{
    extract::{FromRef, Path},
    http::StatusCode,
    routing::{delete, get, patch, post},
    Json, Router,
};
use s3::Bucket;
use tracing::error;
use uuid::Uuid;

use crate::{
    models::version::{
        CreateInitialOrUpdateVersionRequest, CreateVersionWithParentsRequest, DocumentVersion,
    },
    services::{
        auth::{auth_keys::AuthKeys, claims::Claims},
        database::{repositories::documents::DocumentsRepository, DbPool},
        util::Res3,
    },
};

async fn create_version(
    mut documents_repository: DocumentsRepository,
    claims: Claims,
    Path(document_id): Path<Uuid>,
    Json(data): Json<CreateVersionWithParentsRequest>,
) -> Res3<DocumentVersion> {
    if data.parents.is_empty() {
        return Res3::Msg((
            StatusCode::BAD_REQUEST,
            "Version has to have at least 1 parent",
        ));
    }
    match documents_repository
        .create_version(
            claims.user_id,
            document_id,
            data.version_name,
            data.content,
            data.parents,
        )
        .await
    {
        Ok(version) => Res3::Json(Json(version)),
        Err(e) => {
            error!("{}", e);
            Res3::NoMsg(StatusCode::BAD_REQUEST)
        }
    }
}

async fn get_version(
    documents_repository: DocumentsRepository,
    _: Claims,
    Path((document_id, version_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<DocumentVersion>, StatusCode> {
    let versions = documents_repository
        .get_version(document_id, version_id)
        .await
        .map_err(|e| {
            error!("{}", e);
            StatusCode::BAD_REQUEST
        })?;
    Ok(Json(versions))
}

async fn get_versions(
    documents_repository: DocumentsRepository,
    _: Claims,
    Path(document_id): Path<Uuid>,
) -> Result<Json<Vec<DocumentVersion>>, StatusCode> {
    let versions = documents_repository
        .get_versions(document_id)
        .await
        .map_err(|e| {
            error!("{}", e);
            StatusCode::BAD_REQUEST
        })?;
    Ok(Json(versions))
}

async fn update_version(
    documents_repository: DocumentsRepository,
    _: Claims,
    Path((document_id, version_id)): Path<(Uuid, Uuid)>,
    Json(data): Json<CreateInitialOrUpdateVersionRequest>,
) -> StatusCode {
    match documents_repository
        .update_version(document_id, version_id, data.version_name, data.content)
        .await
    {
        Ok(true) => StatusCode::OK,
        Ok(false) => StatusCode::NOT_FOUND,
        Err(e) => {
            error!("{}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

async fn delete_version(
    documents_repository: DocumentsRepository,
    _: Claims,
    Path((document_id, version_id)): Path<(Uuid, Uuid)>,
) -> StatusCode {
    match documents_repository
        .delete_version(document_id, version_id)
        .await
    {
        Ok(true) => StatusCode::OK,
        Ok(false) => StatusCode::NOT_FOUND,
        Err(e) => {
            error!("{}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

pub fn versions_router<T>() -> Router<T>
where
    AuthKeys: FromRef<T>,
    DbPool: FromRef<T>,
    Bucket: FromRef<T>,
    T: 'static + Send + Sync + Clone,
{
    Router::new()
        .route("/:document_id", post(create_version))
        .route("/:document_id/versions", get(get_versions))
        .route("/:document_id/:version_id", get(get_version))
        .route("/:document_id/:version_id", patch(update_version))
        .route("/:document_id/:version_id", delete(delete_version))
}
