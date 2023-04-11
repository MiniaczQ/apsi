import { useState, MouseEventHandler } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import './App.css';
import { LoginState } from './App';
import { login, register } from './ApiCommunication';

type LoginProps = {
  loginState: LoginState;
};

function Login({ loginState }: LoginProps) {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const successElement = success.length > 0 ? <Alert variant="success">{success}</Alert> : <></>
  const errorElement = error.length > 0 ? <Alert variant="danger">{error}</Alert> : <></>

  const loginAndUpdateState: MouseEventHandler<HTMLButtonElement> = async () => {
    try {
      setError('');
      setSuccess('');
      loginState.setToken((await login(username, password)).token);
    } catch (e) {
      setError(e?.toString() ?? '');
    }
  };

  const registerAndClear: MouseEventHandler<HTMLButtonElement> = async () => {
    try {
      setError('');
      setSuccess('');
      await register(username, password);
      setSuccess('Registered successfully. Try logging in now.');
    } catch (e) {
      setError(e?.toString() ?? '');
    }
  };

  return (
    <>
      <p className="display-5">Login / register</p>
      {successElement}
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
          Sign in
        </Button>
        <Button variant="secondary" onClick={registerAndClear}>
          Sign up
        </Button>
      </Form>
    </>
  );
}

export default Login;
