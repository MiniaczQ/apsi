import CreateDocument from "../models/CreateDocument";
import CreateVersion from "../models/CreateVersion";
import DocFile from "../models/DocFile";
import Document from "../models/Document";
import DocumentVersion from "../models/DocumentVersion";
import DocumentVersionMember, { DocumentVersionMemberRole } from "../models/DocumentVersionMember";
import DocumentWithInitialVersion from "../models/DocumentWithInitialVersion";
import UpdateDocument from "../models/UpdateDocument";
import UpdateVersion from "../models/UpdateVersion";
import User from "../models/User";
import {Notification} from "../models/Notification";

interface ApiClient {
    register: (username: string, password: string) => Promise<void>,
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    getUsers: () => Promise<User[]>;

    getDocuments: () => Promise<Document[]>;
    createDocument: (data: CreateDocument) => Promise<DocumentWithInitialVersion>;
    getDocument: (documentId: string) => Promise<Document>;
    updateDocument: (documentId: string, data: UpdateDocument) => Promise<void>;
    deleteDocument: (documentId: string) => Promise<void>;

    getVersions: (documentId: string) => Promise<DocumentVersion[]>;
    createVersion: (documentId: string, data: CreateVersion) => Promise<DocumentVersion>;
    getVersion: (documentId: string, versionId: string) => Promise<DocumentVersion>;
    updateVersion: (documentId: string, versionId: string, data: UpdateVersion) => Promise<void>;
    deleteVersion: (documentId: string, versionId: string) => Promise<void>;
    setVersionState: (documentId: string, versionId: string, state: string) => Promise<void>;
    getVersionMembers: (documentId: string, versionId: string) => Promise<DocumentVersionMember[]>;

    getFiles: (documentId: string, versionId: string) => Promise<DocFile[]>;
    uploadFile: (documentId: string, versionId: string, data: File) => Promise<void>;
    getFile: (documentId: string, versionId: string, fileId: string) => Promise<Blob>;
    deleteFile: (documentId: string, versionId: string, fileId: string) => Promise<void>;

    grantRole: (documentId: string, versionId: string, userId: string, role: DocumentVersionMemberRole) => Promise<void>;
    revokeRole: (documentId: string, versionId: string, userId: string, role: DocumentVersionMemberRole) => Promise<void>;
    getMembers: (documentId: string, versionId: string) => Promise<DocumentVersionMember[]>;
    getMember: (documentId: string, versionId: string) => Promise<DocumentVersionMember>;

    createNotification: (notification: Notification) => Promise<void>;
    getNotifications: (userId: string) => Promise<Notification[]>;
    markAsRead: (notificationId: string) => Promise<void>;
};

export default ApiClient;
