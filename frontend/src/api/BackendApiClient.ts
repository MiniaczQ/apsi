import ApiClient from "./ApiClient";
import AuthResponse from "../models/AuthResponse";
import CreateDocument from "../models/CreateDocument";
import CreateVersion from "../models/CreateVersion";
import DocFile from "../models/DocFile";
import Document from "../models/Document";
import DocumentVersion from "../models/DocumentVersion";
import DocumentVersionMember, { DocumentVersionMemberRole } from "../models/DocumentVersionMember";
import { LoginState } from "../App";
import UpdateVersion from "../models/UpdateVersion";
import UpdateDocument from "../models/UpdateDocument";
import User from "../models/User";
import DocumentWithInitialVersion from "../models/DocumentWithInitialVersion";
import { Notification } from "../models/Notification"

class BackendApiClient implements ApiClient {
  private apiBaseUrl: string;
  private loginState: LoginState;

  private baseRequestOptions: RequestInit = {
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
  };

  private addMethodToRequestOptions = (options: RequestInit, method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE') => ({
    ...options,
    method,
  }) as RequestInit;

  private addJsonBodyToRequestOptions = (options: RequestInit, data: any) => ({
    ...options,
    body: JSON.stringify(data),
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
    },
  }) as RequestInit;

  private addFormBodyToRequestOptions = (options: RequestInit, data: FormData) => ({
    ...options,
    body: data,
  }) as RequestInit;

  private addCredentialsToRequestOptions = (options: RequestInit, authenticated: boolean) => {
    if (!authenticated)
      return options;
    if (this.loginState.token === undefined)
      throw new Error('Not authenticated');
    return {
      ...options,
      headers: {
        ...(options.headers ?? {}),
        'Authorization': `Bearer ${this.loginState.token}`,
      },
    } as RequestInit;
  }

  private post = async (relPath: string, data: any, authenticated = true, returnBody = true) => {
    let postReqOptions = this.addMethodToRequestOptions(this.baseRequestOptions, 'POST');
    postReqOptions = this.addJsonBodyToRequestOptions(postReqOptions, data);
    postReqOptions = this.addCredentialsToRequestOptions(postReqOptions, authenticated);
    const response = await fetch(new URL(relPath, this.apiBaseUrl), postReqOptions);
    if (returnBody)
      return await response.json();
  };

  private sendFile = async (relPath: string, data: File, authenticated = true, returnBody = true) => {
    let form = new FormData();
    form.append('file', data)
    let reqOptions = this.addMethodToRequestOptions(this.baseRequestOptions, 'PATCH');
    reqOptions = this.addFormBodyToRequestOptions(reqOptions, form);
    reqOptions = this.addCredentialsToRequestOptions(reqOptions, authenticated);
    const response = await fetch(new URL(relPath, this.apiBaseUrl), reqOptions);
    if (returnBody)
      return await response.json();
  };

  private patch = async (relPath: string, data: any, authenticated = true, returnBody = true) => {
    let postReqOptions = this.addMethodToRequestOptions(this.baseRequestOptions, 'PATCH');
    postReqOptions = this.addJsonBodyToRequestOptions(postReqOptions, data);
    postReqOptions = this.addCredentialsToRequestOptions(postReqOptions, authenticated);
    const response = await fetch(new URL(relPath, this.apiBaseUrl), postReqOptions);
    if (returnBody)
      return await response.json();
  };

  private delete = async (relPath: string, authenticated = true, returnBody = false) => {
    let postReqOptions = this.addMethodToRequestOptions(this.baseRequestOptions, 'DELETE');
    postReqOptions = this.addCredentialsToRequestOptions(postReqOptions, authenticated);
    const response = await fetch(new URL(relPath, this.apiBaseUrl), postReqOptions);
    if (returnBody)
      return await response.json();
  };

  private get = async (relPath: string, authenticated = true, returnBody: 'JSON' | 'BLOB' | false = 'JSON') => {
    const getReqOptions = this.addCredentialsToRequestOptions(this.baseRequestOptions, authenticated);
    const response = await fetch(new URL(relPath, this.apiBaseUrl), getReqOptions);
    if (returnBody === 'JSON')
      return await response.json();
    else if (returnBody === 'BLOB')
      return await response.blob();
  };

  register = async (username: string, password: string) => await this.post(
    'auth/register',
    { username, password },
    false,
    false
  );
  login = async (username: string, password: string) => {
    const authResponse = await this.post(
      'auth/login',
      { username, password },
      false
    ) as AuthResponse;
    this.loginState.setToken(authResponse.token);
  };
  logout = async () => this.loginState.setToken(undefined);
  getUsers = async () => await this.get(
    'auth/users'
  ) as User[];

  getDocuments = async () => await this.get(
    'documents/documents'
  ) as Document[];
  createDocument = async (data: CreateDocument) => await this.post(
    `documents`,
    data
  ) as DocumentWithInitialVersion;
  getDocument = async (documentId: string) => await this.get(
    `documents/${documentId}`
  ) as Document;
  updateDocument = async (documentId: string, data: UpdateDocument) => await this.patch(
    `documents/${documentId}`,
    data,
    true,
    false
  );
  deleteDocument = async (documentId: string) => await this.delete(
    `documents/${documentId}`
  );

  getVersions = async (documentId: string) => await this.get(
    `documents/${documentId}/versions`
  ) as DocumentVersion[];
  createVersion = async (documentId: string, data: CreateVersion) => await this.post(
    `documents/${documentId}`,
    data,
  );
  getVersion = async (documentId: string, versionId: string) => await this.get(
    `documents/${documentId}/${versionId}`
  ) as DocumentVersion;
  updateVersion = async (documentId: string, versionId: string, data: UpdateVersion) => await this.patch(
    `documents/${documentId}/${versionId}`,
    data,
    true,
    false
  );
  deleteVersion = async (documentId: string, versionId: string) => await this.delete(
    `documents/${documentId}/${versionId}`
  );
  setVersionState = async (documentId: string, versionId: string, state: string) => await this.post(
    `documents/${documentId}/${versionId}/change-state/${state}`,
    '',
    true,
    false
  );
  getVersionMembers = async (documentId: string, versionId: string) => await this.get(
    `documents/${documentId}/${versionId}/members`
  ) as DocumentVersionMember[];

  getFiles = async (documentId: string, versionId: string) => await this.get(
    `documents/${documentId}/${versionId}/files`,
  ) as DocFile[];
  uploadFile = async (documentId: string, versionId: string, data: File) => await this.sendFile(
    `documents/${documentId}/${versionId}/files`,
    data,
  );
  getFile = async (documentId: string, versionId: string, fileId: string) => await this.get(
    `documents/${documentId}/${versionId}/files/${fileId}/content`,
    true,
    'BLOB'
  ) as Blob;
  deleteFile = async (documentId: string, versionId: string, fileId: string) => await this.delete(
    `documents/${documentId}/${versionId}/files/${fileId}`,
  );

  getMembers = async (documentId: string, versionId: string) => await this.get(
    `documents/${documentId}/${versionId}/members`,
  ) as DocumentVersionMember[];
  getMember = async (documentId: string, versionId: string) => await this.get(
    `documents/${documentId}/${versionId}/member`,
  ) as DocumentVersionMember;
  grantRole = async (documentId: string, versionId: string, userId: string, role: DocumentVersionMemberRole) => await this.post(
    `documents/${documentId}/${versionId}/grant/${userId}/${role}`,
    undefined,
    true,
    false,
  );
  revokeRole = async (documentId: string, versionId: string, userId: string, role: DocumentVersionMemberRole) => await this.post(
    `documents/${documentId}/${versionId}/revoke/${userId}/${role}`,
    undefined,
    true,
    false,
  );


  getNotifications = async(userId: string) => await Promise.resolve(
    [
      {
        notificationId: '1',
        userId: userId,
        action: 'role removed',
        version: {
          documentId: '1',
          versionId: '1',
          versionName: 'name',
          versionState: 'published'
        } as DocumentVersion,
        role: 'editor',
        read: false
      } as Notification,
      {
        notificationId: '2',
        userId: userId,
        action: 'new version',
        version: {
          documentId: '2',
          versionId: '2',
          versionName: 'name-2',
          versionState: 'inProgress'
        } as DocumentVersion,
        role: 'reviewer',
        read: true
      } as Notification
    ]
  )

// getNotifications = async(userId: string) => await this.get(`notifications/${userId}`) as Notification[];

  markAsRead = async (notificationId: string) => await Promise.resolve()
  
  // markAsRead = async (notificationId: string) => await this.post(
  //   `notifications/mark/${notificationId}`,
  //   undefined,
  //   true,
  //   false)

  

  constructor(url: string, loginState: LoginState) {
    if (url[url.length - 1] !== '/')
      url += '/';  // the trailing slash is important
    this.apiBaseUrl = url;
    this.loginState = loginState;
  }
}

export default BackendApiClient;
