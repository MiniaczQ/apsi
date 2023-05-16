use std::error::Error;

use axum::{
    async_trait,
    extract::{FromRef, FromRequestParts},
    http::{request::Parts, StatusCode},
};
use s3::Bucket;
use sha2::{Digest, Sha256};
use tracing::error;
use uuid::Uuid;

use crate::{
    models::attachment::File,
    services::database::{DbConn, DbPool},
};

pub struct FilesRepository {
    database: DbConn,
    s3storage: Bucket,
}

impl FilesRepository {
    fn file_hash(content: &[u8]) -> String {
        let mut hasher = Sha256::new();
        hasher.update(content);
        hex::encode(hasher.finalize())
    }

    pub async fn try_upload_file(
        &mut self,
        file_name: String,
        file_mime_type: String,
        content: &[u8],
    ) -> Result<File, Box<dyn Error + Send + Sync>> {
        let file_hash = Self::file_hash(content);

        let transaction = self.database.transaction().await?;
        let same_hash_files = transaction
            .query(
                "SELECT file_id FROM files WHERE file_hash = $1 AND file_name = $2",
                &[&file_hash, &file_name],
            )
            .await?
            .into_iter()
            .map(|row| row.try_get::<_, Uuid>(0))
            .collect::<Result<Vec<_>, _>>()?;

        let mut perfect_file_match: Option<Uuid> = None;

        for file_id in same_hash_files {
            let response = self.s3storage.get_object(file_id.to_string()).await?;
            if response.bytes() == content {
                perfect_file_match = Some(file_id);
                break;
            }
        }

        let file = match perfect_file_match {
            None => {
                let file_id = Uuid::new_v4();
                self.s3storage
                    .put_object(file_id.to_string(), content)
                    .await?;
                transaction
                    .execute(
                        "INSERT INTO files VALUES ($1, $2, $3, $4)",
                        &[&file_id, &file_name, &file_mime_type, &file_hash],
                    )
                    .await?;
                transaction.commit().await?;
                File {
                    file_id,
                    file_name,
                    file_mime_type,
                    file_hash,
                }
            }
            Some(file_id) => {
                let file = transaction
                    .query_one("SELECT * FROM files WHERE file_id = $1", &[&file_id])
                    .await?;
                File::try_from(file)?
            }
        };

        Ok(file)
    }

    pub async fn get_file(&self, file_id: Uuid) -> Result<Vec<u8>, Box<dyn Error + Send + Sync>> {
        let response = self.s3storage.get_object(file_id.to_string()).await?;
        Ok(response.to_vec())
    }

    pub async fn try_delete_file(
        &mut self,
        file_id: Uuid,
    ) -> Result<bool, Box<dyn Error + Send + Sync>> {
        let transaction = self.database.transaction().await?;
        let attached_count: i64 = transaction
            .query_one(
                "SELECT count(*) FROM file_attachments WHERE file_id = $1",
                &[&file_id],
            )
            .await?
            .try_get(0)?;
        Ok(if attached_count == 0 {
            let deleted = transaction
                .execute("DELETE FROM files WHERE file_id = $1", &[&file_id])
                .await?;
            transaction.commit().await?;
            self.s3storage.delete_object(file_id.to_string()).await?;
            deleted == 1
        } else {
            false
        })
    }
}

#[async_trait]
impl<S> FromRequestParts<S> for FilesRepository
where
    DbPool: FromRef<S>,
    Bucket: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = StatusCode;

    async fn from_request_parts(_: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let database = DbPool::from_ref(state).get_owned().await.map_err(|e| {
            error!("{}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
        let s3storage = Bucket::from_ref(state);
        Ok(Self {
            database,
            s3storage,
        })
    }
}
