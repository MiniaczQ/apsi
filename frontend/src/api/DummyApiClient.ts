import ApiClient from "./ApiClient";
import CreateDocument from "../models/CreateDocument";
import CreateVersion from "../models/CreateVersion";
import DocumentVersion from "../models/DocumentVersion";
import Document from "../models/Document";
import { LoginState } from "../App";
import UpdateDocument from "../models/UpdateDocument";
import UpdateVersion from "../models/UpdateVersion";


class DummyApiClient implements ApiClient {
  private loginState: LoginState;

  register = (username: string, password: string) => { throw new Error('Not implemented') };
  login = (username: string, password: string) => { throw new Error('Not implemented') };
  logout = () => { throw new Error('Not implemented') };

  getDocuments = () => { throw new Error('Not implemented') };
  createDocument = (data: CreateDocument) => { throw new Error('Not implemented') };
  getDocument = (documentId: string) => { throw new Error('Not implemented') };
  updateDocument = (documentId: string, data: UpdateDocument) => { throw new Error('Not implemented') };
  deleteDocument = (documentId: string) => { throw new Error('Not implemented') };

  getVersions = (documentId: string) => { throw new Error('Not implemented') };
  createVersion = (documentId: string, data: CreateVersion) => { throw new Error('Not implemented') };
  getVersion = (documentId: string, versionId: string) => { throw new Error('Not implemented') };
  updateVersion = (documentId: string, versionId: string, data: UpdateVersion) => { throw new Error('Not implemented') };
  deleteVersion = (documentId: string, versionId: string) => { throw new Error('Not implemented') };

  constructor(loginState: LoginState) {
    this.loginState = loginState;
  }
}

export default DummyApiClient;
