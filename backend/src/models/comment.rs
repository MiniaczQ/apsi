use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tokio_postgres::Row;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateDocumentVersionComment {
    pub content: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentVersionComment {
    pub comment_id: Uuid,
    pub user_id: Uuid,
    pub username: String,
    pub created_at: DateTime<Utc>,
    pub content: String,
}

impl TryFrom<Row> for DocumentVersionComment {
    type Error = tokio_postgres::Error;

    fn try_from(value: Row) -> Result<Self, Self::Error> {
        let comment_id = value.try_get(0)?;
        let user_id = value.try_get(1)?;
        let username = value.try_get(2)?;
        let created_at = value.try_get(3)?;
        let content = value.try_get(4)?;
        Ok(Self {
            comment_id,
            user_id,
            username,
            created_at,
            content,
        })
    }
}
