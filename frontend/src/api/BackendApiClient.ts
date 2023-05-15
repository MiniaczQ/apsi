import ApiClient from "./ApiClient";
import CreateDocument from "../models/CreateDocument";
import CreateVersion from "../models/CreateVersion";
import DocumentVersion from "../models/DocumentVersion";
import Document from "../models/Document";
import { LoginState } from "../App";
import UpdateVersion from "../models/UpdateVersion";
import UpdateDocument from "../models/UpdateDocument";
import AuthResponse from "./AuthResponse";


class BackendApiClient implements ApiClient {
  private apiBaseUrl: string;
  private loginState: LoginState;

  private baseRequestOptions: RequestInit = {
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
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

  private patch = async (relPath: string, data: any, authenticated = true, returnBody = true) => {
    let postReqOptions = this.addMethodToRequestOptions(this.baseRequestOptions, 'PATCH');
    postReqOptions = this.addJsonBodyToRequestOptions(postReqOptions, data);
    postReqOptions = this.addCredentialsToRequestOptions(postReqOptions, authenticated);
    const response = await fetch(new URL(relPath, this.apiBaseUrl), postReqOptions);
    if (returnBody)
      return await response.json();
  };

  private delete = async (relPath: string, authenticated = true, returnBody = true) => {
    let postReqOptions = this.addMethodToRequestOptions(this.baseRequestOptions, 'DELETE');
    postReqOptions = this.addCredentialsToRequestOptions(postReqOptions, authenticated);
    const response = await fetch(new URL(relPath, this.apiBaseUrl), postReqOptions);
    if (returnBody)
      return await response.json();
  };

  private get = async (relPath: string, authenticated = true, returnBody = true) => {
    const getReqOptions = this.addCredentialsToRequestOptions(this.baseRequestOptions, authenticated);
    const response = await fetch(new URL(relPath, this.apiBaseUrl), getReqOptions);
    if (returnBody)
      return await response.json();
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

  getDocuments = async () => await this.get(
    'documents/documents'
  ) as Document[];
  createDocument = async (data: CreateDocument) => await this.post(
    `documents`,
    data
  );
  getDocument = async (documentId: string) => await this.get(
    `documents/${documentId}`
  ) as Document;
  updateDocument = async (documentId: string, data: UpdateDocument) => await this.patch(
    `documents/${documentId}`,
    data
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
    true,
    false
  );
  getVersion = async (documentId: string, versionId: string) => await this.get(
    `documents/${documentId}/${versionId}`
  ) as DocumentVersion;
  updateVersion = async (documentId: string, versionId: string, data: UpdateVersion) => await this.patch(
    `documents/${documentId}/${versionId}`,
    data
  );
  deleteVersion = async (documentId: string, versionId: string) => await this.delete(
    `documents/${documentId}/${versionId}`
  );

  constructor(url: string, loginState: LoginState) {
    if (url[url.length - 1] !== '/')
      url += '/';  // the trailing slash is important
    this.apiBaseUrl = url;
    this.loginState = loginState;
  }
}

export default BackendApiClient;
