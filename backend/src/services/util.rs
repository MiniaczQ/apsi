use axum::{
    async_trait,
    body::HttpBody,
    extract::{rejection::JsonRejection, FromRequest},
    http::{Request, StatusCode},
    response::IntoResponse,
    BoxError, Json,
};
use serde::{de::DeserializeOwned, Serialize};
use validator::{Validate, ValidationErrors};

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

pub enum ValidatedJsonRecjection {
    Json(JsonRejection),
    Validation(ValidationErrors),
}

impl IntoResponse for ValidatedJsonRecjection {
    fn into_response(self) -> axum::response::Response {
        match self {
            ValidatedJsonRecjection::Json(rejection) => rejection.into_response(),
            ValidatedJsonRecjection::Validation(errors) => {
                let errors = serde_json::ser::to_string(&errors).unwrap();
                (StatusCode::BAD_REQUEST, errors).into_response()
            }
        }
    }
}

impl From<JsonRejection> for ValidatedJsonRecjection {
    fn from(value: JsonRejection) -> Self {
        Self::Json(value)
    }
}

impl From<ValidationErrors> for ValidatedJsonRecjection {
    fn from(value: ValidationErrors) -> Self {
        Self::Validation(value)
    }
}

pub struct ValidatedJson<T>(pub T);

#[async_trait]
impl<T, S, B> FromRequest<S, B> for ValidatedJson<T>
where
    T: DeserializeOwned + Validate,
    B: HttpBody + Send + 'static,
    B::Data: Send,
    B::Error: Into<BoxError>,
    S: Send + Sync,
{
    type Rejection = ValidatedJsonRecjection;

    #[must_use]
    async fn from_request(req: Request<B>, state: &S) -> Result<Self, Self::Rejection> {
        let Json(json) = Json::<T>::from_request(req, state).await?;
        json.validate()?;
        Ok(Self(json))
    }
}
