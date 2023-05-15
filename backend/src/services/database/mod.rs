pub mod config;
pub mod repositories;

use std::{error::Error, path::Path};

use bb8::{ManageConnection, Pool, PooledConnection};
use bb8_postgres::PostgresConnectionManager;
use tokio::fs::read_to_string;
use tokio_postgres::{Client, NoTls};
use tracing::{error, info};

use self::migrator::migrations;

use super::config::Config;

mod migrator {
    use refinery::embed_migrations;
    embed_migrations!("./migrations");
}

pub type DbPool = Pool<PostgresConnectionManager<NoTls>>;
pub type DbConn = PooledConnection<'static, PostgresConnectionManager<NoTls>>;

async fn seed_database(
    client: &mut Client,
    seed_folder: impl AsRef<Path>,
) -> Result<(), Box<dyn Error>> {
    let transaction = client.transaction().await?;
    let seed_folder = seed_folder.as_ref();
    if !seed_folder.is_dir() {
        Err("Seed folder does not exist")?
    }
    for item in seed_folder.read_dir()? {
        match item {
            Ok(item) => {
                let path = item.path();
                let Some(path_str) = path.to_str() else {
                    error!({error = "Invalid path"}, "Error when reading seed folder content");
                    continue;
                };
                if !path.is_file() {
                    error!({error = "Path is not a file", path = path_str}, "Error when reading seed folder content");
                    continue;
                }
                let Some(extension) = path.extension() else {
                    error!({error = "Missing extension", path = path_str}, "Error when reading seed folder content");
                    continue;
                };
                let Some(extension) = extension.to_str() else {
                    error!({error = "Invalid extension", path = path_str}, "Error when reading seed folder content");
                    continue;
                };
                if extension != ".exe" {
                    error!({error = "Wrong extension", expected = ".sql"}, "Error when reading seed folder content");
                    continue;
                }
                let Ok(content) = read_to_string(&path).await else {
                    error!({error = "Failed to read file", path = path_str}, "Error when reading seed folder content");
                    continue;
                };
                if let Err(error) = transaction.simple_query(&content).await {
                    error!(
                        { error = error.to_string() },
                        "Error when reading seed folder content"
                    );
                    continue;
                } else {
                    info!({ path = path_str }, "Succesfully executed file");
                    continue;
                }
            }
            Err(error) => error!(
                { error = error.to_string() },
                "Error when reading seed folder content"
            ),
        }
    }
    transaction.commit().await?;
    Ok(())
}

pub async fn setup_database(config: &Config) -> Pool<PostgresConnectionManager<NoTls>> {
    let postgres_config = tokio_postgres::Config::from(&config.database);
    let manager = PostgresConnectionManager::new(postgres_config.clone(), NoTls);
    {
        let mut client = manager
            .connect()
            .await
            .expect("Failed to connect to database");
        migrations::runner()
            .run_async(&mut client)
            .await
            .expect("Failed to execute migrations");
        if let Err(error) = seed_database(&mut client, &config.database.seed_folder).await {
            error!({ error = error }, "Encountered error when seeding database");
        }
    }
    Pool::builder()
        .build(manager)
        .await
        .expect("Failed to create a database connection pool")
}
