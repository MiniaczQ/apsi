import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom';
import RoutingRoot from './RoutingRoot';
import Documents from './Documents';
import Versions from './Versions';
import DocVer from './DocVer';

import Login from './Login';
import './App.css';
import { useCookies } from 'react-cookie';
import VersionCreator from './VersionCreator';
import { useEffect, useState } from 'react';

export type LoginData = {
  token: string;
  username: string;
  userId: string;
};

export type LoginState = {
  isLoggedIn: boolean;
  token?: string;
  username?: string;
  userId?: string;
  setToken: ((token: string | undefined) => void);
}

// source: https://stackoverflow.com/a/38552302
function parseJwt(token: string) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(
    c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  ).join(''));
  return JSON.parse(jsonPayload);
}

function App() {
  const cookieName = 'jwt-token';
  const [cookies, setCookie, removeCookie] = useCookies([cookieName]);

  const [loginData, setLoginData] = useState<LoginData | undefined>();
  const isLoggedIn = loginData !== undefined;

  const setLoginDataUsingToken: ((token: string | undefined) => void) = token => {
    if (token === undefined) {
      setLoginData(undefined);
      return;
    }
    const parsedToken = parseJwt(token);
    setLoginData({
      token,
      username: parsedToken.username as string,
      userId: parsedToken.user_id as string
    });
  };

  useEffect(() => {
    setLoginDataUsingToken(cookies[cookieName]);
  }, [cookies]);

  const setToken: ((token: string | undefined) => void) = token => {
    if (token !== undefined)
      setCookie(cookieName, token);
    else
      removeCookie(cookieName);
    setLoginDataUsingToken(token);
  };

  const loginState: LoginState = {
    ...loginData,
    isLoggedIn,
    setToken
  };

  const router = createBrowserRouter(
    createRoutesFromElements(
      isLoggedIn ? (
        <Route path="/" element={<RoutingRoot loginState={loginState} />}>
          <Route index element={<Documents />} />
          <Route path="Versions">
            <Route index path="new" element={<VersionCreator loginState={loginState} />} />
            <Route path="*" element={<Versions />} />
          </Route>
          <Route path="DocVer" index element={<DocVer />} />
        </Route>
      ) : (
        <Route element={<RoutingRoot loginState={loginState} />}>
          <Route path="/*" element={<Login loginState={loginState} />} />
        </Route>
      )
    )
  );

  return (
    <div id="App">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
