export type CreateDocument = {
  documentName: string;
  initialVersion: {
    versionName: string;
    content: string;
  };
};

export default CreateDocument;
