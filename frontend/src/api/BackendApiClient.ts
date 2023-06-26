import ApiClient, { ApiError, AuthenticationError, ConcurrencyConflict, PermissionError } from "./ApiClient";
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
import Comment from '../models/Comment';
import CreateComment from '../models/CreateComment';
import { Notification } from "../models/Notification";

type BackendError = {
  error: string;
};


class BackendApiClient implements ApiClient {
  private apiBaseUrl: string;
  private loginState: LoginState;
  private authenticationErrorHandler?: (message: string) => void;

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

  private fetchThrowing = async (input: RequestInfo | URL, options?: RequestInit) => {
    const response = await fetch(input, options);
    if (response.ok)
      return response;
    const jsonResponse = response.headers.get('content-type')?.startsWith('application/json') === true
      ? await response.json()
      : undefined;
    const textResponse = response.headers.get('content-type')?.startsWith('text/plain') === true
        ? await response.text()
        : undefined;
    const errorResponse = (jsonResponse as BackendError)?.error
      ?? textResponse
      ?? (jsonResponse !== undefined ? JSON.stringify(jsonResponse) : undefined);
    switch (response.status) {
      case 401:
        this.authenticationErrorHandler?.(errorResponse);
        throw new AuthenticationError(errorResponse);
      case 403:
        throw new PermissionError(errorResponse);
      case 409:
        throw new ConcurrencyConflict(jsonResponse);
      default:
        throw new ApiError(response.statusText + (errorResponse !== undefined ? `: ${errorResponse}` : ''));
    }
  };

  private async post<TResponse>(relPath: string, data: any, authenticated?: boolean, returnBody?: true): Promise<TResponse>;
  private async post(relPath: string, data: any, authenticated: boolean, returnBody: false): Promise<undefined>;
  private async post<TResponse>(relPath: string, data: any, authenticated = true, returnBody = true) {
    let postReqOptions = this.addMethodToRequestOptions(this.baseRequestOptions, 'POST');
    postReqOptions = this.addJsonBodyToRequestOptions(postReqOptions, data);
    postReqOptions = this.addCredentialsToRequestOptions(postReqOptions, authenticated);
    const response = await this.fetchThrowing(new URL(relPath, this.apiBaseUrl), postReqOptions);
    if (returnBody)
      return await response.json() as TResponse;
  };

  private async sendFile<TResponse>(relPath: string, data: File, authenticated?: boolean, returnBody?: true): Promise<TResponse>;
  private async sendFile(relPath: string, data: File, authenticated: boolean, returnBody: false): Promise<undefined>;
  private async sendFile<TResponse>(relPath: string, data: File, authenticated = true, returnBody = true) {
    let form = new FormData();
    form.append('file', data)
    let reqOptions = this.addMethodToRequestOptions(this.baseRequestOptions, 'PATCH');
    reqOptions = this.addFormBodyToRequestOptions(reqOptions, form);
    reqOptions = this.addCredentialsToRequestOptions(reqOptions, authenticated);
    const response = await this.fetchThrowing(new URL(relPath, this.apiBaseUrl), reqOptions);
    if (returnBody)
      return await response.json() as TResponse;
  };

  private async patch<TResponse>(relPath: string, data: any, authenticated?: boolean, returnBody?: true): Promise<TResponse>;
  private async patch(relPath: string, data: any, authenticated: boolean, returnBody: false): Promise<undefined>;
  private async patch<TResponse>(relPath: string, data: any, authenticated = true, returnBody = true) {
    let postReqOptions = this.addMethodToRequestOptions(this.baseRequestOptions, 'PATCH');
    postReqOptions = this.addJsonBodyToRequestOptions(postReqOptions, data);
    postReqOptions = this.addCredentialsToRequestOptions(postReqOptions, authenticated);
    const response = await this.fetchThrowing(new URL(relPath, this.apiBaseUrl), postReqOptions);
    if (returnBody)
      return await response.json() as TResponse;
  };

  private async delete<TResponse>(relPath: string, authenticated: boolean, returnBody: true): Promise<TResponse>;
  private async delete(relPath: string, authenticated?: boolean, returnBody?: false): Promise<undefined>;
  private async delete<TResponse>(relPath: string, authenticated = true, returnBody = false) {
    let postReqOptions = this.addMethodToRequestOptions(this.baseRequestOptions, 'DELETE');
    postReqOptions = this.addCredentialsToRequestOptions(postReqOptions, authenticated);
    const response = await this.fetchThrowing(new URL(relPath, this.apiBaseUrl), postReqOptions);
    if (returnBody)
      return await response.json() as TResponse;
  };

  private async get<TResponse>(relPath: string, authenticated?: boolean, returnBody?: true): Promise<TResponse>;
  private async get(relPath: string, authenticated: boolean, returnBody: false): Promise<undefined>;
  private async get<TResponse>(relPath: string, authenticated = true, returnBody = true) {
    const getReqOptions = this.addCredentialsToRequestOptions(this.baseRequestOptions, authenticated);
    const response = await this.fetchThrowing(new URL(relPath, this.apiBaseUrl), getReqOptions);
    if (returnBody)
      return await response.json() as TResponse;
  };

  private async fetchFile(relPath: string, authenticated?: boolean, returnBody?: true): Promise<Blob>;
  private async fetchFile(relPath: string, authenticated: boolean, returnBody: false): Promise<undefined>;
  private async fetchFile(relPath: string, authenticated = true, returnBody = true) {
    const getReqOptions = this.addCredentialsToRequestOptions(this.baseRequestOptions, authenticated);
    const response = await this.fetchThrowing(new URL(relPath, this.apiBaseUrl), getReqOptions);
    if (returnBody)
      return await response.blob();
  };

  register = async (username: string, password: string) => await this.post(
    'auth/register',
    { username, password },
    false,
    false,
  );
  login = async (username: string, password: string) => {
    const authResponse = await this.post<AuthResponse>(
      'auth/login',
      { username, password },
      false,
    );
    this.loginState.setToken(authResponse.token);
  };
  logout = async () => this.loginState.setToken(undefined);
  getUsers = async () => await this.get<User[]>(
    'auth/users',
  );

  getDocuments = async () => await this.get<Document[]>(
    'documents/documents',
  );
  createDocument = async (data: CreateDocument) => await this.post<DocumentWithInitialVersion>(
    `documents`,
    data,
  );
  getDocument = async (documentId: string) => await this.get<Document>(
    `documents/${documentId}`,
  );
  updateDocument = async (documentId: string, data: UpdateDocument) => await this.patch(
    `documents/${documentId}`,
    data,
    true,
    false,
  );
  deleteDocument = async (documentId: string) => await this.delete(
    `documents/${documentId}`
  );

  getVersions = async (documentId: string) => await this.get<DocumentVersion[]>(
    `documents/${documentId}/versions`,
  );
  createVersion = async (documentId: string, data: CreateVersion) => await this.post<DocumentVersion>(
    `documents/${documentId}`,
    data,
  );
  getVersion = async (documentId: string, versionId: string) => await this.get<DocumentVersion>(
    `documents/${documentId}/${versionId}`
  );
  updateVersion = async (documentId: string, versionId: string, data: UpdateVersion) => await this.patch(
    `documents/${documentId}/${versionId}`,
    data,
    true,
    false,
  );
  deleteVersion = async (documentId: string, versionId: string) => await this.delete(
    `documents/${documentId}/${versionId}`
  );
  setVersionState = async (documentId: string, versionId: string, state: string) => await this.post(
    `documents/${documentId}/${versionId}/change-state/${state}`,
    '',
    true,
    false,
  );
  getVersionMembers = async (documentId: string, versionId: string) => await this.get<DocumentVersionMember[]>(
    `documents/${documentId}/${versionId}/members`,
  );

  getFiles = async (documentId: string, versionId: string) => await this.get<DocFile[]>(
    `documents/${documentId}/${versionId}/files`,
  );
  uploadFile = async (documentId: string, versionId: string, data: File) => await this.sendFile(
    `documents/${documentId}/${versionId}/files`,
    data,
    true,
    false,
  );
  getFile = async (documentId: string, versionId: string, fileId: string) => await this.fetchFile(
    `documents/${documentId}/${versionId}/files/${fileId}/content`,
  );
  deleteFile = async (documentId: string, versionId: string, fileId: string) => await this.delete(
    `documents/${documentId}/${versionId}/files/${fileId}`,
  );

  getMembers = async (documentId: string, versionId: string) => await this.get<DocumentVersionMember[]>(
    `documents/${documentId}/${versionId}/members`,
  );
  getMember = async (documentId: string, versionId: string) => await this.get<DocumentVersionMember>(
    `documents/${documentId}/${versionId}/member`,
  );
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

  createComment = async (documentId: string, versionId: string, comment: CreateComment) => await this.post<Comment>(
    `documents/${documentId}/${versionId}/comment`,
    comment,
  );
  loadComments = async (documentId: string, versionId: string) => await this.get<Comment[]>(
    `documents/${documentId}/${versionId}/comments`,
  );

  getNotifications = async() => await this.get<Notification[]>(`events`);
  markAsRead = async (eventId: string) => await this.post(
    `events/${eventId}`,
    undefined,
    true,
    false)

  constructor(url: string, loginState: LoginState, authenticationErrorHandler?: (message: string) => void) {
    if (url[url.length - 1] !== '/')
      url += '/';  // the trailing slash is important
    this.apiBaseUrl = url;
    this.loginState = loginState;
    this.authenticationErrorHandler = authenticationErrorHandler;
  }
}

export default BackendApiClient;
