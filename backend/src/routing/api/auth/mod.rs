use axum::{extract::FromRef, routing::get, Router};

use self::{authorization_keys::AuthorizationKeys, authorize::authorize, who_am_i::who_am_i};

pub mod authorization_keys;
mod authorize;
pub mod claims;
mod error;
mod who_am_i;

pub fn auth_router<T>() -> Router<T>
where
    AuthorizationKeys: FromRef<T>,
    T: 'static + Send + Sync + Clone,
{
    Router::new()
        .route("authorize", get(authorize))
        .route("who-am-i", get(who_am_i))
}
