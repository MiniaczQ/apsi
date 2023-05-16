import DocumentVersion from "./DocumentVersion";
import Document from "./Document";

type DocumentWithInitialVersion = {
    document: Document;
    initialVersion: DocumentVersion;
};

export default DocumentWithInitialVersion;
