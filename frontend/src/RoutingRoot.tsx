import { Button, Nav, Navbar, Container } from 'react-bootstrap';
import { Link, Outlet } from 'react-router-dom';

import { LoginState } from './App';
import ApiClient from './api/ApiClient';


type RoutingRootProps = {
  loginState: LoginState;
  apiClient: ApiClient;
};

function RoutingRoot({ loginState, apiClient }: RoutingRootProps) {
  const logout = async () => await apiClient.logout();

  const loggedInLinks = (<>
    <Nav.Link as={Link} to="/">Home</Nav.Link>
    <Nav.Link as={Button} onClick={logout}>Logout ({loginState.username})</Nav.Link>
    <Nav.Link as={Link} to="/Sets">Sets</Nav.Link>
  </>);

  const loggedOutLinks = (<>
    <Nav.Link as={Link} to="/register">Register</Nav.Link>
    <Nav.Link as={Link} to="/login">Login</Nav.Link>
  </>);

  return (
    <>
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/">APSI Docs</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              {loginState.isLoggedIn ? loggedInLinks : loggedOutLinks}
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
