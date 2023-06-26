use chrono::{DateTime, Utc};
use serde::{Serialize};
use tokio_postgres::Row;
use uuid::Uuid;
use crate::models::{role::DocumentVersionRole, version_state::DocumentVersionState};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Event {
    pub event_id: Uuid,
    pub user_id: Uuid,
    pub document_id: Uuid,
    pub version_id: Uuid,
    pub event_type: EventType,
    pub seen: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum EventType {
    RoleAdded(DocumentVersionRole),
    RoleRemoved(DocumentVersionRole),
    StatusChange(DocumentVersionState),
}

impl TryFrom<Row> for Event {
    type Error = tokio_postgres::Error;

    fn try_from(value: Row) -> Result<Self, Self::Error> {
        let event_id = value.try_get(0)?;
        let user_id = value.try_get(1)?;
        let document_id = value.try_get(2)?;
        let version_id = value.try_get(3)?;
        let event_type_id = value.try_get(4)?;
        let role_id: i16 = value.try_get(5)?;
        let state_id: i16 = value.try_get(6)?;
        let role_id = DocumentVersionRole::try_from(role_id).unwrap();
        let state_id = DocumentVersionState::try_from(state_id).unwrap();
        let event_type = from_sql(event_type_id, role_id, state_id);
        let seen = value.try_get(7)?;
        let created_at = value.try_get(8)?;
        Ok(Self {
            event_id,
            user_id,
            document_id,
            version_id,
            event_type,
            seen,
            created_at,
        })
    }
}

pub fn from_sql(event_type: i16, role: DocumentVersionRole, state: DocumentVersionState) -> EventType {
    match event_type {
        0 => EventType::RoleAdded(role),
        1 => EventType::RoleRemoved(role),
        2 => EventType::StatusChange(state),
        _ => unreachable!(),
    }
}

pub fn to_sql(event_type: &EventType) -> (i16, Option<i16>, Option<i16>) {
    match event_type {
        EventType::RoleAdded(role) => (0, Some(i16::from(*role)), None),
        EventType::RoleRemoved(role) => (1, Some(i16::from(*role)), None),
        EventType::StatusChange(state) => (2, None, Some(i16::from(*state))),
    }
}
