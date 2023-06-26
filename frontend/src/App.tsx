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
import DocumentsSet from './document_set/DocumentsSet';
import VersionsSet from './version_set/VersionsSet';
import { Button, Modal } from 'react-bootstrap';
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
};

type ModalError = {
  title: string;
  message: string;
  resolveFunc: () => void;
};

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

  const [modalError, setModalError] = useState<ModalError>();
  const isModalErrorSet = modalError !== undefined;

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

  const clearModalError = () => {
    modalError?.resolveFunc?.();
    setModalError(undefined);
  }

  const apiClient: ApiClient = new BackendApiClient(API_BASE_URL, loginState, (message: string) => {
    if (isModalErrorSet)
      return;
    setModalError({ title: 'Authentication error', message, resolveFunc: () => loginState.setToken(undefined) });
  });
  
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route element={<RoutingRoot loginState={loginState} apiClient={apiClient} />}>
        {isLoggedIn ? (<>
          <Route index path="/DocVer" element={<DocVer loginState={loginState} apiClient={apiClient} />} />
          <Route index path="/versions/new" element={<VersionCreator loginState={loginState} apiClient={apiClient} />} />
          <Route index path="/versions/edit" element={<VersionEditor loginState={loginState} apiClient={apiClient} />} />
          <Route index path="/DocSets" element={<DocumentsSet apiClient={apiClient} />} />
          <Route index path="/versions" element={<Versions apiClient={apiClient} />} />
          <Route index path="/VersionSets" element={<VersionsSet apiClient={apiClient} />} />
          <Route index path="/*" element={<Documents apiClient={apiClient} />} />
          <Route index path="/notifications" element={<Notifications apiClient={apiClient} loginState={loginState} />}/>
        </>) : (<>
          <Route index path="/register" element={<Register apiClient={apiClient} />} />
          <Route index path="/*" element={<Login apiClient={apiClient} />} />
        </>)}
      </Route>
    )
  );

  return (
    <div id="App">
      <Modal centered scrollable backdrop="static" keyboard={false} show={isModalErrorSet} onHide={clearModalError}>
        <Modal.Header closeButton>
          <Modal.Title>{modalError?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{modalError?.message}</Modal.Body>
        <Modal.Footer>
          <Button autoFocus onBlur={evt => evt.target.focus()} variant="primary" onClick={clearModalError}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
