use std::time::{SystemTime, UNIX_EPOCH};

use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};
use tracing::{error, info};

use crate::database::repositories::users::UsersRepository;

use super::{authorization_keys::AuthorizationKeys, claims::Claims, error::AuthError};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthorizeResponse {
    token: String,
}

impl AuthorizeResponse {
    fn new(token: String) -> Self {
        Self { token }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthorizeRequest {
    username: String,
    password: String,
}

pub async fn login(
    State(keys): State<AuthorizationKeys>,
    users_repository: UsersRepository,
    Json(data): Json<AuthorizeRequest>,
) -> Result<Json<AuthorizeResponse>, AuthError> {
    match users_repository
        .verify(&data.username, &data.password)
        .await
    {
        Err(e) => {
            error!("{}", e);
            Err(AuthError::InvalidCredentials)
        }
        Ok(None) => {
            info!("Invalid password");
            Err(AuthError::InvalidCredentials)
        }
        Ok(Some(user)) => {
            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("Time went backwards")
                .as_secs();
            let claims = Claims {
                exp: now + 60 * 60 * 24,
                nbf: now,
                iat: now,
                user_id: user.user_id,
                username: user.username,
            };
            let token = claims.try_into_token(&keys.encoding)?;
            Ok(Json(AuthorizeResponse::new(token)))
        }
    }
}
