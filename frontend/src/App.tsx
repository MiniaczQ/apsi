import { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom';

import Documents from './documents/Documents';
import DocVer from './versions/DocVer';
import Login from './accounts/Login';
import Register from './accounts/Register';
import RoutingRoot from './RoutingRoot';
import VersionCreator from './versions/VersionCreator';
import Versions from './versions/Versions';
import ApiClient from './api/ApiClient';
import BackendApiClient from './api/BackendApiClient';
import VersionEditor from './versions/VersionEditor';
import Notifications from './notifications/Notifications';


const API_BASE_URL = 'http://localhost:3000/api/'


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

  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
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
      userId: parsedToken.userId as string
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

  const apiClient: ApiClient = new BackendApiClient(API_BASE_URL, loginState);

  useEffect(() => {
    const interval = setInterval(() => {
      console.log() // Without this line interval check is not working
      if(isLoggedIn){
        apiClient.getNotifications(loginData.userId)
        .then(response => setUnreadNotifications(response.filter(notification => !notification.read).length))
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [isLoggedIn, loginData, apiClient])

  const router = createBrowserRouter(
    createRoutesFromElements(
      isLoggedIn ? (
        <Route element={<RoutingRoot loginState={loginState} apiClient={apiClient} unreadNotifications={unreadNotifications}/>}>
          <Route index path="/DocVer" element={<DocVer loginState={loginState} apiClient={apiClient} />} />
          <Route index path="/versions/new" element={<VersionCreator loginState={loginState} apiClient={apiClient} />} />
          <Route index path="/versions/edit" element={<VersionEditor loginState={loginState} apiClient={apiClient} />} />
          <Route index path="/versions" element={<Versions apiClient={apiClient} />} />
          <Route index path="/*" element={<Documents apiClient={apiClient} />} />
          <Route index path="/notifications" element={<Notifications apiClient={apiClient} loginState={loginState}/>}/>
        </Route>
      ) : (
        <Route element={<RoutingRoot loginState={loginState} apiClient={apiClient} unreadNotifications={unreadNotifications}/>}>
          <Route index path="/register" element={<Register apiClient={apiClient} />} />
          <Route index path="/*" element={<Login apiClient={apiClient} />} />
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
