use std::error::Error;

use axum::{
    async_trait,
    extract::{FromRef, FromRequestParts},
    http::{request::Parts, StatusCode},
};
use tracing::error;
use uuid::Uuid;

use crate::{
    models::{
        role::{DocumentVersionRole, Role},
        user::{PublicUser, PublicUserWithRoles},
    },
    services::database::{DbConn, DbPool},
};

pub struct PermissionRepository {
    database: DbConn,
}

impl PermissionRepository {
    pub async fn is_admin(&self, user_id: Uuid) -> Result<bool, Box<dyn Error>> {
        let row = self
            .database
            .query_one(
                "SELECT COUNT(*) FROM user_roles WHERE user_id = $1 AND role_id = $2",
                &[&user_id, &i16::from(Role::Admin)],
            )
            .await?;
        let count: i64 = row.try_get(0)?;
        Ok(count >= 1)
    }

    pub async fn is_owner(
        &self,
        user_id: Uuid,
        document_id: Uuid,
        version_id: Uuid,
    ) -> Result<bool, Box<dyn Error>> {
        let row = self
            .database
            .query_one(
                "SELECT COUNT(*) FROM user_document_version_roles WHERE user_id = $1 AND document_id = $2 AND version_id = $3 AND role_id = $4",
                &[&user_id, &document_id, &version_id, &i16::from(DocumentVersionRole::Owner)],
            )
            .await?;
        let count: i64 = row.try_get(0)?;
        Ok(count >= 1)
    }

    pub async fn grant_document_version_role(
        &self,
        user_id: Uuid,
        document_id: Uuid,
        version_id: Uuid,
        role: DocumentVersionRole,
    ) -> Result<bool, Box<dyn Error>> {
        let modified = self
            .database
            .execute(
                "INSERT INTO user_document_version_roles VALUES ($1, $2, $3, $4)",
                &[&user_id, &document_id, &version_id, &i16::from(role)],
            )
            .await?;
        Ok(modified == 1)
    }

    pub async fn revoke_document_version_role(
        &self,
        user_id: Uuid,
        document_id: Uuid,
        version_id: Uuid,
        role: DocumentVersionRole,
    ) -> Result<bool, Box<dyn Error>> {
        let modified = self
            .database
            .execute(
                "DELETE FROM user_document_version_roles WHERE user_id = $1 AND document_id = $2 AND version_id = $3 AND role_id = $4",
                &[&user_id, &document_id, &version_id, &i16::from(role)],
            )
            .await?;
        Ok(modified == 1)
    }

    pub async fn get_document_version_users(
        &self,
        document_id: Uuid,
        version_id: Uuid,
    ) -> Result<Vec<PublicUserWithRoles>, Box<dyn Error>> {
        let rows = self
            .database
            .query(
                "SELECT u.user_id, u.username, array_agg(r.role_id) FROM user_document_version_roles r JOIN users u ON r.user_id = u.user_id WHERE r.document_id = $1 AND r.version_id = $2 GROUP BY (u.user_id, u.username)",
                &[&document_id, &version_id],
            )
            .await?;
        let users: Vec<PublicUserWithRoles> = rows
            .into_iter()
            .map(PublicUserWithRoles::try_from)
            .collect::<Result<Vec<_>, _>>()?;
        Ok(users)
    }

    pub async fn get_document_version_user(
        &self,
        user_id: Uuid,
        document_id: Uuid,
        version_id: Uuid,
    ) -> Result<PublicUserWithRoles, Box<dyn Error>> {
        let row = self
            .database
            .query_one(
                "
                SELECT u.user_id, u.username, array_agg(r.role_id)
                FROM user_document_version_roles r
                JOIN users u ON r.user_id = u.user_id
                WHERE r.user_id = $1
                AND r.document_id = $2
                AND r.version_id = $3
                GROUP BY (u.user_id, u.username)
                ",
                &[&user_id, &document_id, &version_id],
            )
            .await?;
        let user = PublicUserWithRoles::try_from(row)?;
        Ok(user)
    }

    #[allow(dead_code)]
    pub async fn does_user_have_document_version_roles(
        &self,
        user_id: Uuid,
        document_id: Uuid,
        version_id: Uuid,
        roles: &[DocumentVersionRole],
    ) -> Result<bool, Box<dyn Error>> {
        let roles: Vec<i16> = roles.iter().map(|r| i16::from(*r)).collect();
        let row = self
            .database
            .query_one(
                "SELECT count(*) FROM user_document_version_roles WHERE user_id = $1 AND document_id = $2 AND version_id = $3 AND document_version_role_id IN $4",
                &[&user_id, &document_id, &version_id,  &roles],
            )
            .await?;
        let count: i64 = row.try_get(0)?;
        Ok(count >= 1)
    }

    pub async fn get_all_users(&self) -> Result<Vec<PublicUser>, Box<dyn Error>> {
        let users = self
            .database
            .query("SELECT user_id, username FROM users", &[])
            .await?;
        let users = users
            .into_iter()
            .map(PublicUser::try_from)
            .collect::<Result<Vec<_>, _>>()?;
        Ok(users)
    }
}

#[async_trait]
impl<S> FromRequestParts<S> for PermissionRepository
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
