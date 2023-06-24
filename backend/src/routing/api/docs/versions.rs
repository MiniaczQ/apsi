use axum::{
    extract::{FromRef, Path},
    http::StatusCode,
    routing::{get, patch, post},
    Json, Router,
};
use s3::Bucket;
use tracing::error;
use uuid::Uuid;

use crate::{
    models::{
        comment::{CreateDocumentVersionComment, DocumentVersionComment},
        role::DocumentVersionRole,
        version::{CreateVersionWithParents, DocumentVersion, UpdateVersion},
    },
    services::{
        auth::{auth_keys::AuthKeys, claims::Claims},
        database::{
            repositories::{
                comments::CommentsRepository, documents::DocumentsRepository,
                permission::PermissionRepository, RepoError,
            },
            DbPool,
        },
        util::{Res2, ValidatedJson},
    },
};

async fn create_version(
    documents_repository: DocumentsRepository,
    claims: Claims,
    Path(document_id): Path<Uuid>,
    ValidatedJson(data): ValidatedJson<CreateVersionWithParents>,
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
    claims: Claims,
    Path((document_id, version_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<DocumentVersion>, StatusCode> {
    match documents_repository
        .get_version(claims.user_id, document_id, version_id)
        .await
    {
        Ok(versions) => Ok(Json(versions)),
        Err(RepoError::Forbidden) => Err(StatusCode::FORBIDDEN),
        Err(error) => {
            error!("{}", error);
            Err(StatusCode::BAD_REQUEST)
        }
    }
}

async fn get_versions(
    documents_repository: DocumentsRepository,
    claims: Claims,
    Path(document_id): Path<Uuid>,
) -> Result<Json<Vec<DocumentVersion>>, StatusCode> {
    let versions = documents_repository
        .get_versions(claims.user_id, document_id)
        .await
        .map_err(|e| {
            error!("{}", e);
            StatusCode::BAD_REQUEST
        })?;
    Ok(Json(versions))
}

async fn update_version(
    documents_repository: DocumentsRepository,
    permission_repository: PermissionRepository,
    claims: Claims,
    Path((document_id, version_id)): Path<(Uuid, Uuid)>,
    Json(data): Json<UpdateVersion>,
) -> Res2 {
    match permission_repository
        .does_user_have_document_version_roles(
            claims.user_id,
            document_id,
            version_id,
            &[DocumentVersionRole::Owner, DocumentVersionRole::Editor],
        )
        .await
    {
        Ok(true) => {}
        Ok(false) => {
            return Res2::Msg((
                StatusCode::FORBIDDEN,
                "User does not have permission to perform update",
            ));
        }
        Err(error) => {
            error!(
                { error = error },
                "Error during version update permission check"
            );
            return Res2::NoMsg(StatusCode::INTERNAL_SERVER_ERROR);
        }
    }
    match documents_repository
        .update_version(document_id, version_id, data.content)
        .await
    {
        Ok(true) => Res2::NoMsg(StatusCode::OK),
        Ok(false) => Res2::NoMsg(StatusCode::BAD_REQUEST),
        Err(error) => {
            error!({ error = error }, "Error during version update");
            Res2::NoMsg(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn get_comments(
    comments_repository: CommentsRepository,
    claims: Claims,
    Path((document_id, version_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<Vec<DocumentVersionComment>>, StatusCode> {
    let comments = comments_repository
        .get_comments(claims.user_id, document_id, version_id)
        .await
        .map_err(|e| {
            error!("{}", e);
            StatusCode::BAD_REQUEST
        })?;
    Ok(Json(comments))
}

async fn create_comment(
    comments_repository: CommentsRepository,
    claims: Claims,
    Path((document_id, version_id)): Path<(Uuid, Uuid)>,
    Json(data): Json<CreateDocumentVersionComment>,
) -> Result<Json<DocumentVersionComment>, StatusCode> {
    let comment = comments_repository
        .create_comment(claims.user_id, document_id, version_id, data.content)
        .await
        .map_err(|e| {
            error!("{}", e);
            StatusCode::BAD_REQUEST
        })?;
    Ok(Json(comment))
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
        .route("/:document_id/:version_id/comments", get(get_comments))
        .route("/:document_id/:version_id/comment", post(create_comment))
}
