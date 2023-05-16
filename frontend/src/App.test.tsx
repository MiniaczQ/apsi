import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const loginLogoutElement = screen.getByText(/log/i);
  expect(loginLogoutElement).toBeInTheDocument();
});
