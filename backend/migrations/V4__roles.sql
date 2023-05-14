CREATE TABLE roles (
    role_id smallserial PRIMARY KEY,
    role_name varchar(255) NOT NULL UNIQUE
);

INSERT INTO roles VALUES (0, "Admin");
INSERT INTO users VALUES ("81721217-8f19-4c3b-8b25-a2af68875018", "8ce53b43-a248-4abf-a76e-d79d21a820cf", "admin", "34a5da8d86e760f40fdad550e0f3713952b96a63f78b618b56beb5df3049f4e7");

CREATE TABLE user_roles (
    user_id UUID NOT NULL,
    role_id smallserial NOT NULL,
    PRIMARY KEY(user_id, role_id),
    CONSTRAINT fk__user_roles__user FOREIGN KEY(user_id) REFERENCES users(user_id)
);

INSERT INTO user_roles VALUES ("81721217-8f19-4c3b-8b25-a2af68875018", 0);

CREATE TABLE document_version_roles (
    role_id smallserial PRIMARY KEY,
    role_name varchar(255) NOT NULL UNIQUE
);

INSERT INTO roles VALUES (0, "Owner"), (1, "Viewer"), (2, "Editor"), (3, "Reviewer");

CREATE TABLE user_document_version_roles (
    user_id UUID NOT NULL,
    document_id UUID NOT NULL,
    version_id UUID NOT NULL,
    role_id smallserial NOT NULL,
    PRIMARY KEY(user_id, document_id, version_id, role_id),
    CONSTRAINT fk__user_document_version_roles__users FOREIGN KEY(user_id) REFERENCES users(user_id),
    CONSTRAINT fk__user_document_version_roles__document_versions FOREIGN KEY(document_id, version_id) REFERENCES document_versions(document_id, version_id)
);
