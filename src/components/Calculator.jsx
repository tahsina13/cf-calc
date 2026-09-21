import { useState } from 'react';
import './Calculator.css';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';

import { CalculationStatus, getInverseTheme } from '../utils';
import { useTheme } from '../ThemeContext';
import getRatingChange from '../calculator';
import UserInfo from './UserInfo';
import ContestSelect from './ContestSelect';
import Scoreboard from './Scoreboard';
import SubmitButton from './SubmitButton';

export default function Calculator({ calculationStatus, setCalculationStatus, setResults }) {
  const { theme } = useTheme();
  const [contestId, setContestId] = useState(0);
  const [user, setUser] = useState(null);
  const [rating, setRating] = useState('');
  const [points, setPoints] = useState(-1);
  const [penalty, setPenalty] = useState(-1);

  return (
    <Row>
      <Card body
        bg={theme}
        border={getInverseTheme(theme)}
        className={`calculator mx-auto my-3 shadow text-${getInverseTheme(theme)}`}
      >
        <Card.Title>Rating Calculator</Card.Title>
        <Form
          onSubmit={e => {
            e.preventDefault();
            setCalculationStatus(CalculationStatus.CALCULATION_IN_PROGRESS);
            getRatingChange(user ? user.handle : '', contestId, rating.length ? parseInt(rating) : user.rating, points, penalty)
              .then(results => {
                setCalculationStatus(CalculationStatus.CALCULATION_DONE);
                setResults(results);
              })
              .catch(err => {
                setCalculationStatus(CalculationStatus.CALCULATION_FAILED);
                console.log(err.message);
              });
        }}>
          <UserInfo
            user={user} setUser={setUser}
            rating={rating} setRating={setRating}
          />
          <ContestSelect
            setContestId={setContestId}
          />
          <Scoreboard
            contestId={contestId} handle={user ? user.handle : ''}
            setPoints={setPoints} setPenalty={setPenalty}
          />
          <SubmitButton
            disabled={(!user && !rating.length) || !contestId || points < 0 || penalty < 0 ||
              calculationStatus === CalculationStatus.CALCULATION_IN_PROGRESS}
          />
        </Form>
      </Card>
    </Row>
  );
}
