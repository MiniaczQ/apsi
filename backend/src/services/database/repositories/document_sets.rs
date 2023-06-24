use std::error::Error;

use axum::{
    async_trait,
    extract::{FromRef, FromRequestParts},
    http::{request::Parts, StatusCode},
};
use chrono::Utc;
use tokio_postgres::Transaction;
use tracing::error;
use uuid::Uuid;

use crate::{
    models::{
        document_set::{DocumentSet, DocumentSetWithInitialVersion},
        set_version::SetVersion,
    },
    services::database::{DbConn, DbPool},
};

pub struct DocumentSetsRepository {
    database: DbConn,
}

impl DocumentSetsRepository {
    async fn create_set_version_inner<'a>(
        db: &Transaction<'a>,
        _user_id: Uuid,
        document_set_id: Uuid,
        set_version_name: String,
        document_version_ids: &[(Uuid, Uuid)],
        parent_ids: &[Uuid],
    ) -> Result<SetVersion, Box<dyn Error>> {
        let set_version_id = Uuid::new_v4();
        let created_at = Utc::now();
        db
            .execute(
                "
                INSERT INTO document_set_versions (document_set_id, set_version_id, set_version_name, created_at)
                VALUES ($1, $2, $3, $4)
                ",
                &[
                    &document_set_id,
                    &set_version_id,
                    &set_version_name,
                    &created_at,
                ],
            )
            .await?;
        for parent_id in parent_ids {
            db
                .execute(
                    "
                    INSERT INTO document_sets_dependencies (document_set_id, parent_version_id, child_version_id)
                    VALUES ($1, $2, $3)
                    ",
                    &[&document_set_id, &parent_id, &set_version_id],
                )
                .await?;
        }
        for (document_id, version_id) in document_version_ids {
            db.execute(
                "
                INSERT INTO document_set_versions_elements (document_set_id, set_version_id, document_id, version_id)
                VALUES ($1, $2, $3, $4)
                ",
                &[
                    &document_set_id,
                    &set_version_id,
                    &document_id,
                    &version_id,
                ],
            )
            .await?;
        }
        let set_version = db
            .query_one(
                "
                SELECT v.document_set_id, v.set_version_id, v.set_version_name, v.created_at,
                    array(SELECT e.document_id FROM document_set_versions_elements e WHERE e.document_set_id = v.document_set_id AND e.set_version_id = v.set_version_id),
                    array(SELECT e.version_id FROM document_set_versions_elements e WHERE e.document_set_id = v.document_set_id AND e.set_version_id = v.set_version_id),
                    array(SELECT c.child_version_id FROM document_sets_dependencies c WHERE c.document_set_id = v.document_set_id AND c.parent_version_id = v.set_version_id),
                    array(SELECT p.parent_version_id FROM document_sets_dependencies p WHERE p.document_set_id = v.document_set_id AND p.child_version_id = v.set_version_id)
                FROM document_set_versions v
                WHERE v.document_set_id = $1
                AND v.set_version_id = $2
                GROUP BY (v.document_set_id, v.set_version_id)
                ",
                &[&document_set_id, &set_version_id],
            )
            .await?;
        let document_version = SetVersion::try_from(set_version)?;
        Ok(document_version)
    }

    pub async fn create_document_set(
        &mut self,
        user_id: Uuid,
        document_set_name: String,
        set_version_name: String,
        document_version_ids: Vec<(Uuid, Uuid)>,
    ) -> Result<DocumentSetWithInitialVersion, Box<dyn Error>> {
        let document_set_id = Uuid::new_v4();
        let transaction = self.database.transaction().await?;
        transaction
            .execute(
                "
                INSERT INTO document_sets (document_set_id, document_set_name)
                VALUES ($1, $2)
                ",
                &[&document_set_id, &document_set_name],
            )
            .await?;
        let initial_version = Self::create_set_version_inner(
            &transaction,
            user_id,
            document_set_id,
            set_version_name,
            &document_version_ids,
            &[],
        )
        .await?;
        transaction.commit().await?;
        let document_set = DocumentSet {
            document_set_id,
            document_set_name,
        };
        Ok(DocumentSetWithInitialVersion {
            document_set,
            initial_version,
        })
    }

    pub async fn get_document_sets(
        &self,
        _user_id: Uuid,
    ) -> Result<Vec<DocumentSet>, Box<dyn Error>> {
        let document_sets = self
            .database
            .query(
                "
                SELECT d.document_set_id, d.document_set_name
                FROM document_sets d
                ", // TODO: potencjalnie filtrowanie dostępności
                &[],
            )
            .await?;
        let documents = document_sets
            .into_iter()
            .map(DocumentSet::try_from)
            .collect::<Result<_, _>>()?;
        Ok(documents)
    }

    pub async fn create_document_set_version(
        &mut self,
        user_id: Uuid,
        document_set_id: Uuid,
        set_version_name: String,
        document_version_ids: Vec<(Uuid, Uuid)>,
        parents: Vec<Uuid>,
    ) -> Result<SetVersion, Box<dyn Error>> {
        let transaction = self.database.transaction().await?;
        let document_version = Self::create_set_version_inner(
            &transaction,
            user_id,
            document_set_id,
            set_version_name,
            &document_version_ids,
            &parents,
        )
        .await?;
        transaction.commit().await?;
        Ok(document_version)
    }

    pub async fn get_document_set_versions(
        &self,
        _user_id: Uuid,
        document_set_id: Uuid,
    ) -> Result<Vec<SetVersion>, Box<dyn Error>> {
        let versions = self
            .database
            .query(
                "
                SELECT v.document_set_id, v.set_version_id, v.set_version_name, v.created_at,
                    array(SELECT e.document_id FROM document_set_versions_elements e WHERE e.document_set_id = v.document_set_id AND e.set_version_id = v.set_version_id),
                    array(SELECT e.version_id FROM document_set_versions_elements e WHERE e.document_set_id = v.document_set_id AND e.set_version_id = v.set_version_id),
                    array(SELECT c.child_version_id FROM document_sets_dependencies c WHERE c.document_set_id = v.document_set_id AND c.parent_version_id = v.set_version_id),
                    array(SELECT p.parent_version_id FROM document_sets_dependencies p WHERE p.document_set_id = v.document_set_id AND p.child_version_id = v.set_version_id)
                FROM document_set_versions v
                WHERE v.document_set_id = $1
                GROUP BY (v.document_set_id, v.set_version_id)
                ", // TODO: potencjalnie filtrowanie dostępności
                &[&document_set_id],
            )
            .await?;
        let versions = versions
            .into_iter()
            .map(SetVersion::try_from)
            .collect::<Result<_, _>>()?;
        Ok(versions)
    }

    pub async fn add_to_document_set_version(
        &self,
        _user_id: Uuid,
        document_set_id: Uuid,
        set_version_id: Uuid,
        document_id: Uuid,
        version_id: Uuid,
    ) -> Result<bool, Box<dyn Error>> {
        let added = self
            .database
            .execute(
                "
                INSERT INTO document_set_versions_elements (document_set_id, set_version_id, document_id, version_id)
                VALUES ($1, $2, $3, $4)
                ",
                &[&document_set_id, &set_version_id, &document_id, &version_id],
            )
            .await?;
        Ok(added == 1)
    }

    pub async fn remove_from_document_set_version(
        &self,
        _user_id: Uuid,
        document_set_id: Uuid,
        set_version_id: Uuid,
        document_id: Uuid,
        version_id: Uuid,
    ) -> Result<bool, Box<dyn Error>> {
        let removed = self
            .database
            .execute(
                "
                DELETE FROM document_set_versions_elements
                WHERE document_set_id = $1
                AND set_version_id = $2
                AND document_id = $3
                AND version_id = $4
                ",
                &[&document_set_id, &set_version_id, &document_id, &version_id],
            )
            .await?;
        Ok(removed == 1)
    }
}

#[async_trait]
impl<S> FromRequestParts<S> for DocumentSetsRepository
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
