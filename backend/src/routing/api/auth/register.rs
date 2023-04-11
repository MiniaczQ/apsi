use axum::Json;
use serde::Deserialize;

use crate::database::repositories::users::UsersRepository;

use super::error::AuthError;

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
