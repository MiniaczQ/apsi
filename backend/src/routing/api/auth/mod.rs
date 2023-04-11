use axum::{
    extract::FromRef,
    routing::{get, post},
    Router,
};

use crate::database::DbPool;

use self::{
    authorization_keys::AuthorizationKeys, login::login, register::register, who_am_i::who_am_i,
};

pub mod authorization_keys;
pub mod claims;
mod error;
mod login;
mod register;
mod who_am_i;

pub fn auth_router<T>() -> Router<T>
where
    AuthorizationKeys: FromRef<T>,
    DbPool: FromRef<T>,
    T: 'static + Send + Sync + Clone,
{
    Router::new()
        .route("/register", post(register))
        .route("/login", post(login))
        .route("/who-am-i", get(who_am_i))
}
