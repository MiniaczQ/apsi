use axum::{
    extract::{FromRef, Path},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use s3::Bucket;
use tracing::error;
use uuid::Uuid;

use crate::{
    models::document::{CreateDocumentRequest, Document, DocumentWithInitialVersion},
    services::{
        auth::{auth_keys::AuthKeys, claims::Claims},
        database::{
            repositories::documents::{DocumentsRepository, RepoError},
            DbPool,
        },
        util::ValidatedJson,
    },
};

async fn create_document(
    mut documents_repository: DocumentsRepository,
    claims: Claims,
    ValidatedJson(data): ValidatedJson<CreateDocumentRequest>,
) -> Result<Json<DocumentWithInitialVersion>, StatusCode> {
    let document = documents_repository
        .create_document(
            data.document_name,
            claims.user_id,
            data.initial_version.version_name,
            data.initial_version.content,
        )
        .await
        .map_err(|e| {
            error!("{}", e);
            StatusCode::BAD_REQUEST
        })?;
    Ok(Json(document))
}

async fn get_document(
    documents_repository: DocumentsRepository,
    claims: Claims,
    Path(document_id): Path<Uuid>,
) -> Result<Json<Document>, StatusCode> {
    match documents_repository
        .get_document(claims.user_id, document_id)
        .await
    {
        Ok(document) => Ok(Json(document)),
        Err(RepoError::Forbidden) => Err(StatusCode::FORBIDDEN),
        Err(error) => {
            error!("{}", error);
            Err(StatusCode::BAD_REQUEST)
        }
    }
}

async fn get_documents(
    documents_repository: DocumentsRepository,
    claims: Claims,
) -> Result<Json<Vec<Document>>, StatusCode> {
    match documents_repository.get_documents(claims.user_id).await {
        Ok(documents) => Ok(Json(documents)),
        Err(error) => {
            error!("{}", error);
            Err(StatusCode::BAD_REQUEST)
        }
    }
}

pub fn documents_router<T>() -> Router<T>
where
    AuthKeys: FromRef<T>,
    DbPool: FromRef<T>,
    Bucket: FromRef<T>,
    T: 'static + Send + Sync + Clone,
{
    Router::new()
        .route("/", post(create_document))
        .route("/documents", get(get_documents))
        .route("/:document_id", get(get_document))
}
