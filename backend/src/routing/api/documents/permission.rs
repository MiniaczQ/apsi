use axum::{
    extract::{FromRef, Path},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use s3::Bucket;
use tracing::error;
use uuid::Uuid;

use crate::{
    models::{role::DocumentVersionRole, user::PublicUserWithRoles},
    services::{
        auth::{auth_keys::AuthKeys, claims::Claims},
        database::{repositories::permission::PermissionRepository, DbPool},
    },
};

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

async fn get_member(
    permission_repository: PermissionRepository,
    claims: Claims,
    Path((document_id, version_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<PublicUserWithRoles>, StatusCode> {
    match permission_repository
        .get_document_version_user(claims.user_id, document_id, version_id)
        .await
    {
        Ok(user) => Ok(Json(user)),
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

pub fn permission_router<T>() -> Router<T>
where
    AuthKeys: FromRef<T>,
    DbPool: FromRef<T>,
    Bucket: FromRef<T>,
    T: 'static + Send + Sync + Clone,
{
    Router::new()
        .route("/:document_id/:version_id/members", get(get_members))
        .route("/:document_id/:version_id/member", get(get_member))
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
