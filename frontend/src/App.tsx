import { Outlet } from "react-router-dom";
import { Form } from "react-router-dom";
import './App.css';

function App() {
  return (
    <div className="App">
      <div>
        <Form method="post" action="/logout">
          <button type="submit">Logout</button>
        </Form>
      </div>
      <Outlet />
    </div>
  );
}

export default App;
