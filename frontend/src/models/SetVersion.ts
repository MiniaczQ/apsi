export type SetVersion = {
  documentSetId: string;
  setVersionId: string;
  setVersionName: string;
  createdAt: string;
  documentVersionIds: string[][];
  children: string[];
  parents: string[];
};
export default SetVersion;
