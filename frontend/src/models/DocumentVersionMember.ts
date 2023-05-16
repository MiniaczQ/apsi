export type DocumentVersionMemberRole = 'owner' | 'viewer' | 'editor' | 'reviewer';

export type DocumentVersionMember = {
    userId: string,
    username: string,
    roles: DocumentVersionMemberRole[]
};

export default DocumentVersionMember;
