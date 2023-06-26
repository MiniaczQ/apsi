use axum::{
    extract::{FromRef, Path},
    http::StatusCode,
    routing::post,
    Router,
};
use s3::Bucket;
use tracing::error;
use uuid::Uuid;

use crate::{
    models::{role::DocumentVersionRole, version_state::DocumentVersionState, event::EventType},
    services::{
        auth::{auth_keys::AuthKeys, claims::Claims},
        database::{
            repositories::{documents::DocumentsRepository, permission::PermissionRepository, events::EventsRepository},
            DbPool,
        },
        util::Res2,
    },
};

async fn change_state(
    documents_repository: DocumentsRepository,
    permission_repository: PermissionRepository,
    event_repository: EventsRepository,
    claims: Claims,
    Path((document_id, version_id, new_state)): Path<(Uuid, Uuid, DocumentVersionState)>,
) -> Res2 {
    let required_roles = match new_state {
        DocumentVersionState::InProgress => {
            vec![DocumentVersionRole::Owner, DocumentVersionRole::Editor]
        }
        DocumentVersionState::ReadyForReview => {
            vec![DocumentVersionRole::Owner, DocumentVersionRole::Editor]
        }
        DocumentVersionState::Reviewed => vec![DocumentVersionRole::Reviewer],
        DocumentVersionState::Published => {
            vec![DocumentVersionRole::Owner]
        }
    };
    match permission_repository
        .does_user_have_document_version_roles(
            claims.user_id,
            document_id,
            version_id,
            &required_roles,
        )
        .await
    {
        Ok(true) => {}
        Ok(false) => {
            return Res2::Msg((
                StatusCode::BAD_REQUEST,
                "User does not have permission to perform this state change",
            ));
        }
        Err(error) => {
            error!(
                { error = error.to_string() },
                "Error when checking permission for changing state"
            );
            return Res2::NoMsg(StatusCode::INTERNAL_SERVER_ERROR);
        }
    }
    match documents_repository
        .change_state(document_id, version_id, new_state)
        .await
    {
        Ok(true) => {event_repository.create_event(document_id, version_id, claims.user_id, EventType::StatusChange(new_state)).await.ok(); Res2::NoMsg(StatusCode::OK)},
        Ok(false) => Res2::Msg((
            StatusCode::BAD_REQUEST,
            "Version could not be updated to desired state from current state",
        )),
        Err(error) => {
            error!({ error = error.to_string() }, "Error when changing state");
            Res2::NoMsg(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub fn states_router<T>() -> Router<T>
where
    AuthKeys: FromRef<T>,
    DbPool: FromRef<T>,
    Bucket: FromRef<T>,
    T: 'static + Send + Sync + Clone,
{
    Router::new().route(
        "/:document_id/:version_id/change-state/:state",
        post(change_state),
    )
}
