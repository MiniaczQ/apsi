import CreateDocument from "./models/CreateDocument";
import CreateVersion from "./models/CreateVersion";
import DocumentVersion from "./models/DocumentVersion";
import Document from "./models/Document";
import DocFile from "./models/DocFile";

const apiBaseUrl = 'http://localhost:3000/api/';  // the trailing slash is important

const baseRequestOptions: RequestInit = {
  mode: 'cors',
  cache: 'no-cache',
  credentials: 'same-origin',
  headers: {
    'Content-Type': 'application/json',
  },
  redirect: 'follow',
  referrerPolicy: 'no-referrer',
};

const addPostDataToRequestOptions = (options: RequestInit, data: any) => ({
  ...options,
  method: 'POST',
  body: JSON.stringify(data),
});

const addCredentialsToRequestOptions = (options: RequestInit, token: string) => ({
  ...options,
  headers: {
    ...(options.headers ?? {}),
    'Authorization': `Bearer ${token}`,
  },
});


const addPatchFileTORequestOptions = (options: RequestInit, data: FormData) => ({

  method: 'PATCH',
  body: data,
});

const sendFile = async (relPath: string, data: File, token: string | undefined = undefined, returnBody = true) => {
  let form = new FormData();
  form.append('asdd', data)
  const postReqOptions = addPatchFileTORequestOptions(baseRequestOptions, form);
  const finalReqOptions = token ? addCredentialsToRequestOptions(postReqOptions, token) : postReqOptions;
  const response = await fetch(new URL(relPath, apiBaseUrl), finalReqOptions);
  if (returnBody)
    return await response.json();
};

const post = async (relPath: string, data: any, token: string | undefined = undefined, returnBody = true) => {
  const postReqOptions = addPostDataToRequestOptions(baseRequestOptions, data);
  const finalReqOptions = token ? addCredentialsToRequestOptions(postReqOptions, token) : postReqOptions;
  const response = await fetch(new URL(relPath, apiBaseUrl), finalReqOptions);
  if (returnBody)
    return await response.json();
};

const getJSON = async (relPath: string, token: string | undefined = undefined, returnBody = true) => {
  const finalReqOptions = token ? addCredentialsToRequestOptions(baseRequestOptions, token) : baseRequestOptions;
  const response = await fetch(new URL(relPath, apiBaseUrl), finalReqOptions);
  if (returnBody)
    return await response.json();
};

const getString = async (relPath: string, token: string | undefined = undefined, returnBody = true) => {
  const finalReqOptions = token ? addCredentialsToRequestOptions(baseRequestOptions, token) : baseRequestOptions;
  const response = await fetch(new URL(relPath, apiBaseUrl), finalReqOptions);
  if (returnBody)
    return await response.text();
};



export type AuthResponse = {
  token: string
};

export const register = async (username: string, password: string) => await post('auth/register', { username, password }, undefined, false);
export const login = async (username: string, password: string) => await post('auth/login', { username, password }) as AuthResponse;

export const getDocuments = async (token: string) => await getJSON(`documents/documents`, token) as Document[];
export const createDocument = async (data: CreateDocument, token: string) => await post(`documents`, data, token);

export const getVersions = async (documentId: string, token: string) => await getJSON(`documents/${documentId}/versions`, token) as DocumentVersion[];
export const createVersion = async (documentId: string, data: CreateVersion, token: string) => await post(`documents/${documentId}`, data, token, false);
export const getVersionContent = async (documentId: string, versionId: string, token: string) => await getString(`documents/${documentId}/${versionId}`, token) as string;

export const getFiles = async (documentId: string, versionId: string, token:string) => await getJSON(`documents/${documentId}/${versionId}/files`, token) as DocFile[];
export const postFiles = async (documentId: string, versionId: string, token:string,  data:File) => await sendFile(`documents/${documentId}/${versionId}/files`, data, token);