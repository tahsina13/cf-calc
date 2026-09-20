import { render, screen } from '@testing-library/react';
import App from './App';

test('renders CF Calc navbar brand', () => {
  render(<App />);
  const brandElement = screen.getByText(/cf calc/i);
  expect(brandElement).toBeInTheDocument();
});
