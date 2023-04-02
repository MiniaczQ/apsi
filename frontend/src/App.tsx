import { Button, Nav, Navbar, NavDropdown, Container } from "react-bootstrap";
import { Link, Outlet, useSubmit } from "react-router-dom";
import './App.css';

function App() {
  const clientSubmit = useSubmit();
  const logout = () => clientSubmit(null, { method: 'post', action: '/logout' });

  return (
    <div id="App">
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/">APSI Docs</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">Home</Nav.Link>
              <NavDropdown title="Account" id="basic-nav-dropdown">
                <NavDropdown.Item as={Link} to="/login">Login</NavDropdown.Item>
                <NavDropdown.Item as={Button} onClick={logout}>Logout</NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <div id="outlet" className="d-flex flex-column align-items-stretch p-3">
        <Outlet />
      </div>
    </div>
  );
}

export default App;
