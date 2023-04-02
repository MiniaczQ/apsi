import { getToken } from './LoginManager';

const apiBaseUrl = 'http://example.com/api/';  // the trailing slash is important

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

const addCredentialsToRequestOptions = (options: RequestInit) => ({
  ...options,
  headers: {
    ...(options.headers ?? {}),
    'Authorization': `Bearer ${getToken()}`,
  },
});

const post = async (relPath: string, data: any, includeCredentials = true) => {
  const postReqOptions = addPostDataToRequestOptions(baseRequestOptions, data);
  const finalReqOptions = includeCredentials ? addCredentialsToRequestOptions(postReqOptions) : postReqOptions;
  return await (await fetch(new URL(relPath, apiBaseUrl), finalReqOptions)).json();
};


export const login = async (username: string, password: string) => await post('user/login', { username, password }) as string;
