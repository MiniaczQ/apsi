import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom';
import RoutingRoot from './RoutingRoot';
import Hello from './Hello';
import Login from './Login';
import './App.css';
import { useCookies } from 'react-cookie';

export type LoginManager = {
  isLoggedIn: boolean;
  token: string | undefined;
  setToken: ((token: string | undefined) => void);
};

function App() {
  const cookieName = 'jwt-token';
  const [cookies, setCookie, removeCookie] = useCookies([cookieName, 'not-existing']);

  const loginManager: LoginManager = {
    isLoggedIn: cookies[cookieName] !== undefined,
    token: cookies[cookieName] as (string | undefined),
    setToken: token => token !== undefined ? setCookie(cookieName, token) : removeCookie(cookieName),
  };

  const router = createBrowserRouter(
    createRoutesFromElements(
      loginManager.isLoggedIn ? (
        <Route path="/" element={<RoutingRoot loginManager={loginManager} />}>
          <Route index element={<Hello />} />
        </Route>
      ) : (
        <Route element={<RoutingRoot loginManager={loginManager} />}>
          <Route path="/*" element={<Login loginManager={loginManager} />} />
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
