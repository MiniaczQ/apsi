export type DocumentVersionSet = {
  documentSetId: string;
  setVersionId: string;
  setVersionName: string;
  createdAt: string;
  documentVersionIds: string[][];
  parents: string[];
  children: string[];
};

export default DocumentVersionSet;
