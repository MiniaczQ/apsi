use std::net::SocketAddr;

use config::{Environment, File, FileFormat};
use serde::Deserialize;

use crate::services::database::config::PostgresConfig;

use super::{auth::auth_keys::AuthKeysConfig, s3storage::S3Config, tracing::TracingConfig};

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub webserver: WebserverConfig,
    pub tracing: TracingConfig,
    pub auth_keys: AuthKeysConfig,
    pub database: PostgresConfig,
    pub s3storage: S3Config,
}

#[derive(Debug, Clone, Deserialize)]
pub struct WebserverConfig {
    pub url: SocketAddr,
    pub cors: bool,
}

pub fn setup_config() -> Config {
    config::Config::builder()
        .add_source(File::with_name("config/app.json").format(FileFormat::Json))
        .add_source(Environment::default().separator("__"))
        .build()
        .expect("Failed to load configuration")
        .try_deserialize::<Config>()
        .expect("Failed to deserialize configuration")
}
