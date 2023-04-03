use axum::{
    async_trait,
    extract::{FromRef, FromRequestParts, TypedHeader},
    headers::{authorization::Bearer, Authorization},
    http::request::Parts,
    RequestPartsExt,
};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::{authorization_keys::AuthorizationKeys, error::AuthError};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Claims {
    pub exp: usize,
    pub nbf: usize,
    pub iat: usize,
    pub user_id: Uuid,
}

impl Claims {
    pub fn try_into_token(self, key: &EncodingKey) -> Result<String, AuthError> {
        encode(&Header::new(Algorithm::RS256), &self, key).map_err(|_| AuthError::TokenCreation)
    }

    pub fn try_from_token(token: &str, key: &DecodingKey) -> Result<Self, AuthError> {
        let mut validation = Validation::new(Algorithm::RS256);
        validation.validate_nbf = true;
        let token_data =
            decode::<Claims>(token, key, &validation).map_err(|_| AuthError::InvalidToken)?;
        Ok(token_data.claims)
    }
}

#[async_trait]
impl<S> FromRequestParts<S> for Claims
where
    AuthorizationKeys: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = AuthError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let TypedHeader(Authorization(bearer)) = parts
            .extract::<TypedHeader<Authorization<Bearer>>>()
            .await
            .map_err(|_| AuthError::InvalidToken)?;

        let keys = AuthorizationKeys::from_ref(state);

        Claims::try_from_token(bearer.token(), &keys.decoding)
    }
}
