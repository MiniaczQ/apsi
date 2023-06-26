CREATE TABLE users_events (
    event_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    document_id UUID NOT NULL,
    version_id UUID NOT NULL,
    event_type INT NOT NULL,
    role_id smallint,
    state_id smallint,
    seen BOOLEAN NOT NULL DEFAULT FALSE,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fk__users_events__users FOREIGN KEY(user_id) REFERENCES users(user_id),
    CONSTRAINT fk__users_events__document_versions FOREIGN KEY(document_id, version_id) REFERENCES document_versions(document_id, version_id),
    CONSTRAINT fk__users_events__user_roles FOREIGN KEY(user_id, role_id) REFERENCES user_roles(user_id, role_id),
    CONSTRAINT fk__users_events__document_version_states FOREIGN KEY(state_id) REFERENCES document_version_states(state_id)
);
