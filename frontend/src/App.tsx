import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom';
import RoutingRoot from './RoutingRoot';
import Hello from './Hello';
import Documents from './Documents';
import Versions from './Versions';

import Login from './Login';
import './App.css';
import { useCookies } from 'react-cookie';

export type LoginState = {
  isLoggedIn: boolean;
  token: string | undefined;
  setToken: ((token: string | undefined) => void);
};

function App() {
  const cookieName = 'jwt-token';
  const [cookies, setCookie, removeCookie] = useCookies([cookieName, 'not-existing']);

  const loginState: LoginState = {
    isLoggedIn: cookies[cookieName] !== undefined,
    token: cookies[cookieName] as (string | undefined),
    setToken: token => token !== undefined ? setCookie(cookieName, token) : removeCookie(cookieName),
  };

  const router = createBrowserRouter(
    createRoutesFromElements(
      loginState.isLoggedIn ? (
        <Route path="/" element={<RoutingRoot loginState={loginState} />}>
          <Route index element={<Documents />} />
          <Route path ="/Versions" index element={<Versions />} />
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
