use std::{convert::Infallible, error::Error};

use axum::{
    async_trait,
    extract::{FromRef, FromRequestParts},
    http::{request::Parts, StatusCode},
};
use serde::Serialize;
use tokio_postgres::Row;
use tracing::error;
use uuid::Uuid;

use crate::services::database::{DbConn, DbPool};

use super::users::PublicUser;

pub struct PermissionRepository {
    database: DbConn,
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
#[repr(i16)]
pub enum Role {
    Admin = 0,
}

impl From<Role> for i16 {
    fn from(value: Role) -> Self {
        value as i16
    }
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
#[repr(i16)]
pub enum DocumentVersionRole {
    Owner = 0,
    Viewer = 1,
    Editor = 2,
    Reviewer = 3,
}

// TODO: handle a very unlikely case of invalid value properly
impl TryFrom<i16> for DocumentVersionRole {
    type Error = Infallible;

    fn try_from(value: i16) -> Result<Self, Self::Error> {
        match value {
            0 => Ok(Self::Owner),
            1 => Ok(Self::Viewer),
            2 => Ok(Self::Editor),
            3 => Ok(Self::Reviewer),
            _ => unreachable!(),
        }
    }
}

impl From<DocumentVersionRole> for i16 {
    fn from(value: DocumentVersionRole) -> Self {
        value as i16
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PublicUserWithRoles {
    #[serde(flatten)]
    pub user: PublicUser,
    pub roles: Vec<DocumentVersionRole>,
}

impl TryFrom<Row> for PublicUserWithRoles {
    type Error = tokio_postgres::Error;

    fn try_from(value: Row) -> Result<Self, Self::Error> {
        let user_id: Uuid = value.try_get(0)?;
        let username: String = value.try_get(1)?;
        let roles: Vec<i16> = value.try_get(2)?;
        let roles: Vec<DocumentVersionRole> = roles
            .into_iter()
            .map(|v| DocumentVersionRole::try_from(v).unwrap())
            .collect();

        Ok(Self {
            user: PublicUser { user_id, username },
            roles,
        })
    }
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

    pub async fn can_give_or_revoke_document_version_role(
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

    pub async fn give_document_version_role(
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
                "SELECT r.user_id, r.username, array_agg(r.role_id) FROM user_document_version_roles r JOIN users u ON r.user_id = u.user_id WHERE r.document_id = $1 AND r.version_id = $2 GROUP BY u.*",
                &[&document_id, &version_id],
            )
            .await?;
        let users: Vec<PublicUserWithRoles> = rows
            .into_iter()
            .map(|r| PublicUserWithRoles::try_from(r))
            .collect::<Result<Vec<_>, _>>()?;
        Ok(users)
    }

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
