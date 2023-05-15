use std::error::Error;

use axum::{
    async_trait,
    extract::{FromRef, FromRequestParts},
    http::{request::Parts, StatusCode},
};
use chrono::{DateTime, Utc};
use serde::Serialize;
use tokio_postgres::{Row, Transaction};
use tracing::error;
use uuid::Uuid;

use crate::services::database::{DbConn, DbPool};

use super::{files::File, permission::DocumentVersionRole};

pub struct DocumentsRepository {
    database: DbConn,
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
    pub content: String,
    pub children: Vec<Uuid>,
    pub parents: Vec<Uuid>,
}

impl TryFrom<Row> for DocumentVersion {
    type Error = tokio_postgres::Error;

    fn try_from(value: Row) -> Result<Self, Self::Error> {
        let document_id: Uuid = value.try_get(0)?;
        let version_id: Uuid = value.try_get(1)?;
        let version_name: String = value.try_get(2)?;
        let created_at: DateTime<Utc> = value.try_get(3)?;
        let content: String = value.try_get(4)?;
        let children: Vec<Uuid> = value.try_get(5)?;
        let parents: Vec<Uuid> = value.try_get(6)?;

        Ok(Self {
            document_id,
            version_id,
            version_name,
            created_at,
            content,
            children,
            parents,
        })
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentWithInitialVersion {
    document: Document,
    initial_version: DocumentVersion,
}

impl DocumentsRepository {
    async fn create_version_inner<'a>(
        transaction: &Transaction<'a>,
        user_id: Uuid,
        document_id: Uuid,
        version_name: String,
        content: String,
        parent_ids: &[Uuid],
    ) -> Result<DocumentVersion, Box<dyn Error>> {
        let version_id = Uuid::new_v4();
        let created_at = Utc::now();
        transaction
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
        for parent_id in parent_ids {
            transaction
                .execute(
                    "INSERT INTO documents_dependencies (document_id, parent_version_id, child_version_id) VALUES ($1, $2, $3)",
                    &[&document_id, &parent_id, &version_id],
                )
                .await?;
        }
        transaction
            .execute(
                "INSERT INTO user_document_version_roles VALUES ($1, $2, $3, $4)",
                &[
                    &user_id,
                    &document_id,
                    &version_id,
                    &i16::from(DocumentVersionRole::Owner),
                ],
            )
            .await?;
        let document_version = transaction
            .query_one(
                "
                SELECT v.document_id, v.version_id, v.version_name, v.created_at, v.content,
                    array(SELECT c.child_version_id FROM documents_dependencies c WHERE c.document_id = v.document_id AND c.parent_version_id = v.version_id),
                    array(SELECT p.parent_version_id FROM documents_dependencies p WHERE p.document_id = v.document_id AND p.child_version_id = v.version_id)
                FROM document_versions v
                WHERE v.document_id = $1
                AND v.version_id = $2
                GROUP BY (v.document_id, v.version_id)
                ",
                &[&document_id, &version_id],
            )
            .await?;
        let document_version = DocumentVersion::try_from(document_version)?;
        Ok(document_version)
    }

    pub async fn create_document(
        &mut self,
        document_name: String,
        user_id: Uuid,
        version_name: String,
        content: String,
    ) -> Result<DocumentWithInitialVersion, Box<dyn Error>> {
        let document_id = Uuid::new_v4();
        let transaction = self.database.transaction().await?;
        transaction
            .execute(
                "INSERT INTO documents VALUES ($1, $2)",
                &[&document_id, &document_name],
            )
            .await?;
        let initial_version = Self::create_version_inner(
            &transaction,
            user_id,
            document_id,
            version_name,
            content,
            &[],
        )
        .await?;
        transaction.commit().await?;
        let document = Document {
            document_id,
            document_name,
        };
        Ok(DocumentWithInitialVersion {
            document,
            initial_version,
        })
    }

    pub async fn get_document(&self, document_id: Uuid) -> Result<Document, Box<dyn Error>> {
        let document = self
            .database
            .query_one(
                "SELECT * FROM documents WHERE document_id = $1",
                &[&document_id],
            )
            .await?;
        let document = Document::try_from(document)?;
        Ok(document)
    }

    pub async fn get_documents(&self) -> Result<Vec<Document>, Box<dyn Error>> {
        let documents = self.database.query("SELECT * FROM documents", &[]).await?;
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
            .database
            .execute(
                "UPDATE documents SET document_name = $2 WHERE document_id = $1",
                &[&document_id, &document_name],
            )
            .await?;
        Ok(updated == 1)
    }

    pub async fn delete_document(&self, document_id: Uuid) -> Result<bool, Box<dyn Error>> {
        let deleted = self
            .database
            .execute(
                "DELETE FROM documents WHERE document_id = $1",
                &[&document_id],
            )
            .await?;
        Ok(deleted == 1)
    }

    pub async fn create_version(
        &mut self,
        user_id: Uuid,
        document_id: Uuid,
        version_name: String,
        content: String,
        parents: Vec<Uuid>,
    ) -> Result<DocumentVersion, Box<dyn Error>> {
        let transaction = self.database.transaction().await?;
        let document_version = Self::create_version_inner(
            &transaction,
            user_id,
            document_id,
            version_name,
            content,
            &parents,
        )
        .await?;
        transaction.commit().await?;
        Ok(document_version)
    }

    pub async fn get_version(
        &self,
        document_id: Uuid,
        version_id: Uuid,
    ) -> Result<DocumentVersion, Box<dyn Error>> {
        let version = self
            .database
            .query_one(
                "
                SELECT v.document_id, v.version_id, v.version_name, v.created_at, v.content,
                    array(SELECT c.child_version_id FROM documents_dependencies c WHERE c.document_id = v.document_id AND c.parent_version_id = v.version_id),
                    array(SELECT p.parent_version_id FROM documents_dependencies p WHERE p.document_id = v.document_id AND p.child_version_id = v.version_id)
                FROM document_versions v
                WHERE v.document_id = $1
                AND v.version_id = $2
                GROUP BY (v.document_id, v.version_id)
                ",
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
            .database
            .query(
                "
                SELECT v.document_id, v.version_id, v.version_name, v.created_at, v.content,
                    array(SELECT c.child_version_id FROM documents_dependencies c WHERE c.document_id = v.document_id AND c.parent_version_id = v.version_id),
                    array(SELECT p.parent_version_id FROM documents_dependencies p WHERE p.document_id = v.document_id AND p.child_version_id = v.version_id)
                FROM document_versions v
                WHERE v.document_id = $1
                GROUP BY (v.document_id, v.version_id)
                ",
                &[&document_id],
            )
            .await?;
        let versions = versions
            .into_iter()
            .map(DocumentVersion::try_from)
            .collect::<Result<_, _>>()?;
        Ok(versions)
    }

    pub async fn update_version(
        &self,
        document_id: Uuid,
        version_id: Uuid,
        version_name: String,
        content: String,
    ) -> Result<bool, Box<dyn Error>> {
        let updated = self
            .database
            .execute(
                "UPDATE document_versions SET version_name = $3, content = $4 WHERE document_id = $1 AND version_id = $2",
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
            .database
            .execute(
                "DELETE FROM document_versions WHERE document_id = $1 AND version_id = $2",
                &[&document_id, &version_id],
            )
            .await?;
        Ok(deleted == 1)
    }

    pub async fn get_file_attachments(
        &self,
        document_id: Uuid,
        version_id: Uuid,
    ) -> Result<Vec<File>, Box<dyn Error>> {
        let attached_files = self
            .database
            .query(
                "SELECT f.* FROM file_attachments fa JOIN files f ON fa.file_id = f.file_id WHERE document_id = $1 AND version_id = $2",
                &[&document_id, &version_id],
            )
            .await?;
        let attached_files = attached_files
            .into_iter()
            .map(File::try_from)
            .collect::<Result<_, _>>()?;
        Ok(attached_files)
    }

    pub async fn get_file_attachment(
        &self,
        document_id: Uuid,
        version_id: Uuid,
        file_id: Uuid,
    ) -> Result<File, Box<dyn Error>> {
        let attached_file = self
            .database
            .query_one(
                "SELECT f.* FROM file_attachments fa JOIN files f ON fa.file_id = f.file_id WHERE document_id = $1 AND version_id = $2 AND file_id = $3",
                &[&document_id, &version_id, &file_id],
            )
            .await?;
        let attached_file = File::try_from(attached_file)?;
        Ok(attached_file)
    }

    pub async fn attach_file(
        &self,
        document_id: Uuid,
        version_id: Uuid,
        file_id: Uuid,
    ) -> Result<bool, Box<dyn Error>> {
        let attached = self
            .database
            .execute(
                "INSERT INTO file_attachments VALUES ($1, $2, $3)",
                &[&document_id, &version_id, &file_id],
            )
            .await?;
        Ok(attached == 1)
    }

    pub async fn detach_file(
        &self,
        document_id: Uuid,
        version_id: Uuid,
        file_id: Uuid,
    ) -> Result<bool, Box<dyn Error + Send + Sync>> {
        let deleted = self
            .database
            .execute(
                "DELETE FROM file_attachments WHERE document_id = $1 AND version_id = $2 AND file_id = $3",
                &[&document_id, &version_id, &file_id],
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
        let database = DbPool::from_ref(state).get_owned().await.map_err(|e| {
            error!("{}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
        Ok(Self { database })
    }
}
