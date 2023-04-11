use std::{error::Error, fs::read, path::PathBuf};

use jsonwebtoken::{DecodingKey, EncodingKey};
use serde::Deserialize;

/// Paths to the keys
#[derive(Debug, Deserialize)]
pub struct AuthorizationKeysConfig {
    pub encoding: PathBuf,
    pub decoding: PathBuf,
}

/// Keys for signing and verifying JWT tokens
#[derive(Clone)]
pub struct AuthorizationKeys {
    pub encoding: EncodingKey,
    pub decoding: DecodingKey,
}

impl TryFrom<&AuthorizationKeysConfig> for AuthorizationKeys {
    type Error = Box<dyn Error>;

    fn try_from(value: &AuthorizationKeysConfig) -> Result<Self, Self::Error> {
        let encoding = EncodingKey::from_rsa_pem(&read(&value.encoding)?)?;
        let decoding = DecodingKey::from_rsa_pem(&read(&value.decoding)?)?;
        Ok(Self { encoding, decoding })
    }
}
