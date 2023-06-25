import { useState, MouseEventHandler, FunctionComponent, useEffect } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';

import ApiClient from '../api/ApiClient';


type LoginProps = {
  apiClient: ApiClient;
};

const Login: FunctionComponent<LoginProps> = ({ apiClient }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const loginAndUpdateState: MouseEventHandler<HTMLButtonElement> = async () => {
    try {
      await apiClient.login(username, password);
    } catch (e) {
      console.error(e);
    }
  };

  const loginEnterHandler = async (username: string, password: string) => {    
    
    try {
      await apiClient.login(username, password);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const keyDownHandler = (event: { key: string; preventDefault: () => void; }) => {
      if (event.key === 'Enter') {
        event.preventDefault();      
        loginEnterHandler(username, password);
      }
    };

    document.addEventListener('keydown', keyDownHandler);

    return () => {
      document.removeEventListener('keydown', keyDownHandler);
    };
  })
 

  return (
    <>
      <p className="display-5">Login form</p>
      <Form>
        <Form.Group className="mb-3" controlId="username">
          <Form.Label>Username</Form.Label>
          <Form.Control type="text" placeholder="Enter username" value={username} onChange={evt => setUsername(evt.target.value)} />
        </Form.Group>
        <Form.Group className="mb-3" controlId="password">
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" placeholder="Enter password" value={password} onChange={evt => setPassword(evt.target.value)} />
        </Form.Group>
        <Button variant="primary" className="me-2" onClick={loginAndUpdateState}>
          Log in
        </Button>
      </Form>
    </>
  );
}

export default Login;
