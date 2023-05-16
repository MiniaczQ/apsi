import { render, screen } from '@testing-library/react';
import App from './App';

test('renders register button', () => {
  render(<App />);
  const registerElement = screen.getByText(/register/i);
  expect(registerElement).toBeInTheDocument();
});
