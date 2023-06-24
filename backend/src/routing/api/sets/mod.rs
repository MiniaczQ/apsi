use axum::{
    extract::{FromRef, Path},
    http::StatusCode,
    routing::{delete, get, post},
    Json, Router,
};
use tracing::error;
use uuid::Uuid;

use crate::{
    models::{
        document_set::{CreateDocumentSet, DocumentSet, DocumentSetWithInitialVersion},
        set_version::{CreateSetVersionWithParents, SetVersion, UpdateSetVersion},
    },
    services::{
        auth::{auth_keys::AuthKeys, claims::Claims},
        database::{repositories::document_sets::DocumentSetsRepository, DbPool},
        util::ValidatedJson,
    },
};

async fn create_document_set(
    mut set_repository: DocumentSetsRepository,
    claims: Claims,
    ValidatedJson(data): ValidatedJson<CreateDocumentSet>,
) -> Result<Json<DocumentSetWithInitialVersion>, StatusCode> {
    let document_set = set_repository
        .create_document_set(
            claims.user_id,
            data.document_set_name,
            data.initial_version.set_version_name,
            data.initial_version.document_version_ids,
        )
        .await
        .map_err(|e| {
            error!("{}", e);
            StatusCode::BAD_REQUEST
        })?;
    Ok(Json(document_set))
}

async fn get_document_sets(
    set_repository: DocumentSetsRepository,
    claims: Claims,
) -> Result<Json<Vec<DocumentSet>>, StatusCode> {
    let document_sets = set_repository
        .get_document_sets(claims.user_id)
        .await
        .map_err(|e| {
            error!("{}", e);
            StatusCode::BAD_REQUEST
        })?;
    Ok(Json(document_sets))
}

async fn create_document_set_version(
    set_repository: DocumentSetsRepository,
    claims: Claims,
    Path(document_set_id): Path<Uuid>,
    ValidatedJson(data): ValidatedJson<CreateSetVersionWithParents>,
) -> Result<Json<SetVersion>, StatusCode> {
    let set_version = set_repository
        .create_document_set_version(
            claims.user_id,
            document_set_id,
            data.set_version_name,
            data.document_version_ids,
            data.parents,
        )
        .await
        .map_err(|e| {
            error!("{}", e);
            StatusCode::BAD_REQUEST
        })?;
    Ok(Json(set_version))
}

async fn get_document_set_versions(
    set_repository: DocumentSetsRepository,
    claims: Claims,
    Path(document_set_id): Path<Uuid>,
) -> Result<Json<Vec<SetVersion>>, StatusCode> {
    let set_versions = set_repository
        .get_document_set_versions(claims.user_id, document_set_id)
        .await
        .map_err(|e| {
            error!("{}", e);
            StatusCode::BAD_REQUEST
        })?;
    Ok(Json(set_versions))
}

async fn add_to_document_set_version(
    set_repository: DocumentSetsRepository,
    claims: Claims,
    Path((document_set_id, set_version_id)): Path<(Uuid, Uuid)>,
    Json(data): Json<UpdateSetVersion>,
) -> Result<StatusCode, StatusCode> {
    let added = set_repository
        .add_to_document_set_version(
            claims.user_id,
            document_set_id,
            set_version_id,
            data.document_id,
            data.version_id,
        )
        .await
        .map_err(|e| {
            error!("{}", e);
            StatusCode::BAD_REQUEST
        })?;
    Ok(match added {
        true => StatusCode::OK,
        false => StatusCode::NOT_FOUND,
    })
}

async fn remove_from_document_set_version(
    set_repository: DocumentSetsRepository,
    claims: Claims,
    Path((document_set_id, set_version_id)): Path<(Uuid, Uuid)>,
    Json(data): Json<UpdateSetVersion>,
) -> Result<StatusCode, StatusCode> {
    let removed = set_repository
        .remove_from_document_set_version(
            claims.user_id,
            document_set_id,
            set_version_id,
            data.document_id,
            data.version_id,
        )
        .await
        .map_err(|e| {
            error!("{}", e);
            StatusCode::BAD_REQUEST
        })?;
    Ok(match removed {
        true => StatusCode::OK,
        false => StatusCode::NOT_FOUND,
    })
}

pub fn document_sets_router<T>() -> Router<T>
where
    AuthKeys: FromRef<T>,
    DbPool: FromRef<T>,
    T: 'static + Send + Sync + Clone,
{
    Router::new()
        .route("/", post(create_document_set))
        .route("/sets", get(get_document_sets))
        .route("/:document_set_id", post(create_document_set_version))
        .route("/:document_set_id", get(get_document_set_versions))
        .route(
            "/:document_set_id/:set_version_id",
            post(add_to_document_set_version),
        )
        .route(
            "/:document_set_id/:set_version_id",
            delete(remove_from_document_set_version),
        )
}
