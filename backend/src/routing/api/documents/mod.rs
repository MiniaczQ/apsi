use axum::{
    extract::{FromRef, Path},
    http::StatusCode,
    routing::{delete, get, patch, post},
    Json, Router,
};
use serde::Deserialize;
use tracing::error;
use uuid::Uuid;

use crate::database::{
    repositories::documents::{Document, DocumentVersion, DocumentsRepository},
    DbPool,
};

use super::auth::{authorization_keys::AuthorizationKeys, claims::Claims};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateOrUpdateDocumentRequest {
    document_name: String,
}

async fn create_document(
    documents_repository: DocumentsRepository,
    _: Claims,
    Json(data): Json<CreateOrUpdateDocumentRequest>,
) -> Result<Json<Document>, StatusCode> {
    let document = documents_repository
        .create_document(data.document_name)
        .await
        .map_err(|e| {
            error!("{}", e);
            StatusCode::BAD_REQUEST
        })?;
    Ok(Json(document))
}

async fn get_document(
    documents_repository: DocumentsRepository,
    _: Claims,
    Path(document_id): Path<Uuid>,
) -> Result<Json<Document>, StatusCode> {
    let documents = documents_repository
        .get_document(document_id)
        .await
        .map_err(|e| {
            error!("{}", e);
            StatusCode::BAD_REQUEST
        })?;
    Ok(Json(documents))
}

async fn get_documents(
    documents_repository: DocumentsRepository,
    _: Claims,
) -> Result<Json<Vec<Document>>, StatusCode> {
    let documents = documents_repository.get_documents().await.map_err(|e| {
        error!("{}", e);
        StatusCode::BAD_REQUEST
    })?;
    Ok(Json(documents))
}

async fn update_document(
    documents_repository: DocumentsRepository,
    _: Claims,
    Path(document_id): Path<Uuid>,
    Json(update): Json<CreateOrUpdateDocumentRequest>,
) -> StatusCode {
    match documents_repository
        .update_document(document_id, update.document_name)
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

async fn delete_document(
    documents_repository: DocumentsRepository,
    _: Claims,
    Path(document_id): Path<Uuid>,
) -> StatusCode {
    match documents_repository.delete_document(document_id).await {
        Ok(true) => StatusCode::OK,
        Ok(false) => StatusCode::NOT_FOUND,
        Err(e) => {
            error!("{}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateOrUpdateVersionRequest {
    version_name: String,
    content: String,
}

async fn create_version(
    documents_repository: DocumentsRepository,
    _: Claims,
    Path(document_id): Path<Uuid>,
    Json(data): Json<CreateOrUpdateVersionRequest>,
) -> Result<Json<DocumentVersion>, StatusCode> {
    let version = documents_repository
        .create_version(document_id, data.version_name, data.content)
        .await
        .map_err(|e| {
            error!("{}", e);
            StatusCode::BAD_REQUEST
        })?;
    Ok(Json(version))
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

async fn get_version_content(
    documents_repository: DocumentsRepository,
    _: Claims,
    Path((document_id, version_id)): Path<(Uuid, Uuid)>,
) -> Result<String, StatusCode> {
    let content = documents_repository
        .get_version_content(document_id, version_id)
        .await
        .map_err(|e| {
            error!("{}", e);
            StatusCode::BAD_REQUEST
        })?;
    Ok(content)
}

async fn update_version(
    documents_repository: DocumentsRepository,
    _: Claims,
    Path((document_id, version_id)): Path<(Uuid, Uuid)>,
    Json(data): Json<CreateOrUpdateVersionRequest>,
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

pub fn documents_router<T>() -> Router<T>
where
    AuthorizationKeys: FromRef<T>,
    DbPool: FromRef<T>,
    T: 'static + Send + Sync + Clone,
{
    Router::new()
        .route("/", post(create_document))
        .route("/", get(get_documents))
        .route("/:document_id", post(create_version))
        .route("/:document_id", get(get_document))
        .route("/:document_id", patch(update_document))
        .route("/:document_id", delete(delete_document))
        .route("/:document_id/versions", get(get_versions))
        .route("/:document_id/:version_id", get(get_version))
        .route("/:document_id/:version_id", patch(update_version))
        .route("/:document_id/:version_id", delete(delete_version))
        .route(
            "/:document_id/:version_id/content",
            get(get_version_content),
        )
}
