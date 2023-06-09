import CreateDocument from '../models/CreateDocument';
import CreateVersion from '../models/CreateVersion';
import DocFile from '../models/DocFile';
import Document from '../models/Document';
import DocumentVersion from '../models/DocumentVersion';
import DocumentVersionMember, { DocumentVersionMemberRole } from '../models/DocumentVersionMember';
import DocumentWithInitialVersion from '../models/DocumentWithInitialVersion';
import UpdateDocument from '../models/UpdateDocument';
import UpdateVersion from '../models/UpdateVersion';
import User from '../models/User';
import Comment from '../models/Comment';
import CreateComment from '../models/CreateComment';
import { Notification } from '../models/Notification';
import ChangeVersionState from '../models/ChangeVersionState';

import CreateSet from '../models/CreateSet';
import DocumentSetWithInitialVersion from '../models/DocumentSetWithInitialVersion';
import CreateSetVersion from '../models/CreateSetVersion';

import DocumentSet from '../models/DocumentSet';
import DocumentSetVersion from '../models/DocumentSetVersion';
import SetDocumentVersion from '../models/SetDocumentVersion';

export class ApiError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ConcurrencyConflict extends ApiError {
  readonly value?: any;

  constructor(value?: any) {
    super(value !== undefined ? 'The object has been modified concurrently' : 'The identifier had been taken up');
    this.name = 'ConcurrencyConflict';
    this.value = value;
  }
}

export class AuthenticationError extends ApiError {
  constructor(message?: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class PermissionError extends ApiError {
  constructor(message?: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

interface ApiClient {
  register: (username: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getUsers: () => Promise<User[]>;

  getDocuments: () => Promise<Document[]>;
  createDocument: (data: CreateDocument) => Promise<DocumentWithInitialVersion>;
  getDocument: (documentId: string) => Promise<Document>;
  updateDocument: (documentId: string, data: UpdateDocument) => Promise<void>;

  getVersions: (documentId: string) => Promise<DocumentVersion[]>;
  createVersion: (documentId: string, data: CreateVersion) => Promise<DocumentVersion>;
  getVersion: (documentId: string, versionId: string) => Promise<DocumentVersion>;
  updateVersion: (documentId: string, versionId: string, data: UpdateVersion) => Promise<void>;
  setVersionState: (documentId: string, versionId: string, state: ChangeVersionState) => Promise<DocumentVersion>;
  getVersionMembers: (documentId: string, versionId: string) => Promise<DocumentVersionMember[]>;

  getFiles: (documentId: string, versionId: string) => Promise<DocFile[]>;
  uploadFile: (documentId: string, versionId: string, data: File) => Promise<void>;
  getFile: (documentId: string, versionId: string, fileId: string) => Promise<Blob>;
  deleteFile: (documentId: string, versionId: string, fileId: string) => Promise<void>;

  grantRole: (documentId: string, versionId: string, userId: string, role: DocumentVersionMemberRole) => Promise<void>;
  revokeRole: (documentId: string, versionId: string, userId: string, role: DocumentVersionMemberRole) => Promise<void>;
  getMembers: (documentId: string, versionId: string) => Promise<DocumentVersionMember[]>;
  getMember: (documentId: string, versionId: string) => Promise<DocumentVersionMember>;

  getNotifications: () => Promise<Notification[]>;
  markAsRead: (notificationId: string) => Promise<void>;

  createComment: (documentId: string, versionId: string, comment: CreateComment) => Promise<Comment>;
  loadComments: (documentId: string, versionId: string) => Promise<Comment[]>;

  getSets: () => Promise<DocumentSet[]>;
  getSet: (documentSetId: string) => Promise<DocumentSet>;
  createSet: (data: CreateSet) => Promise<DocumentSetWithInitialVersion>;
  getSetVersions: (documentSetId: string) => Promise<DocumentSetVersion[]>;
  createSetVersion: (documentSetId: string, data: CreateSetVersion) => Promise<DocumentSetVersion>;
  addDocumentToSetVersion: (documentSetId: string, setVersionId: string, data: SetDocumentVersion) => Promise<void>;
  removeDocumentFromSetVersion: (documentSetId: string, setVersionId: string, documentId: string) => Promise<void>;
}

export default ApiClient;
