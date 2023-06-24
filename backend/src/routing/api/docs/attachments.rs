use axum::{
    extract::{FromRef, Multipart, Path},
    http::StatusCode,
    routing::{delete, get, patch},
    Json, Router,
};
use mime::Mime;
use s3::Bucket;
use tracing::{error, info};
use uuid::Uuid;

use crate::{
    models::attachment::File,
    services::{
        auth::{auth_keys::AuthKeys, claims::Claims},
        database::{
            repositories::{documents::DocumentsRepository, files::FilesRepository, RepoError},
            DbPool,
        },
    },
};

async fn patch_file_attachment(
    documents_repository: DocumentsRepository,
    mut files_repository: FilesRepository,
    _: Claims,
    Path((document_id, version_id)): Path<(Uuid, Uuid)>,
    mut multipart: Multipart,
) -> Result<Json<File>, StatusCode> {
    let field = multipart.next_field().await.map_err(|e| {
        error!("{}", e);
        StatusCode::BAD_REQUEST
    })?;
    let Some(field) = field else {
        error!("Field not found");
        return Err(StatusCode::BAD_REQUEST);
    };
    let Some(content_type) = field.content_type() else {
        error!("Content type not found");
        return Err(StatusCode::BAD_REQUEST);
    };
    let mime_type = content_type.parse::<Mime>().map_err(|e| {
        error!("{}", e);
        StatusCode::BAD_REQUEST
    })?;
    let Some(file_name) = field.file_name() else {
        error!("Field name not found");
        return Err(StatusCode::BAD_REQUEST);
    };
    let file_name = file_name.to_owned();
    let content = field.bytes().await.map_err(|e| {
        error!("{}", e);
        StatusCode::BAD_REQUEST
    })?;
    let second_field = multipart.next_field().await.map_err(|e| {
        error!("{}", e);
        StatusCode::BAD_REQUEST
    })?;
    if second_field.is_some() {
        error!("Only one field allowed");
        return Err(StatusCode::BAD_REQUEST);
    };

    let file = files_repository
        .try_upload_file(file_name, mime_type.to_string(), &content)
        .await
        .map_err(|e| {
            error!("{}", e);
            StatusCode::BAD_REQUEST
        })?;
    let file_attached = documents_repository
        .attach_file(document_id, version_id, file.file_id)
        .await
        .map_err(|e| {
            error!("{}", e);
            StatusCode::BAD_REQUEST
        })?;
    match file_attached {
        true => Ok(Json(file)),
        false => Err(StatusCode::BAD_REQUEST),
    }
}

async fn get_file_attachments(
    documents_repository: DocumentsRepository,
    claims: Claims,
    Path((document_id, version_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<Vec<File>>, StatusCode> {
    match documents_repository
        .get_file_attachments(claims.user_id, document_id, version_id)
        .await
    {
        Ok(file_attachments) => Ok(Json(file_attachments)),
        Err(error) => {
            error!("{}", error);
            Err(StatusCode::BAD_REQUEST)
        }
    }
}

async fn get_file_attachment(
    documents_repository: DocumentsRepository,
    claims: Claims,
    Path((document_id, version_id, file_id)): Path<(Uuid, Uuid, Uuid)>,
) -> Result<Json<File>, StatusCode> {
    match documents_repository
        .get_file_attachment(claims.user_id, document_id, version_id, file_id)
        .await
    {
        Ok(file_attachment) => Ok(Json(file_attachment)),
        Err(RepoError::Forbidden) => Err(StatusCode::FORBIDDEN),
        Err(error) => {
            error!("{}", error);
            Err(StatusCode::BAD_REQUEST)
        }
    }
}

async fn get_file_attachment_content(
    files_repository: FilesRepository,
    _: Claims,
    Path((_document_id, _version_id, file_id)): Path<(Uuid, Uuid, Uuid)>,
) -> Result<Vec<u8>, StatusCode> {
    info!("{}", file_id);
    let content = files_repository.get_file(file_id).await.map_err(|e| {
        error!("{}", e);
        StatusCode::BAD_REQUEST
    })?;
    Ok(content)
}

async fn delete_file_attachment(
    documents_repository: DocumentsRepository,
    mut files_repository: FilesRepository,
    _: Claims,
    Path((document_id, version_id, file_id)): Path<(Uuid, Uuid, Uuid)>,
) -> Result<StatusCode, StatusCode> {
    match documents_repository
        .detach_file(document_id, version_id, file_id)
        .await
    {
        Ok(true) => {
            files_repository
                .try_delete_file(file_id)
                .await
                .map_err(|e| {
                    error!("{}", e);
                    StatusCode::BAD_REQUEST
                })?;
            Ok(StatusCode::OK)
        }
        Ok(false) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            error!("{}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub fn attachments_router<T>() -> Router<T>
where
    AuthKeys: FromRef<T>,
    DbPool: FromRef<T>,
    Bucket: FromRef<T>,
    T: 'static + Send + Sync + Clone,
{
    Router::new()
        .route("/:document_id/:version_id/files", get(get_file_attachments))
        .route(
            "/:document_id/:version_id/files",
            patch(patch_file_attachment),
        )
        .route(
            "/:document_id/:version_id/files/:file_id",
            get(get_file_attachment),
        )
        .route(
            "/:document_id/:version_id/files/:file_id/content",
            get(get_file_attachment_content),
        )
        .route(
            "/:document_id/:version_id/files/:file_id",
            delete(delete_file_attachment),
        )
}
