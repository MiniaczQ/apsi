use serde::{Deserialize, Serialize};
use tokio_postgres::Row;
use uuid::Uuid;
use validator::Validate;

use super::version::{CreateInitialOrUpdateVersionRequest, DocumentVersion};

#[derive(Debug, Validate, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateDocumentRequest {
    pub document_name: String,
    pub initial_version: CreateInitialOrUpdateVersionRequest,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDocumentRequest {
    pub document_name: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Document {
    pub document_id: Uuid,
    pub document_name: String,
}

impl TryFrom<Row> for Document {
    type Error = tokio_postgres::Error;

    fn try_from(value: Row) -> Result<Self, Self::Error> {
        let document_id: Uuid = value.try_get(0)?;
        let document_name: String = value.try_get(1)?;
        Ok(Self {
            document_id,
            document_name,
        })
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentWithInitialVersion {
    pub document: Document,
    pub initial_version: DocumentVersion,
}
