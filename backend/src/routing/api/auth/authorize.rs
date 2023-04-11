use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

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
    user_id: Uuid,
}

pub async fn authorize(
    State(keys): State<AuthorizationKeys>,
    Json(data): Json<AuthorizeRequest>,
) -> Result<Json<AuthorizeResponse>, AuthError> {
    let claims = Claims {
        exp: 0,
        nbf: 0,
        iat: 0,
        user_id: data.user_id,
    };

    let token = claims.try_into_token(&keys.encoding)?;

    Ok(Json(AuthorizeResponse::new(token)))
}
