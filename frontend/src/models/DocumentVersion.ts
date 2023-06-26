export type DocumentVersionState = 'inProgress' | 'readyForReview' | 'reviewed' | 'published';
export type DocumentVersionStateMap<Type> = {
    [key in DocumentVersionState]: Type;
};

export type DocumentVersion = {
    documentId: string,
    versionId: string,
    versionName: string,
    createdAt: string,
    content: string,
    versionState: DocumentVersionState,
    children: string[],
    parents: string[],
    updatedAt: string,
};

export default DocumentVersion;
