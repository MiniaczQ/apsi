import { UUID } from "crypto";

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

const post = async (relPath: string, data: any, token: string | undefined = undefined, returnBody = true) => {
  const postReqOptions = addPostDataToRequestOptions(baseRequestOptions, data);
  const finalReqOptions = token ? addCredentialsToRequestOptions(postReqOptions, token) : postReqOptions;
  const response = await fetch(new URL(relPath, apiBaseUrl), finalReqOptions);
  if (returnBody)
    return await response.json();
};


export type AuthResponse = {
  token: string
};

export const register = async (username: string, password: string) => await post('auth/register', { username, password }, undefined, false);
export const login = async (username: string, password: string) => await post('auth/login', { username, password }) as AuthResponse;

export const getVersion = async (id: UUID) => '';  // TODO
