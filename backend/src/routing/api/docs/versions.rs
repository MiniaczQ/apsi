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
                comments::CommentsRepository,
                documents::{ConcurrencyError, DocumentsRepository, UniqueError},
                permission::PermissionRepository,
                RepoError,
            },
            DbPool,
        },
        util::{Res3, ValidatedJson},
    },
};

async fn create_version(
    mut documents_repository: DocumentsRepository,
    claims: Claims,
    Path(document_id): Path<Uuid>,
    ValidatedJson(data): ValidatedJson<CreateVersionWithParents>,
) -> Result<Json<DocumentVersion>, StatusCode> {
    let result = documents_repository
        .create_version(
            claims.user_id,
            document_id,
            data.version_name,
            data.content,
            data.parents,
        )
        .await;
    match result {
        Ok(version) => Ok(Json(version)),
        Err(UniqueError::UniqueValueViolation) => Err(StatusCode::CONFLICT),
        Err(error) => {
            error!("{}", error);
            Err(StatusCode::BAD_REQUEST)
        }
    }
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
    ValidatedJson(data): ValidatedJson<UpdateVersion>,
) -> Res3<DocumentVersion> {
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
            return Res3::Msg((
                StatusCode::FORBIDDEN,
                "User does not have permission to perform update",
            ));
        }
        Err(error) => {
            error!(
                { error = error },
                "Error during version update permission check"
            );
            return Res3::NoMsg(StatusCode::INTERNAL_SERVER_ERROR);
        }
    }
    match documents_repository
        .update_version(document_id, version_id, data.content, data.updated_at)
        .await
    {
        Ok(version) => Res3::Json((version, StatusCode::OK)),
        Err(ConcurrencyError::UniqueValueViolation(version)) => {
            Res3::Json((version, StatusCode::CONFLICT))
        }
        Err(ConcurrencyError::Failed) => {
            Res3::Msg((StatusCode::BAD_REQUEST, "Version could not be updated"))
        }
        Err(ConcurrencyError::Pg(error)) => {
            error!({ error = error.to_string() }, "Error during version update");
            Res3::NoMsg(StatusCode::INTERNAL_SERVER_ERROR)
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
