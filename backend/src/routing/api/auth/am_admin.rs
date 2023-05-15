use axum::http::StatusCode;

use crate::services::{
    auth::claims::Claims, database::repositories::permission::PermissionRepository,
};

pub async fn am_admin(claims: Claims, permission_repository: PermissionRepository) -> StatusCode {
    match permission_repository.is_admin(claims.user_id).await {
        Ok(true) => StatusCode::OK,
        Ok(false) => StatusCode::UNAUTHORIZED,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}
