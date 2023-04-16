pub mod config;
pub mod repositories;

use bb8::{ManageConnection, Pool, PooledConnection};
use bb8_postgres::PostgresConnectionManager;
use tokio_postgres::NoTls;

use self::migrator::migrations;

use super::config::Config;

mod migrator {
    use refinery::embed_migrations;
    embed_migrations!("./migrations");
}

pub type DbPool = Pool<PostgresConnectionManager<NoTls>>;
pub type DbConn = PooledConnection<'static, PostgresConnectionManager<NoTls>>;

pub async fn setup_database(config: &Config) -> Pool<PostgresConnectionManager<NoTls>> {
    let config = tokio_postgres::Config::from(&config.database);
    let manager = PostgresConnectionManager::new(config.clone(), NoTls);
    {
        let mut client = manager
            .connect()
            .await
            .expect("Failed to connect to database");
        migrations::runner()
            .run_async(&mut client)
            .await
            .expect("Failed to execute migrations");
    }
    Pool::builder()
        .build(manager)
        .await
        .expect("Failed to create a database connection pool")
}
