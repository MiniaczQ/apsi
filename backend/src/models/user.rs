use serde::Serialize;
use tokio_postgres::Row;
use uuid::Uuid;

use super::role::DocumentVersionRole;

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

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PublicUser {
    pub user_id: Uuid,
    pub username: String,
}

impl TryFrom<Row> for PublicUser {
    type Error = tokio_postgres::Error;

    fn try_from(value: Row) -> Result<Self, Self::Error> {
        let user_id: Uuid = value.try_get(0)?;
        let username: String = value.try_get(1)?;
        Ok(Self { user_id, username })
    }
}

pub struct User {
    pub user_id: Uuid,
    pub salt: Uuid,
    pub username: String,
    pub password_hash: String,
}

impl TryFrom<Row> for User {
    type Error = tokio_postgres::Error;

    fn try_from(value: Row) -> Result<Self, Self::Error> {
        let user_id: Uuid = value.try_get(0)?;
        let salt: Uuid = value.try_get(1)?;
        let username: String = value.try_get(2)?;
        let password_hash: String = value.try_get(3)?;
        Ok(Self {
            user_id,
            salt,
            username,
            password_hash,
        })
    }
}
