import { Button, Nav, Navbar, Container } from 'react-bootstrap';
import { Link, Outlet } from 'react-router-dom';
import { LoginState } from './App';
import './App.css';

type RoutingRootProps = {
  loginState: LoginState;
};

function RoutingRoot({ loginState }: RoutingRootProps) {
  const logout = () => loginState.setToken(undefined);

  const loginLogoutButton = loginState.isLoggedIn
    ? <Nav.Link as={Button} onClick={logout}>Logout</Nav.Link>
    : <Nav.Link as={Link} to="/login">Login</Nav.Link>;

  return (
    <>
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/">APSI Docs</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">Home</Nav.Link>
              {loginLogoutButton}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <div id="outlet" className="d-flex flex-column align-items-stretch p-3">
        <Outlet />
      </div>
    </>
  );
}

export default RoutingRoot;
