import { redirect, ActionFunction, LoaderFunction } from 'react-router-dom';
import { getCookie, setCookie, removeCookie } from 'typescript-cookie';
import { login } from './ApiCommunication';

const cookieName = 'jwt-token';

export const redirectIfNotLoggedIn: LoaderFunction = async () => {
  if (getCookie(cookieName) === undefined)
    return redirect('/login');
  return null;
};

export const loginAndRedirect: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  try {
    setCookie(cookieName, await login(username, password), { expires: 1 });
    return redirect('/');
  } catch (e) {
    return e;
  }
};

export const logoutAndRedirect: ActionFunction = async () => {
  removeCookie(cookieName);
  return redirect('/login');
};

export const getToken = async () => getCookie(cookieName);
