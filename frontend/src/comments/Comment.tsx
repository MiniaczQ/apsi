import DocumentVersionMember from '../models/DocumentVersionMember';

export type Comment = {
    documentId: string,
    versionId: string,
    userRoles: DocumentVersionMember,
    content: string,
    createdAt: string
}

export default Comment;