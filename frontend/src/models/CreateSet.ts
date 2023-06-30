export type CreateSet = {
  documentSetName: string;
  initialVersion: {
    setVersionName: string;
    documentVersionIds: [string, string][];
  };
};

export default CreateSet;
