use axum::Json;
use serde::Deserialize;

use crate::services::{auth::error::AuthError, database::repositories::users::UsersRepository};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterRequest {
    username: String,
    password: String,
}

pub async fn register(
    users_repository: UsersRepository,
    Json(data): Json<RegisterRequest>,
) -> Result<(), AuthError> {
    let Ok(_) = users_repository.create_user(data.username, data.password).await else {
        return Err(AuthError::InvalidCredentials);
    };

    Ok(())
}
