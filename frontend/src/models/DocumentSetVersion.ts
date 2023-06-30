export type DocumentSetVersion = {
  documentSetId: string;
  setVersionId: string;
  setVersionName: string;
  createdAt: string;
  documentVersionIds: [string, string][];
  parents: string[];
  children: string[];
};

export default DocumentSetVersion;
