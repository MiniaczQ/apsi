use axum::Json;

use super::claims::Claims;

pub async fn who_am_i(claims: Claims) -> Json<Claims> {
    Json(claims)
}
