use std::time::Duration;

use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct PostgresConfig {
    user: String,
    password: String,
    dbname: String,
    host: String,
    port: u16,
}

impl From<&PostgresConfig> for tokio_postgres::Config {
    fn from(value: &PostgresConfig) -> Self {
        let mut this = Self::new();
        this.user(&value.user);
        this.password(&value.password);
        this.dbname(&value.dbname);
        this.host(&value.host);
        this.port(value.port);
        this.connect_timeout(Duration::from_secs(5));
        this
    }
}
