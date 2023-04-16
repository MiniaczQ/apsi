use axum::Json;

use crate::services::auth::claims::Claims;

pub async fn who_am_i(claims: Claims) -> Json<Claims> {
    Json(claims)
}
