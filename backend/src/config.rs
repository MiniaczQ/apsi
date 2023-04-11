//! Configuration loading

use std::net::SocketAddr;

use config::{Config, Environment, File, FileFormat};
use serde::Deserialize;

use crate::{
    database::config::PostgresConfig,
    routing::api::auth::authorization_keys::AuthorizationKeysConfig,
};

// Automatic trait implementations
#[derive(Debug, Deserialize)]
pub struct AppConfig {
    // Built-in type for IPv4 and IPv6 + ports
    pub url: SocketAddr,
    pub cors: bool,
    pub authorization_keys: AuthorizationKeysConfig,
    pub database: PostgresConfig,
}

pub fn get_config() -> AppConfig {
    // Setup config
    Config::builder()
        // Non-optional (implicit) config file with (explicit) JSON format
        .add_source(File::with_name("config/webserver.json").format(FileFormat::Json))
        // Config from environment, with hierarchy separator `__` and no prefix
        .add_source(Environment::default().separator("__"))
        .build()
        // Lazy error handling, still good error messages, just not something we can 'handle'
        // Will appear a lot
        // No proper error handling for now
        .unwrap()
        // Try to turn into a strongly typed structure
        .try_deserialize::<AppConfig>()
        .unwrap()
}
