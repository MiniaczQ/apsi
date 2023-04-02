import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  createRoutesFromElements,
  redirect,
  RouterProvider,
  Route,
} from "react-router-dom";
import { getCookie, setCookie, removeCookie } from 'typescript-cookie'
import './index.css';
import App from './App';
import Hello from './Hello';
import Login from './Login';
import reportWebVitals from './reportWebVitals';

const cookieName = 'jwt-token';

const loginLoader = async () => {
  if (getCookie(cookieName) === undefined)
    return redirect('/login');
  return null;
};

const loginAction = async () => {
  if (Math.random() < 0.2) {
    setCookie(cookieName, 'dummy', { expires: 1 });
    return redirect('/');
  }
  return 'Failed to login';
};

const logoutAction = async () => {
  removeCookie(cookieName);
  return redirect('/login');
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route loader={loginLoader}>
        <Route index element={<Hello />} />
        <Route path='logout' action={logoutAction} />
      </Route>
      <Route path='login' element={<Login />} action={loginAction} />
    </Route>
  )
);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
