CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salt UUID DEFAULT gen_random_uuid(),
    username varchar(255) UNIQUE NOT NULL,
    password_hash char(64) NOT NULL
);

CREATE TABLE documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_name varchar(255) NOT NULL
);

CREATE TABLE document_versions (
    document_id UUID NOT NULL,
    version_id UUID DEFAULT gen_random_uuid(),
    version_name varchar(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    content varchar(8388608) DEFAULT '',
    PRIMARY KEY(document_id, version_id),
    UNIQUE(document_id, version_name),
    CONSTRAINT fk_document FOREIGN KEY(document_id) REFERENCES documents(document_id)
);
