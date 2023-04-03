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

const addCredentialsToRequestOptions = (options: RequestInit, token: string) => ({
  ...options,
  headers: {
    ...(options.headers ?? {}),
    'Authorization': `Bearer ${token}`,
  },
});

const post = async (relPath: string, data: any, token: string | undefined = undefined) => {
  const postReqOptions = addPostDataToRequestOptions(baseRequestOptions, data);
  const finalReqOptions = token ? addCredentialsToRequestOptions(postReqOptions, token) : postReqOptions;
  return await (await fetch(new URL(relPath, apiBaseUrl), finalReqOptions)).json();
};


export const login = async (username: string, password: string) => await post('user/login', { username, password }) as string;
