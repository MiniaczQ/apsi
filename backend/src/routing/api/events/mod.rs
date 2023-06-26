use axum::{
    extract::{FromRef, Path},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use tracing::error;
use uuid::Uuid;

use crate::{
    models::event::Event,
    services::{
        auth::{auth_keys::AuthKeys, claims::Claims},
        database::{repositories::events::EventsRepository, DbPool},
    },
};

async fn get_events_for_user(
    event_repository: EventsRepository,
    claims: Claims,
) -> Result<Json<Vec<Event>>, StatusCode> {
    let events = event_repository
        .get_events_for_user(claims.user_id)
        .await
        .map_err(|e| {
            error!("{}", e);
            StatusCode::BAD_REQUEST
        })?;
    Ok(Json(events))
}

async fn mark_read(
    event_repository: EventsRepository,
    Path(event_id): Path<Uuid>,
    _: Claims,
) -> Result<(), StatusCode> {
    event_repository.mark_read(event_id).await.map_err(|e| {
        error!("{}", e);
        StatusCode::BAD_REQUEST
    })?;
    Ok(())
}

pub fn events_router<T>() -> Router<T>
where
    AuthKeys: FromRef<T>,
    DbPool: FromRef<T>,
    T: 'static + Send + Sync + Clone,
{
    Router::new()
        .route("/", get(get_events_for_user))
        .route("/:event_id", post(mark_read))
}
