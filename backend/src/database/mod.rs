pub mod config;
pub mod repositories;

use std::error::Error;

use bb8::{ManageConnection, Pool, PooledConnection};
use bb8_postgres::PostgresConnectionManager;
use tokio_postgres::NoTls;

use crate::config::AppConfig;

use self::migrator::migrations;

mod migrator {
    use refinery::embed_migrations;
    embed_migrations!("./migrations");
}

pub type DbPool = Pool<PostgresConnectionManager<NoTls>>;
pub type DbConn = PooledConnection<'static, PostgresConnectionManager<NoTls>>;

pub async fn setup_database(
    config: &AppConfig,
) -> Result<Pool<PostgresConnectionManager<NoTls>>, Box<dyn Error>> {
    let config = tokio_postgres::Config::from(&config.database);
    let manager = PostgresConnectionManager::new(config.clone(), NoTls);
    {
        let mut client = manager.connect().await?;
        migrations::runner().run_async(&mut client).await?;
    }
    let pool = Pool::builder().build(manager).await?;
    Ok(pool)
}
