use axum::{http::StatusCode, Json};

use crate::{
    models::user::PublicUser,
    services::{auth::claims::Claims, database::repositories::permission::PermissionRepository},
};

use tracing::error;

pub async fn users(
    _: Claims,
    permission_repository: PermissionRepository,
) -> Result<Json<Vec<PublicUser>>, StatusCode> {
    match permission_repository.get_all_users().await {
        Ok(users) => Ok(Json(users)),
        Err(error) => {
            error!({ error = error }, "Failed to fetch users");
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
