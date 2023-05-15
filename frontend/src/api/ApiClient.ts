import CreateDocument from "../models/CreateDocument";
import CreateVersion from "../models/CreateVersion";
import Document from "../models/Document";
import DocumentVersion from "../models/DocumentVersion";
import UpdateDocument from "../models/UpdateDocument";
import UpdateVersion from "../models/UpdateVersion";

interface ApiClient {
    register: (username: string, password: string) => Promise<void>,
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;

    getDocuments: () => Promise<Document[]>;
    createDocument: (data: CreateDocument) => Promise<Document>;
    getDocument: (documentId: string) => Promise<Document>;
    updateDocument: (documentId: string, data: UpdateDocument) => Promise<void>;
    deleteDocument: (documentId: string) => Promise<void>;

    getVersions: (documentId: string) => Promise<DocumentVersion[]>;
    createVersion: (documentId: string, data: CreateVersion) => Promise<DocumentVersion>;
    getVersion: (documentId: string, versionId: string) => Promise<DocumentVersion>;
    updateVersion: (documentId: string, versionId: string, data: UpdateVersion) => Promise<void>;
    deleteVersion: (documentId: string, versionId: string) => Promise<void>;
};

export default ApiClient;
