export type DocumentVersionSet = {
    documentSetId: string,
    setVersionId: string,
    setVersionName: string,
    createdAt: string,
    parents: string[],
    children: string[],
};

export default DocumentVersionSet;
