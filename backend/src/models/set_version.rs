use super::VERSION_NAME_REGEX;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tokio_postgres::Row;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Validate, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateInitialSetVersion {
    #[validate(regex = "VERSION_NAME_REGEX")]
    pub set_version_name: String,
    pub document_version_ids: Vec<(Uuid, Uuid)>,
}

#[derive(Debug, Validate, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSetVersionWithParents {
    #[validate(regex = "VERSION_NAME_REGEX")]
    pub set_version_name: String,
    pub document_version_ids: Vec<(Uuid, Uuid)>,
    #[validate(length(min = 1))]
    pub parents: Vec<Uuid>,
}

#[derive(Debug, Validate, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSetVersion {
    pub document_id: Uuid,
    pub version_id: Uuid,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SetVersion {
    pub document_set_id: Uuid,
    pub set_version_id: Uuid,
    pub set_version_name: String,
    pub created_at: DateTime<Utc>,
    pub document_version_ids: Vec<(Uuid, Uuid)>,
    pub children: Vec<Uuid>,
    pub parents: Vec<Uuid>,
}

impl TryFrom<Row> for SetVersion {
    type Error = tokio_postgres::Error;

    fn try_from(value: Row) -> Result<Self, Self::Error> {
        let document_set_id = value.try_get(0)?;
        let set_version_id = value.try_get(1)?;
        let set_version_name = value.try_get(2)?;
        let created_at = value.try_get(3)?;
        let document_ids: Vec<Uuid> = value.try_get(4)?;
        let version_ids: Vec<Uuid> = value.try_get(5)?;
        let document_version_ids = document_ids
            .into_iter()
            .zip(version_ids.into_iter())
            .collect();
        let children = value.try_get(6)?;
        let parents = value.try_get(7)?;

        Ok(Self {
            document_set_id,
            set_version_id,
            set_version_name,
            created_at,
            document_version_ids,
            children,
            parents,
        })
    }
}
