import { useState } from 'react';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { BrightnessHighFill, MoonStarsFill, Github } from 'react-bootstrap-icons';

import '../App.css';
import { CalculationStatus } from '../utils';
import { ThemeProvider, useTheme } from '../ThemeContext';
import Calculator from './Calculator';
import CalculatorOutput from './CalculatorOutput';

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { theme, setTheme } = useTheme();
  const [calculationStatus, setCalculationStatus] = useState(CalculationStatus.CALCULATION_DONE);
  const [results, setResults] = useState(null);

  return (
    <>
      <Navbar bg={theme} variant={theme} sticky='top' className='shadow'>
        <Container fluid>
          <Navbar.Brand href='#home'>CF Calc</Navbar.Brand>
          <Navbar.Collapse>
            <Nav navbarScroll>
              <Nav.Item>
                <Nav.Link href='https://github.com/tahsina13/cf-calc'>
                  <Github width='1.5em' height='1.5em' color={theme === 'light' ? 'black' : 'white'}/>{' '}Github
                </Nav.Link>
              </Nav.Item>
            </Nav>
            <Form className='d-flex ms-auto me-2'>
              <BrightnessHighFill width='1.5em' height='1.5em' color={theme === 'light' ? 'black' : 'white'}/>&nbsp;&nbsp;
              <Form.Check
                type='switch'
                defaultChecked={theme === 'dark'}
                onChange={e => setTheme(e.target.checked ? 'dark' : 'light')}
              />&nbsp;
              <MoonStarsFill width='1.5em' height='1.5em' color={theme === 'light' ? 'black' : 'white'}/>
            </Form>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container fluid>
        <Calculator
          setResults={setResults}
          calculationStatus={calculationStatus}
          setCalculationStatus={setCalculationStatus}
        />
        <CalculatorOutput
          calculationStatus={calculationStatus}
          results={results}
        />
      </Container>
    </>
  );
}
