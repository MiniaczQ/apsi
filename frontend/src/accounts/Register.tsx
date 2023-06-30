import { useState, FunctionComponent, KeyboardEventHandler } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';

import ApiClient from '../api/ApiClient';

type RegisterProps = {
  apiClient: ApiClient;
};

const Register: FunctionComponent<RegisterProps> = ({ apiClient }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [password2, setPassword2] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const successElement = success.length > 0 ? <Alert variant="success">{success}</Alert> : <></>;

  const registerAndClear = async () => {
    try {
      setSuccess('');
      await apiClient.register(username, password);
      setSuccess('Registered successfully. Try logging in now.');
      setUsername('');
      setPassword('');
      setPassword2('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleEnter: KeyboardEventHandler<HTMLFormElement> = async (evt) => {
    if (evt.key === 'Enter') {
      evt.preventDefault();
      await registerAndClear();
    }
  };

  return (
    <>
      <p className="display-5">Registration form</p>
      {successElement}
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
        <Form.Group className="mb-3" controlId="password2">
          <Form.Label>Repeat password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Repeat password"
            value={password2}
            onChange={(evt) => setPassword2(evt.target.value)}
          />
        </Form.Group>
        <Button variant="primary" onClick={registerAndClear}>
          Register
        </Button>
      </Form>
    </>
  );
};

export default Register;
