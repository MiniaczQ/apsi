import { useState, FunctionComponent, KeyboardEventHandler } from 'react';
import { Button, Form } from 'react-bootstrap';

import ApiClient from '../api/ApiClient';

type LoginProps = {
  apiClient: ApiClient;
};

const Login: FunctionComponent<LoginProps> = ({ apiClient }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const loginAndUpdateState = async () => {
    try {
      await apiClient.login(username, password);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEnter: KeyboardEventHandler<HTMLFormElement> = async (evt) => {
    if (evt.key === 'Enter') {
      evt.preventDefault();
      await loginAndUpdateState();
    }
  };

  return (
    <>
      <p className="display-5">Login form</p>
      <Form onKeyDown={handleEnter}>
        <Form.Group className="mb-3" controlId="username">
          <Form.Label>Username</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(evt) => setUsername(evt.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="password">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(evt) => setPassword(evt.target.value)}
          />
        </Form.Group>
        <Button variant="primary" className="me-2" onClick={loginAndUpdateState}>
          Log in
        </Button>
      </Form>
    </>
  );
};

export default Login;
