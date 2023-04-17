use s3::{creds::Credentials, Bucket, Region};
use serde::Deserialize;

use super::config::Config;

pub async fn setup_s3storage(config: &Config) -> Bucket {
    let config = config.s3storage.clone();
    let bucket = Bucket::new(
        &config.bucket_name,
        Region::Custom {
            region: config.region_name,
            endpoint: config.region_endpoint,
        },
        Credentials::new(
            Some(&config.access_key),
            Some(&config.secret_key),
            None,
            None,
            None,
        )
        .expect("Invalid S3 credentials"),
    )
    .expect("Invalid bucket")
    .with_path_style();
    bucket
        .list_page("".to_owned(), None, None, None, Some(0))
        .await
        .expect("Could not reach S3");
    bucket
}

#[derive(Debug, Clone, Deserialize)]
pub struct S3Config {
    bucket_name: String,
    region_name: String,
    region_endpoint: String,
    access_key: String,
    secret_key: String,
}
