use std::{
    error::Error,
    fmt::{Debug, Display},
};

pub mod comments;
pub mod document_sets;
pub mod documents;
pub mod events;
pub mod files;
pub mod permission;
pub mod users;

#[derive(Debug)]
pub enum RepoError {
    Forbidden,
    Database(Box<dyn Error>),
    Unreachable,
}

impl Display for RepoError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RepoError::Forbidden => f.write_str("Unauthorized"),
            RepoError::Database(error) => Display::fmt(error, f),
            RepoError::Unreachable => {
                f.write_str("Why isn't it possible? It's just not. Why not, you stupid bastard?")
            }
        }
    }
}

impl Error for RepoError {}

impl From<tokio_postgres::Error> for RepoError {
    fn from(value: tokio_postgres::Error) -> Self {
        Self::Database(Box::new(value))
    }
}
