use std::error::Error;

use axum::{
    async_trait,
    extract::{FromRef, FromRequestParts},
    http::{request::Parts, StatusCode},
};
use sha2::{Digest, Sha256};
use tracing::error;
use uuid::Uuid;

use crate::{
    models::user::User,
    services::database::{DbConn, DbPool},
};

pub struct UsersRepository {
    database: DbConn,
}

fn hash_password(user_id: &Uuid, password: &str, salt: &Uuid) -> String {
    let mut hasher = Sha256::new();
    hasher.update(user_id.as_bytes());
    hasher.update("|");
    hasher.update(password.as_bytes());
    hasher.update("|");
    hasher.update(salt.as_bytes());
    hex::encode(hasher.finalize())
}

impl UsersRepository {
    pub async fn create_user(
        &self,
        username: String,
        password: String,
    ) -> Result<User, Box<dyn Error>> {
        let user_id = Uuid::new_v4();
        let salt = Uuid::new_v4();
        let password_hash = hash_password(&user_id, &password, &salt);
        self.database
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
            .database
            .query_one("SELECT * FROM users WHERE username = $1", &[&username])
            .await?
            .try_into()?;
        let password_hash = hash_password(&user.user_id, password, &user.salt);
        Ok(if password_hash == user.password_hash {
            Some(user)
        } else {
            None
        })
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
        let database = DbPool::from_ref(state).get_owned().await.map_err(|e| {
            error!("{}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;
        Ok(Self { database })
    }
}

#[cfg(test)]
mod tests {
    use uuid::Uuid;

    use crate::services::database::repositories::users::hash_password;

    #[test]
    fn hashing() {
        let user_id = Uuid::parse_str("81721217-8f19-4c3b-8b25-a2af68875018").unwrap();
        let password = "admin";
        let salt = Uuid::parse_str("8ce53b43-a248-4abf-a76e-d79d21a820cf").unwrap();
        let hashed = hash_password(&user_id, password, &salt);
        println!("Hash: `{}`", hashed);
    }
}
