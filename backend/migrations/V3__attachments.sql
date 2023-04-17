CREATE TABLE files (
    file_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name varchar(255) NOT NULL,
    file_hash char(64) UNIQUE NOT NULL
);

CREATE TABLE file_attachments (
    document_id UUID NOT NULL,
    version_id UUID NOT NULL,
    file_id UUID NOT NULL,
    PRIMARY KEY(document_id, version_id, file_id)
);
