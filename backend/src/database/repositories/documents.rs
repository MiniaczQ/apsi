use std::error::Error;

use axum::{
    async_trait,
    extract::{FromRef, FromRequestParts},
    http::{request::Parts, StatusCode},
};
use chrono::{DateTime, Utc};
use serde::Serialize;
use tokio_postgres::Row;
use tracing::error;
use uuid::Uuid;

use crate::database::{DbConn, DbPool};

pub struct DocumentsRepository {
    conn: DbConn,
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
pub struct DocumentVersion {
    pub document_id: Uuid,
    pub version_id: Uuid,
    pub version_name: String,
    pub created_at: DateTime<Utc>,
}

impl TryFrom<Row> for DocumentVersion {
    type Error = tokio_postgres::Error;

    fn try_from(value: Row) -> Result<Self, Self::Error> {
        let document_id: Uuid = value.try_get(0)?;
        let version_id: Uuid = value.try_get(1)?;
        let version_name: String = value.try_get(2)?;
        let created_at: DateTime<Utc> = value.try_get(3)?;

        Ok(Self {
            document_id,
            version_id,
            version_name,
            created_at,
        })
    }
}

impl DocumentsRepository {
    pub async fn create_document(&self, document_name: String) -> Result<Document, Box<dyn Error>> {
        let document_id = Uuid::new_v4();
        self.conn
            .execute(
                "INSERT INTO documents VALUES ($1, $2)",
                &[&document_id, &document_name],
            )
            .await?;
        Ok(Document {
            document_id,
            document_name,
        })
    }

    pub async fn get_document(&self, document_id: Uuid) -> Result<Document, Box<dyn Error>> {
        let document = self
            .conn
            .query_one(
                "SELECT * FROM documents WHERE document_id = $1",
                &[&document_id],
            )
            .await?;
        let document = Document::try_from(document)?;
        Ok(document)
    }

    pub async fn get_documents(&self) -> Result<Vec<Document>, Box<dyn Error>> {
        let documents = self.conn.query("SELECT * FROM documents", &[]).await?;
        let documents = documents
            .into_iter()
            .map(Document::try_from)
            .collect::<Result<_, _>>()?;
        Ok(documents)
    }

    pub async fn update_document(
        &self,
        document_id: Uuid,
        document_name: String,
    ) -> Result<bool, Box<dyn Error>> {
        let updated = self
            .conn
            .execute(
                "UPDATE documents SET (version_name) = ($2) WHERE document_id = $1",
                &[&document_id, &document_name],
            )
            .await?;
        Ok(updated == 1)
    }

    pub async fn delete_document(&self, document_id: Uuid) -> Result<bool, Box<dyn Error>> {
        let deleted = self
            .conn
            .execute(
                "UPDATE FROM documents WHERE document_id = $1",
                &[&document_id],
            )
            .await?;
        Ok(deleted == 1)
    }

    pub async fn create_version(
        &self,
        document_id: Uuid,
        version_name: String,
        content: String,
    ) -> Result<DocumentVersion, Box<dyn Error>> {
        let version_id = Uuid::new_v4();
        let created_at = Utc::now();
        self.conn
            .execute(
                "INSERT INTO document_versions VALUES ($1, $2, $3, $4, $5)",
                &[
                    &document_id,
                    &version_id,
                    &version_name,
                    &created_at,
                    &content,
                ],
            )
            .await?;
        Ok(DocumentVersion {
            document_id,
            version_id,
            version_name,
            created_at,
        })
    }

    pub async fn get_version(
        &self,
        document_id: Uuid,
        version_id: Uuid,
    ) -> Result<DocumentVersion, Box<dyn Error>> {
        let version = self
            .conn
            .query_one(
                "SELECT * FROM document_versions WHERE document_id = $1 AND version_id = $2",
                &[&document_id, &version_id],
            )
            .await?;
        let version = DocumentVersion::try_from(version)?;
        Ok(version)
    }

    pub async fn get_versions(
        &self,
        document_id: Uuid,
    ) -> Result<Vec<DocumentVersion>, Box<dyn Error>> {
        let versions = self
            .conn
            .query(
                "SELECT * FROM document_versions WHERE document_id = $1",
                &[&document_id],
            )
            .await?;
        let versions = versions
            .into_iter()
            .map(DocumentVersion::try_from)
            .collect::<Result<_, _>>()?;
        Ok(versions)
    }

    pub async fn get_version_content(
        &self,
        document_id: Uuid,
        version_id: Uuid,
    ) -> Result<String, Box<dyn Error>> {
        let content = self
            .conn
            .query_one(
                "SELECT content FROM document_versions WHERE document_id = $1 AND version_id = $2",
                &[&document_id, &version_id],
            )
            .await?;
        let content: String = content.try_get(0)?;
        Ok(content)
    }

    pub async fn update_version(
        &self,
        document_id: Uuid,
        version_id: Uuid,
        version_name: String,
        content: String,
    ) -> Result<bool, Box<dyn Error>> {
        let updated = self
            .conn
            .execute(
                "UPDATE document_versions SET (version_name, content) = ($3, $4) WHERE document_id = $1 AND version_id = $2",
                &[&document_id, &version_id, &version_name, &content],
            )
            .await?;
        Ok(updated == 1)
    }

    pub async fn delete_version(
        &self,
        document_id: Uuid,
        version_id: Uuid,
    ) -> Result<bool, Box<dyn Error>> {
        let deleted = self
            .conn
            .execute(
                "UPDATE FROM document_versions WHERE document_id = $1 AND version_id = $2",
                &[&document_id, &version_id],
            )
            .await?;
        Ok(deleted == 1)
    }
}

#[async_trait]
impl<S> FromRequestParts<S> for DocumentsRepository
where
    DbPool: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = StatusCode;

    async fn from_request_parts(_: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let pool = DbPool::from_ref(state);
        let conn = pool.get_owned().await.map_err(|e| {
            error!("{}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
        Ok(Self { conn })
    }
}
