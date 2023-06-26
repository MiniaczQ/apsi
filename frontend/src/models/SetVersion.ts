export type SetVersion = {
    documentSetId: string,
    setVersionId: string,
    SetVersionName: string,
    createdAt: string,
    documentVersionIds: string[][],
    children: string[],
    parents: string[],
    
};
export default SetVersion;