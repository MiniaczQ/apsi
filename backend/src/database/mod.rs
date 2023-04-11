pub mod config;

use bb8::Pool;
use bb8_postgres::PostgresConnectionManager;
use tokio_postgres::NoTls;

use crate::config::AppConfig;

pub async fn postgres_connection_pool(
    config: &AppConfig,
) -> Result<Pool<PostgresConnectionManager<NoTls>>, tokio_postgres::Error> {
    let manager = PostgresConnectionManager::new((&config.database).into(), NoTls);
    Pool::builder().build(manager).await
}
