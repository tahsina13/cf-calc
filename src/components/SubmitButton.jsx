import './SubmitButton.css';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';

import { useTheme } from '../ThemeContext';

export default function SubmitButton({ disabled }) {
  const { theme } = useTheme();
  return (
    <Row className='submit-button mx-auto my-3 p-1'>
      <Button
        type='submit'
        variant={`${theme === 'light' ? 'outline-' : ''}primary`}
        disabled={disabled}
      >
        Calculate
      </Button>
    </Row>
  );
}
