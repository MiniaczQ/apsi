use serde::Serialize;
use tokio_postgres::Row;
use uuid::Uuid;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct File {
    pub file_id: Uuid,
    pub file_name: String,
    pub file_mime_type: String,
    pub file_hash: String,
}

impl TryFrom<Row> for File {
    type Error = tokio_postgres::Error;

    fn try_from(value: Row) -> Result<Self, Self::Error> {
        let file_id: Uuid = value.try_get(0)?;
        let file_name: String = value.try_get(1)?;
        let file_mime_type: String = value.try_get(2)?;
        let file_hash: String = value.try_get(3)?;

        Ok(Self {
            file_id,
            file_name,
            file_mime_type,
            file_hash,
        })
    }
}
