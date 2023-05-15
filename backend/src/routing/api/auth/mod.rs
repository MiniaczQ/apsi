use axum::{
    extract::FromRef,
    routing::{get, post},
    Router,
};

use crate::services::{auth::auth_keys::AuthKeys, database::DbPool};

use self::{
    am_admin::am_admin, login::login, register::register, users::users, who_am_i::who_am_i,
};

mod am_admin;
mod login;
mod register;
mod users;
mod who_am_i;

pub fn auth_router<T>() -> Router<T>
where
    AuthKeys: FromRef<T>,
    DbPool: FromRef<T>,
    T: 'static + Send + Sync + Clone,
{
    Router::new()
        .route("/register", post(register))
        .route("/login", post(login))
        .route("/who-am-i", get(who_am_i))
        .route("/am-admin", get(am_admin))
        .route("/users", get(users))
}
