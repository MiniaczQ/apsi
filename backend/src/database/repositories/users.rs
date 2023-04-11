use std::error::Error;

use axum::{
    async_trait,
    extract::{FromRef, FromRequestParts},
    http::{request::Parts, StatusCode},
};
use sha2::{Digest, Sha256};
use tokio_postgres::Row;
use tracing::error;
use uuid::Uuid;

use crate::database::{DbConn, DbPool};

pub struct UsersRepository {
    conn: DbConn,
}

pub struct User {
    pub user_id: Uuid,
    salt: Uuid,
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

impl UsersRepository {
    pub async fn create_user(
        &self,
        username: String,
        password: String,
    ) -> Result<User, Box<dyn Error>> {
        let user_id = Uuid::new_v4();
        let salt = Uuid::new_v4();
        let password_hash = Self::hash_password(&user_id, &password, &salt);
        self.conn
            .execute(
                "INSERT INTO users VALUES ($1, $2,  $3, $4)",
                &[&user_id, &salt, &username, &password_hash],
            )
            .await?;
        Ok(User {
            user_id,
            salt,
            username,
            password_hash,
        })
    }

    pub async fn verify(
        &self,
        username: &str,
        password: &str,
    ) -> Result<Option<User>, Box<dyn Error>> {
        let user: User = self
            .conn
            .query_one("SELECT * FROM users WHERE username = $1", &[&username])
            .await?
            .try_into()?;
        let password_hash = Self::hash_password(&user.user_id, password, &user.salt);
        Ok(if password_hash == user.password_hash {
            Some(user)
        } else {
            None
        })
    }

    fn hash_password(user_id: &Uuid, password: &str, salt: &Uuid) -> String {
        let mut hasher = Sha256::new();
        hasher.update(user_id.as_bytes());
        hasher.update(password.as_bytes());
        hasher.update(salt.as_bytes());
        hex::encode(hasher.finalize())
    }
}

#[async_trait]
impl<S> FromRequestParts<S> for UsersRepository
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
