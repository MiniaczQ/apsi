use std::error::Error;

use axum::{
    async_trait,
    extract::{FromRef, FromRequestParts},
    http::{request::Parts, StatusCode},
};
use tracing::error;
use uuid::Uuid;

use crate::{
    models::{event::{EventType, to_sql, Event}},
    services::database::{DbConn, DbPool},
};

pub struct EventsRepository {
    database: DbConn,
}

impl EventsRepository {
    pub async fn create_event(
        &self,
        document_id: Uuid,
        version_id: Uuid,
        user_id: Uuid,
        event_type: EventType,
    ) -> Result<(), Box<dyn Error>> {
        let event_id = Uuid::new_v4();
        let (event_type, user_role_id, state_id) = to_sql(&event_type);
        self.database.execute(
            "
                INSERT INTO events (event_id, user_id, document_id, version_id, event_type, user_role_id, state_id, FALSE)
                VALUES ($1, $2, $3, $4, $5, $6)
                ",
            &[&event_id, &user_id, &document_id, &version_id, &event_type, &user_role_id, &state_id],
        ).await?;
        Ok(())
    }

    pub async fn get_events_for_user(&self, user_id: Uuid) -> Result<Vec<Event>, Box<dyn Error>> {
        let events = self.database.query("SELECT * FROM events WHERE user_id = $1 ORDER BY seen DESC, created_at DESC", &[&user_id]).await?;
        let events = events
        .into_iter()
        .map(Event::try_from)
        .collect::<Result<_, _>>()?;
        Ok(events)
    }

    pub async fn mark_read(&self, event_id: Uuid) -> Result<(), Box<dyn Error>> {
        self.database.execute("UPDATE users_events SET seen = TRUE WHERE event_id = $1", &[&event_id]).await?;
        Ok(())
    }
}

#[async_trait]
impl<S> FromRequestParts<S> for EventsRepository
where
    DbPool: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = StatusCode;

    async fn from_request_parts(_: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let database = DbPool::from_ref(state).get_owned().await.map_err(|e| {
            error!("{}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
        Ok(Self { database })
    }
}
