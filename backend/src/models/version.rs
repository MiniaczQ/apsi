use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tokio_postgres::Row;
use uuid::Uuid;
use validator::Validate;

use super::{version_state::DocumentVersionState, VERSION_NAME_REGEX};

#[derive(Debug, Validate, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateInitialVersion {
    #[validate(regex = "VERSION_NAME_REGEX")]
    pub version_name: String,
    #[validate(length(max = 2046))]
    pub content: String,
}

#[derive(Debug, Validate, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateVersion {
    #[validate(length(max = 2046))]
    pub content: String,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Validate, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateVersionWithParents {
    #[validate(regex = "VERSION_NAME_REGEX")]
    pub version_name: String,
    #[validate(length(max = 2046))]
    pub content: String,
    #[validate(length(min = 1))]
    pub parents: Vec<Uuid>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentVersion {
    pub document_id: Uuid,
    pub version_id: Uuid,
    pub version_name: String,
    pub created_at: DateTime<Utc>,
    pub content: String,
    pub version_state: DocumentVersionState,
    pub children: Vec<Uuid>,
    pub parents: Vec<Uuid>,
    pub updated_at: DateTime<Utc>,
}

impl TryFrom<Row> for DocumentVersion {
    type Error = tokio_postgres::Error;

    fn try_from(value: Row) -> Result<Self, Self::Error> {
        let document_id: Uuid = value.try_get(0)?;
        let version_id: Uuid = value.try_get(1)?;
        let version_name: String = value.try_get(2)?;
        let created_at: DateTime<Utc> = value.try_get(3)?;
        let content: String = value.try_get(4)?;
        let version_state: i16 = value.try_get(5)?;
        let version_state = DocumentVersionState::try_from(version_state).unwrap();
        let updated_at: DateTime<Utc> = value.try_get(6)?;
        let children: Vec<Uuid> = value.try_get(7)?;
        let parents: Vec<Uuid> = value.try_get(8)?;

        Ok(Self {
            document_id,
            version_id,
            version_name,
            created_at,
            content,
            version_state,
            updated_at,
            children,
            parents,
        })
    }
}
