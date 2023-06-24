use std::error::Error;

use axum::{
    async_trait,
    extract::{FromRef, FromRequestParts},
    http::{request::Parts, StatusCode},
};
use chrono::Utc;
use tracing::error;
use uuid::Uuid;

use crate::{
    models::comment::DocumentVersionComment,
    services::database::{DbConn, DbPool},
};

pub struct CommentsRepository {
    database: DbConn,
}

impl CommentsRepository {
    pub async fn create_comment(
        &self,
        user_id: Uuid,
        document_id: Uuid,
        version_id: Uuid,
        content: String,
    ) -> Result<DocumentVersionComment, Box<dyn Error>> {
        let comment_id = Uuid::new_v4();
        let created_at = Utc::now();
        self.database.execute(
            "
                INSERT INTO document_version_comments (comment_id, user_id, document_id, version_id, content, created_at)
                VALUES ($1, $2, $3, $4, $5, $6)
                ",
            &[&comment_id, &user_id, &document_id, &version_id, &content, &created_at],
        ).await?;
        let row = self
            .database
            .query_one("SELECT username FROM users WHERE user_id = $1", &[&user_id])
            .await?;
        let username: String = row.try_get(0)?;
        let comment = DocumentVersionComment {
            comment_id,
            user_id,
            username,
            created_at,
            content,
        };
        Ok(comment)
    }

    pub async fn get_comments(
        &self,
        user_id: Uuid,
        document_id: Uuid,
        version_id: Uuid,
    ) -> Result<Vec<DocumentVersionComment>, Box<dyn Error>> {
        let versions = self
            .database
            .query(
                "
                SELECT c.comment_id, c.user_id, u.username, c.created_at, c.content
                FROM document_version_comments c
                JOIN users u ON u.user_id = c.user_id
                WHERE c.document_id = $1
                AND c.version_id = $2
                AND EXISTS (
                    SELECT *
                    FROM user_document_version_roles r
                    WHERE r.user_id = $3
                    AND r.document_id = c.document_id
                    AND r.version_id = c.version_id
                )
                ",
                &[&document_id, &version_id, &user_id],
            )
            .await?;
        let versions = versions
            .into_iter()
            .map(DocumentVersionComment::try_from)
            .collect::<Result<_, _>>()?;
        Ok(versions)
    }
}

#[async_trait]
impl<S> FromRequestParts<S> for CommentsRepository
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
