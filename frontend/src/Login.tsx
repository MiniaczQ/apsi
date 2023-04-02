import { Form, useActionData } from "react-router-dom";
import './App.css';

function Login() {
  const error = useActionData()?.toString();
  const errorElement = error ? <p>{error}</p> : <></>

  return (
    <div>
      <p>Login page.</p>
      {errorElement}
      <Form method="post">
        <button type="submit">Login</button>
      </Form>
    </div>
  );
}

export default Login;
