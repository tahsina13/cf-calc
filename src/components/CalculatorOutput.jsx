import './CalculatorOutput.css';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';

import { CalculationStatus, getInverseTheme } from '../utils';
import { useTheme } from '../ThemeContext';
import ResultTable from './ResultTable';

export default function CalculatorOutput({ calculationStatus, results }) {
  const { theme } = useTheme();
  switch(calculationStatus) {
    case CalculationStatus.CALCULATION_IN_PROGRESS:
      return (
        <Row className={'calculator-output mx-auto my-3 text-center'}>
          <Spinner animation='border' variant={getInverseTheme(theme)} className='mx-auto'/>
        </Row>
      );
    case CalculationStatus.CALCULATION_DONE:
      return (
        <Row className={'calculator-output mx-auto my-3 text-center'}>
          <ResultTable results={results} />
        </Row>
      );
    case CalculationStatus.CALCULATION_FAILED:
      return (
        <Row className={'calculator-output mx-auto my-3 text-center'}>
          <span className='mx-auto text-danger'>Contest not found, or not rated, or not finished yet.</span>
        </Row>
      );
    default:
      return <></>;
  }
}
