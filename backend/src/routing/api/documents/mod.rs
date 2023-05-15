use axum::{
    extract::{FromRef, Multipart, Path},
    http::StatusCode,
    routing::{delete, get, patch, post},
    Json, Router,
};
use mime::Mime;
use s3::Bucket;
use serde::Deserialize;
use tracing::{error, info};
use uuid::Uuid;

use crate::services::{
    auth::{auth_keys::AuthKeys, claims::Claims},
    database::{
        repositories::{
            documents::{
                Document, DocumentVersion, DocumentWithInitialVersion, DocumentsRepository,
            },
            files::{File, FilesRepository},
            permission::{DocumentVersionRole, PermissionRepository, PublicUserWithRoles},
        },
        DbPool,
    },
};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateDocumentRequest {
    document_name: String,
    initial_version: CreateInitialOrUpdateVersionRequest,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdateDocumentRequest {
    document_name: String,
}

async fn create_document(
    mut documents_repository: DocumentsRepository,
    claims: Claims,
    Json(data): Json<CreateDocumentRequest>,
) -> Result<Json<DocumentWithInitialVersion>, StatusCode> {
    let document = documents_repository
        .create_document(
            data.document_name,
            claims.user_id,
            data.initial_version.version_name,
            data.initial_version.content,
        )
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
    Json(update): Json<UpdateDocumentRequest>,
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
struct CreateInitialOrUpdateVersionRequest {
    version_name: String,
    content: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateVersionWithParentsRequest {
    version_name: String,
    content: String,
    parents: Vec<Uuid>,
}

async fn create_version(
    mut documents_repository: DocumentsRepository,
    claims: Claims,
    Path(document_id): Path<Uuid>,
    Json(data): Json<CreateVersionWithParentsRequest>,
) -> Result<Json<DocumentVersion>, StatusCode> {
    let version = documents_repository
        .create_version(
            claims.user_id,
            document_id,
            data.version_name,
            data.content,
            data.parents,
        )
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
    _: Claims,
    Path((document_id, version_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<Vec<File>>, StatusCode> {
    let file_attachments = documents_repository
        .get_file_attachments(document_id, version_id)
        .await
        .map_err(|e| {
            error!("{}", e);
            StatusCode::BAD_REQUEST
        })?;
    Ok(Json(file_attachments))
}

async fn get_file_attachment(
    documents_repository: DocumentsRepository,
    _: Claims,
    Path((document_id, version_id, file_id)): Path<(Uuid, Uuid, Uuid)>,
) -> Result<Json<File>, StatusCode> {
    let file_attachment = documents_repository
        .get_file_attachment(document_id, version_id, file_id)
        .await
        .map_err(|e| {
            error!("{}", e);
            StatusCode::BAD_REQUEST
        })?;
    Ok(Json(file_attachment))
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

async fn get_members(
    permission_repository: PermissionRepository,
    _: Claims,
    Path((document_id, version_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<Vec<PublicUserWithRoles>>, StatusCode> {
    match permission_repository
        .get_document_version_users(document_id, version_id)
        .await
    {
        Ok(users) => Ok(Json(users)),
        Err(error) => {
            error!("{}", error);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn am_owner(
    permission_repository: PermissionRepository,
    claims: Claims,
    Path((document_id, version_id)): Path<(Uuid, Uuid)>,
) -> StatusCode {
    match permission_repository
        .is_owner(claims.user_id, document_id, version_id)
        .await
    {
        Ok(true) => StatusCode::OK,
        Ok(false) => StatusCode::UNAUTHORIZED,
        Err(error) => {
            error!("{}", error);
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

async fn grant_version_role(
    permission_repository: PermissionRepository,
    _: Claims,
    Path((document_id, version_id, user_id, role)): Path<(Uuid, Uuid, Uuid, DocumentVersionRole)>,
) -> StatusCode {
    match permission_repository
        .grant_document_version_role(user_id, document_id, version_id, role)
        .await
    {
        Ok(true) => StatusCode::OK,
        Ok(false) => StatusCode::BAD_REQUEST,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

async fn revoke_version_role(
    permission_repository: PermissionRepository,
    _: Claims,
    Path((document_id, version_id, user_id, role)): Path<(Uuid, Uuid, Uuid, DocumentVersionRole)>,
) -> StatusCode {
    match permission_repository
        .revoke_document_version_role(user_id, document_id, version_id, role)
        .await
    {
        Ok(true) => StatusCode::OK,
        Ok(false) => StatusCode::BAD_REQUEST,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

pub fn documents_router<T>() -> Router<T>
where
    AuthKeys: FromRef<T>,
    DbPool: FromRef<T>,
    Bucket: FromRef<T>,
    T: 'static + Send + Sync + Clone,
{
    Router::new()
        // Documents
        .route("/", post(create_document))
        .route("/documents", get(get_documents))
        .route("/:document_id", get(get_document))
        .route("/:document_id", patch(update_document))
        .route("/:document_id", delete(delete_document))
        // Versions
        .route("/:document_id", post(create_version))
        .route("/:document_id/versions", get(get_versions))
        .route("/:document_id/:version_id", get(get_version))
        .route("/:document_id/:version_id", patch(update_version))
        .route("/:document_id/:version_id", delete(delete_version))
        // Attachhments
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
        // Permission
        .route("/:document_id/:version_id/members", get(get_members))
        .route("/:document_id/:version_id/am-owner", get(am_owner))
        .route(
            "/:document_id/:version_id/grant/:user_id/:role",
            post(grant_version_role),
        )
        .route(
            "/:document_id/:version_id/revoke/:user_id/:role",
            post(revoke_version_role),
        )
}
