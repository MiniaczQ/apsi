use axum::{
    debug_handler,
    extract::{FromRef, Path},
    http::StatusCode,
    routing::post,
    Json, Router,
};
use s3::Bucket;
use tracing::error;
use uuid::Uuid;

use crate::{
    models::{
        event::EventType,
        role::DocumentVersionRole,
        version::DocumentVersion,
        version_state::{DocumentVersionState, VersionChangeState},
    },
    services::{
        auth::{auth_keys::AuthKeys, claims::Claims},
        database::{
            repositories::{
                documents::{ConcurrencyError, DocumentsRepository},
                events::EventsRepository,
                permission::PermissionRepository,
            },
            DbPool,
        },
        state::AppState,
        util::Res3,
    },
};

#[debug_handler(state=AppState)]
async fn change_state(
    documents_repository: DocumentsRepository,
    permission_repository: PermissionRepository,
    event_repository: EventsRepository,
    claims: Claims,
    Path((document_id, version_id)): Path<(Uuid, Uuid)>,
    Json(data): Json<VersionChangeState>,
) -> Res3<DocumentVersion> {
    let required_roles = match data.new_state {
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
            return Res3::Msg((
                StatusCode::BAD_REQUEST,
                "User does not have permission to perform this state change",
            ));
        }
        Err(error) => {
            error!(
                { error = error.to_string() },
                "Error when checking permission for changing state"
            );
            return Res3::NoMsg(StatusCode::INTERNAL_SERVER_ERROR);
        }
    }
    match documents_repository
        .change_state(document_id, version_id, data.new_state, data.updated_at)
        .await
    {
        Ok(version) => {
            let users = permission_repository
                .get_document_version_users(document_id, version_id)
                .await
                .unwrap();
            for user in users {
                event_repository
                    .create_event(
                        document_id,
                        version_id,
                        user.user.user_id,
                        EventType::StatusChange(data.new_state),
                    )
                    .await
                    .ok();
            }
            Res3::Json((version, StatusCode::OK))
        }
        Err(ConcurrencyError::UniqueValueViolation(version)) => {
            Res3::Json((version, StatusCode::CONFLICT))
        }
        Err(ConcurrencyError::Failed) => Res3::Msg((
            StatusCode::BAD_REQUEST,
            "Version could not be updated to desired state from current state",
        )),
        Err(ConcurrencyError::Pg(error)) => {
            error!({ error = error.to_string() }, "Error when changing state");
            Res3::NoMsg(StatusCode::INTERNAL_SERVER_ERROR)
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
    Router::new().route("/:document_id/:version_id/change-state", post(change_state))
}
