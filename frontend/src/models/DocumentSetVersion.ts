export type DocumentSetVersion = {
  documentSetId: string;
  setVersionId: string;
  setVersionName: string;
  createdAt: string;
  documentVersionIds: string[][];
  parents: string[];
  children: string[];
};

export default DocumentSetVersion;
