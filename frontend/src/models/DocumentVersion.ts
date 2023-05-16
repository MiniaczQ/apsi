export type DocumentVersion = {
    documentId: string,
    versionId: string,
    versionName: string,
    createdAt: string,
    content: string,
    parents: string[],
    children: string[],
};

export default DocumentVersion;
