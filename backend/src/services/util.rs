use axum::{http::StatusCode, response::IntoResponse, Json};
use serde::Serialize;

pub enum Res3<T> {
    Json(Json<T>),
    Msg((StatusCode, &'static str)),
    NoMsg(StatusCode),
}

impl<T> IntoResponse for Res3<T>
where
    T: Serialize,
{
    fn into_response(self) -> axum::response::Response {
        match self {
            Res3::Json(r) => r.into_response(),
            Res3::Msg(r) => r.into_response(),
            Res3::NoMsg(r) => r.into_response(),
        }
    }
}

pub enum Res2 {
    Msg((StatusCode, &'static str)),
    NoMsg(StatusCode),
}

impl IntoResponse for Res2 {
    fn into_response(self) -> axum::response::Response {
        match self {
            Res2::Msg(r) => r.into_response(),
            Res2::NoMsg(r) => r.into_response(),
        }
    }
}
