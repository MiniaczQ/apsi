use std::{
    error::Error,
    fmt::{Debug, Display},
};

use axum::{
    async_trait,
    extract::{FromRef, FromRequestParts},
    http::{request::Parts, StatusCode},
};
use chrono::{DateTime, Utc};
use tokio_postgres::Transaction;
use tracing::error;
use uuid::Uuid;

use crate::{
    models::{
        attachment::File,
        document::{Document, DocumentWithInitialVersion},
        role::DocumentVersionRole,
        version::DocumentVersion,
        version_state::DocumentVersionState,
    },
    services::database::{DbConn, DbPool},
};

use super::RepoError;

pub struct DocumentsRepository {
    database: DbConn,
}

#[derive(Debug)]
pub enum UniqueError {
    Pg(tokio_postgres::Error),
    UniqueValueViolation,
}

impl Display for UniqueError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Pg(error) => Display::fmt(error, f),
            Self::UniqueValueViolation => f.write_str("Key already exists"),
        }
    }
}

impl Error for UniqueError {}

impl From<tokio_postgres::Error> for UniqueError {
    fn from(value: tokio_postgres::Error) -> Self {
        Self::Pg(value)
    }
}

#[derive(Debug)]
pub enum ConcurrencyError<T>
where
    T: Debug,
{
    Pg(tokio_postgres::Error),
    UniqueValueViolation(T),
    Failed,
}

impl<T> Display for ConcurrencyError<T>
where
    T: Debug,
{
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Pg(error) => Display::fmt(error, f),
            Self::UniqueValueViolation(_) => f.write_str("Concurrency error"),
            Self::Failed => f.write_str("Failed to updated"),
        }
    }
}

impl<T> Error for ConcurrencyError<T> where T: Debug {}

impl<T> From<tokio_postgres::Error> for ConcurrencyError<T>
where
    T: Debug,
{
    fn from(value: tokio_postgres::Error) -> Self {
        Self::Pg(value)
    }
}

impl DocumentsRepository {
    async fn create_version_inner<'a>(
        db: &Transaction<'a>,
        user_id: Uuid,
        document_id: Uuid,
        version_name: String,
        content: String,
        parent_ids: &[Uuid],
    ) -> Result<DocumentVersion, UniqueError> {
        let version_id = Uuid::new_v4();
        let created_at = Utc::now();
        db
            .execute(
                "
                INSERT INTO document_versions (document_id, version_id, version_name, created_at, content)
                VALUES ($1, $2, $3, $4, $5)
                ",
                &[
                    &document_id,
                    &version_id,
                    &version_name,
                    &created_at,
                    &content,
                ],
            )
            .await.map_err(|error| {
                if let Some(db_error) = error.as_db_error() {
                    if let Some(constraint) = db_error.constraint() {
                        if constraint == "document_versions_document_id_version_name_key" {
                            return UniqueError::UniqueValueViolation
                        }
                    }
                }
                error.into()
            })?;
        for parent_id in parent_ids {
            db
                .execute(
                    "
                    INSERT INTO documents_dependencies (document_id, parent_version_id, child_version_id)
                    VALUES ($1, $2, $3)
                    ",
                    &[&document_id, &parent_id, &version_id],
                )
                .await?;
        }
        db.execute(
            "
                INSERT INTO user_document_version_roles (user_id, document_id, version_id, role_id)
                VALUES ($1, $2, $3, $4)
                ",
            &[
                &user_id,
                &document_id,
                &version_id,
                &i16::from(DocumentVersionRole::Owner),
            ],
        )
        .await?;
        let document_version = db
            .query_one(
                "
                SELECT v.document_id, v.version_id, v.version_name, v.created_at, v.content, v.version_state, v.updated_at,
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
    ) -> Result<DocumentWithInitialVersion, UniqueError> {
        let document_id = Uuid::new_v4();
        let transaction = self.database.transaction().await?;
        transaction
            .execute(
                "
                INSERT INTO documents (document_id, document_name)
                VALUES ($1, $2)
                ",
                &[&document_id, &document_name],
            )
            .await
            .map_err(|error| {
                if let Some(db_error) = error.as_db_error() {
                    if let Some(constraint) = db_error.constraint() {
                        if constraint == "documents_document_name_key" {
                            return UniqueError::UniqueValueViolation;
                        }
                    }
                }
                error.into()
            })?;
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

    pub async fn get_document(
        &self,
        user_id: Uuid,
        document_id: Uuid,
    ) -> Result<Document, RepoError> {
        let documents = self
            .database
            .query(
                "
                SELECT d.document_id, d.document_name
                FROM documents d
                WHERE d.document_id = $1
                AND EXISTS (
                    SELECT *
                    FROM user_document_version_roles r
                    WHERE r.user_id = $2
                    AND r.document_id = d.document_id
                )
                ",
                &[&document_id, &user_id],
            )
            .await?;
        match documents.len() {
            0 => Err(RepoError::Forbidden),
            1 => {
                let document = Document::try_from(documents.into_iter().next().unwrap())?;
                Ok(document)
            }
            _ => Err(RepoError::Unreachable),
        }
    }

    pub async fn get_documents(&self, user_id: Uuid) -> Result<Vec<Document>, Box<dyn Error>> {
        let documents = self
            .database
            .query(
                "
                SELECT d.document_id, d.document_name
                FROM documents d
                WHERE EXISTS (
                    SELECT *
                    FROM user_document_version_roles r
                    WHERE r.user_id = $1
                    AND r.document_id = d.document_id
                )
                ",
                &[&user_id],
            )
            .await?;
        let documents = documents
            .into_iter()
            .map(Document::try_from)
            .collect::<Result<_, _>>()?;
        Ok(documents)
    }

    pub async fn create_version(
        &mut self,
        user_id: Uuid,
        document_id: Uuid,
        version_name: String,
        content: String,
        parents: Vec<Uuid>,
    ) -> Result<DocumentVersion, UniqueError> {
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
        user_id: Uuid,
        document_id: Uuid,
        version_id: Uuid,
    ) -> Result<DocumentVersion, RepoError> {
        let version = self
            .database
            .query_opt(
                "
                SELECT v.document_id, v.version_id, v.version_name, v.created_at, v.content, v.version_state, v.updated_at,
                    array(SELECT c.child_version_id FROM documents_dependencies c WHERE c.document_id = v.document_id AND c.parent_version_id = v.version_id),
                    array(SELECT p.parent_version_id FROM documents_dependencies p WHERE p.document_id = v.document_id AND p.child_version_id = v.version_id)
                FROM document_versions v
                WHERE v.document_id = $1
                AND v.version_id = $2
                AND EXISTS (
                    SELECT *
                    FROM user_document_version_roles r
                    WHERE r.user_id = $3
                    AND r.document_id = v.document_id
                    AND r.version_id = v.version_id
                )
                GROUP BY (v.document_id, v.version_id)
                ",
                &[&document_id, &version_id, &user_id],
            )
            .await?;
        match version {
            None => Err(RepoError::Forbidden),
            Some(version) => {
                let version = DocumentVersion::try_from(version)?;
                Ok(version)
            }
        }
    }

    pub async fn get_versions(
        &self,
        user_id: Uuid,
        document_id: Uuid,
    ) -> Result<Vec<DocumentVersion>, Box<dyn Error>> {
        let versions = self
            .database
            .query(
                "
                SELECT v.document_id, v.version_id, v.version_name, v.created_at, v.content, v.version_state, v.updated_at,
                    array(SELECT c.child_version_id FROM documents_dependencies c WHERE c.document_id = v.document_id AND c.parent_version_id = v.version_id),
                    array(SELECT p.parent_version_id FROM documents_dependencies p WHERE p.document_id = v.document_id AND p.child_version_id = v.version_id)
                FROM document_versions v
                WHERE v.document_id = $1
                AND EXISTS (
                    SELECT *
                    FROM user_document_version_roles r
                    WHERE r.user_id = $2
                    AND r.document_id = v.document_id
                    AND r.version_id = v.version_id
                )
                GROUP BY (v.document_id, v.version_id)
                ",
                &[&document_id, &user_id],
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
        content: String,
        updated_at: DateTime<Utc>,
    ) -> Result<DocumentVersion, ConcurrencyError<DocumentVersion>> {
        let now = Utc::now();
        let updated = self
            .database
            .execute(
                "
                UPDATE document_versions
                SET content = $1, updated_at = $2
                WHERE document_id = $3
                AND version_id = $4
                AND updated_at = $5
                AND version_state = $6
                ",
                &[
                    &content,
                    &now,
                    &document_id,
                    &version_id,
                    &updated_at,
                    &i16::from(DocumentVersionState::InProgress),
                ],
            )
            .await?;
        let version = self
            .database
            .query_one(
                "
                SELECT v.document_id, v.version_id, v.version_name, v.created_at, v.content, v.version_state, v.updated_at,
                    array(SELECT c.child_version_id FROM documents_dependencies c WHERE c.document_id = v.document_id AND c.parent_version_id = v.version_id),
                    array(SELECT p.parent_version_id FROM documents_dependencies p WHERE p.document_id = v.document_id AND p.child_version_id = v.version_id)
                FROM document_versions v
                WHERE v.document_id = $1
                AND v.version_id = $2
                ",
                &[&document_id, &version_id],
            )
            .await?;
        let version = DocumentVersion::try_from(version)?;
        if updated == 1 {
            Ok(version)
        } else if updated == 0 && updated_at != version.updated_at {
            Err(ConcurrencyError::UniqueValueViolation(version))
        } else {
            Err(ConcurrencyError::Failed)
        }
    }

    pub async fn get_file_attachments(
        &self,
        user_id: Uuid,
        document_id: Uuid,
        version_id: Uuid,
    ) -> Result<Vec<File>, Box<dyn Error>> {
        let attached_files = self
            .database
            .query(
                "
                SELECT f.file_id, f.file_name, f.file_mime_type, f.file_hash
                FROM file_attachments a
                JOIN files f ON a.file_id = f.file_id
                WHERE a.document_id = $1
                AND a.version_id = $2
                AND EXISTS (
                    SELECT *
                    FROM user_document_version_roles r
                    WHERE r.user_id = $3
                    AND r.document_id = a.document_id
                    AND r.version_id = a.version_id
                )
                ",
                &[&document_id, &version_id, &user_id],
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
        user_id: Uuid,
        document_id: Uuid,
        version_id: Uuid,
        file_id: Uuid,
    ) -> Result<File, RepoError> {
        let attached_files = self
            .database
            .query(
                "
                SELECT f.file_id, f.file_name, f.file_mime_type, f.file_hash
                FROM file_attachments a
                JOIN files f ON a.file_id = f.file_id
                WHERE a.document_id = $1
                AND a.version_id = $2
                AND a.file_id = $3
                AND EXISTS (
                    SELECT *
                    FROM user_document_version_roles r
                    WHERE r.user_id = $4
                    AND r.document_id = a.document_id
                    AND r.version_id = a.version_id
                )
                ",
                &[&document_id, &version_id, &file_id, &user_id],
            )
            .await?;
        match attached_files.len() {
            0 => Err(RepoError::Forbidden),
            1 => {
                let attached_file = File::try_from(attached_files.into_iter().next().unwrap())?;
                Ok(attached_file)
            }
            _ => Err(RepoError::Unreachable),
        }
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
                "
                INSERT INTO file_attachments (document_id, version_id, file_id)
                VALUES ($1, $2, $3)
                ",
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
                "
                DELETE FROM file_attachments
                WHERE document_id = $1
                AND version_id = $2
                AND file_id = $3
                ",
                &[&document_id, &version_id, &file_id],
            )
            .await?;
        Ok(deleted == 1)
    }

    pub async fn change_state(
        &self,
        document_id: Uuid,
        version_id: Uuid,
        new_state: DocumentVersionState,
        updated_at: DateTime<Utc>,
    ) -> Result<DocumentVersion, ConcurrencyError<DocumentVersion>> {
        let allowed_states: Vec<i16> = match new_state {
            DocumentVersionState::InProgress => vec![
                i16::from(DocumentVersionState::ReadyForReview),
                i16::from(DocumentVersionState::Reviewed),
            ],
            DocumentVersionState::ReadyForReview => {
                vec![i16::from(DocumentVersionState::InProgress)]
            }
            DocumentVersionState::Reviewed => vec![i16::from(DocumentVersionState::ReadyForReview)],
            DocumentVersionState::Published => vec![i16::from(DocumentVersionState::Reviewed)],
        };
        let now = Utc::now();
        let modified = self
            .database
            .execute(
                "
                UPDATE document_versions
                SET version_state = $1, updated_at = $2
                WHERE document_id = $3
                AND version_id = $4
                AND version_state = ANY($5)
                AND updated_at = $6
                ",
                &[
                    &i16::from(new_state),
                    &now,
                    &document_id,
                    &version_id,
                    &allowed_states,
                    &updated_at,
                ],
            )
            .await?;
        let version = self
            .database
            .query_one(
                "
                SELECT v.document_id, v.version_id, v.version_name, v.created_at, v.content, v.version_state, v.updated_at,
                    array(SELECT c.child_version_id FROM documents_dependencies c WHERE c.document_id = v.document_id AND c.parent_version_id = v.version_id),
                    array(SELECT p.parent_version_id FROM documents_dependencies p WHERE p.document_id = v.document_id AND p.child_version_id = v.version_id)
                FROM document_versions v
                WHERE v.document_id = $1
                AND v.version_id = $2
                ",
                &[&document_id, &version_id],
            )
            .await?;
        let version = DocumentVersion::try_from(version)?;
        if modified == 1 {
            Ok(version)
        } else if modified == 0 && updated_at != version.updated_at {
            Err(ConcurrencyError::UniqueValueViolation(version))
        } else {
            Err(ConcurrencyError::Failed)
        }
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
