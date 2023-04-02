import { Form as RouterForm, useActionData } from 'react-router-dom';
import { Alert, Button, Form } from 'react-bootstrap';
import './App.css';

function Login() {
  const error = useActionData()?.toString();
  const errorElement = error? <Alert variant="danger">{error}</Alert> : <></>

  return (
    <>
      <p className="display-5">Login form</p>
      {errorElement}
      <Form as={RouterForm} method="post">
        <Form.Group className="mb-3" controlId="username">
          <Form.Label>Username</Form.Label>
          <Form.Control type="text" placeholder="Enter username" />
        </Form.Group>
        <Form.Group className="mb-3" controlId="password">
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" placeholder="Enter password" />
        </Form.Group>
        <Button variant="primary" type="submit">
          Sign in
        </Button>
      </Form>
    </>
  );
}

export default Login;
