use serde::{Deserialize, Serialize};
use tokio_postgres::Row;
use uuid::Uuid;
use validator::Validate;

use super::set_version::{CreateInitialSetVersion, SetVersion};

#[derive(Debug, Validate, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateDocumentSet {
    pub document_set_name: String,
    #[validate]
    pub initial_version: CreateInitialSetVersion,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentSet {
    pub document_set_id: Uuid,
    pub document_set_name: String,
}

impl TryFrom<Row> for DocumentSet {
    type Error = tokio_postgres::Error;

    fn try_from(value: Row) -> Result<Self, Self::Error> {
        let document_set_id = value.try_get(0)?;
        let document_set_name = value.try_get(1)?;

        Ok(Self {
            document_set_id,
            document_set_name,
        })
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentSetWithInitialVersion {
    pub document_set: DocumentSet,
    pub initial_version: SetVersion,
}
