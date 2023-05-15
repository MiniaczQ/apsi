import { useState, MouseEventHandler } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import ApiClient from './api/ApiClient';
import './App.css';

type LoginProps = {
  apiClient: ApiClient;
};

function Login({ apiClient }: LoginProps) {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const errorElement = error.length > 0 ? <Alert variant="danger">{error}</Alert> : <></>

  const loginAndUpdateState: MouseEventHandler<HTMLButtonElement> = async () => {
    try {
      setError('');
      await apiClient.login(username, password);
    } catch (e) {
      setError(e?.toString() ?? '');
    }
  };

  return (
    <>
      <p className="display-5">Login form</p>
      {errorElement}
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
