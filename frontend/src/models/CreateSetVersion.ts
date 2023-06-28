export type CreateSetVersion = {
  setVersionName: string;
  documentVersionIds: [string, string][];
  parents: string[];
};
export default CreateSetVersion;
