use axum::{http::StatusCode, response::IntoResponse, Json};
use serde::Serialize;

pub enum JsonOrError<T> {
    Json(Json<T>),
    ErrMsg((StatusCode, &'static str)),
    Err(StatusCode),
}

impl<T> IntoResponse for JsonOrError<T>
where
    T: Serialize,
{
    fn into_response(self) -> axum::response::Response {
        match self {
            JsonOrError::Json(r) => r.into_response(),
            JsonOrError::ErrMsg(r) => r.into_response(),
            JsonOrError::Err(r) => r.into_response(),
        }
    }
}
