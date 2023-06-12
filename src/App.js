import { useState, useEffect } from 'react'; 
import './App.css'; 
import './calculator'; 
import enqueueRequest from './timedRequest';
import getRatingChange from './calculator';

import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card'; 
import Button from 'react-bootstrap/Button'; 
import Container from 'react-bootstrap/Container'; 
import Form from 'react-bootstrap/Form'; 
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Row from 'react-bootstrap/Row'; 
import Spinner from 'react-bootstrap/Spinner'; 
import Table from 'react-bootstrap/Table'; 

import Select from 'react-select'; 

import { ArrowClockwise, BrightnessHighFill, MoonStarsFill, Github } from 'react-bootstrap-icons';

const CalculationStatus = Object.freeze({
  CALCULATION_IN_PROGRESS: Symbol(0), 
  CALCULATION_DONE: Symbol(1), 
  CALCULATION_FAILED: Symbol(2),
}); 

function getInverseTheme(theme) {
  if(theme === 'light') {
    return 'dark'; 
  } else if(theme === 'dark') {
    return 'light'; 
  }
  return ''; 
}

function getRatingColor(rating) {
  const ratingRange = [Number.MIN_VALUE, 1200, 1400, 1600, 1900, 2200, 2400]; 
  const ratingColor = ['gray', 'green', 'cyan', 'blue', 'violet', 'orange', 'red']; 
  return ratingColor.at(Math.max(-1, ratingRange.findIndex((elem) => elem > rating)-1)); 
}

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme')); 
  const [calculationStatus, setCalculationStatus] = useState(CalculationStatus.CALCULATION_DONE); 
  const [results, setResults] = useState(null); 

  return (
    <>
      <Navbar bg={theme} variant={theme} sticky='top' className='shadow'>
        <Container fluid>
          <Navbar.Brand href='#home'>CF Pillow</Navbar.Brand>
          <Navbar.Collapse>
            <Nav navbarScroll>
              <Nav.Item>
                <Nav.Link href='https://github.com/TahsinAhmed13/cf-pillow.git'>
                  <Github width='1.5em' height='1.5em' color={theme === 'light' ? 'black' : 'white'}/>{' '}Github
                </Nav.Link>
              </Nav.Item>
            </Nav>
            <Form className='d-flex ms-auto me-2'>
              <BrightnessHighFill width='1.5em' height='1.5em' color={theme === 'light' ? 'black' : 'white'}/>&nbsp;&nbsp;
              <Form.Check 
                type='switch' 
                defaultChecked={theme === 'dark'}
                onChange={e => {
                  setTheme(e.target.checked ? 'dark' : 'light'); 
                  localStorage.setItem('theme', e.target.checked ? 'dark' : 'light'); 
                  document.body.className = `bg-${e.target.checked ? 'dark' : 'light'}`;
                }}
              />&nbsp;
              <MoonStarsFill width='1.5em' height='1.5em' color={theme === 'light' ? 'black' : 'white'}/>
            </Form>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container fluid>
        <Calculator 
          theme={theme} setResults={setResults} 
          calculationStatus={calculationStatus} 
          setCalculationStatus={setCalculationStatus} 
        />
        <CalculatorOutput theme={theme} calculationStatus={calculationStatus} results={results} />
      </Container>
    </>
  );    
}

function Calculator({ theme = 'light', calculationStatus, setCalculationStatus, setResults }) {
  const [isLoading, setIsLoading] = useState(false);  
  const [contestId, setContestId] = useState(0); 
  const [user, setUser] = useState(null); 
  const [rating, setRating] = useState(''); 
  const [points, setPoints] = useState(0); 
  const [penalty, setPenalty] = useState(0); 

  return (
    <Row>
      <Card body bg={theme} border={getInverseTheme(theme)} className={`calculator mx-auto my-3 shadow text-${getInverseTheme(theme)}`}>
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
            theme={theme}
            user={user} setUser={setUser} 
            rating={rating} setRating={setRating} 
          />
          <ContestSelect 
            theme={theme} 
            setContestId={setContestId}
          />
          <Scoreboard 
            theme={theme}
            contestId={contestId} handle={user ? user.handle : ''} 
            setPoints={setPoints} setPenalty={setPenalty} 
            isLoading={isLoading} setIsLoading={setIsLoading}
          />
          <SubmitButton disabled={calculationStatus === CalculationStatus.CALCULATION_IN_PROGRESS || 
            !contestId || isLoading || (!user && !rating.length)}/> 
        </Form>
      </Card>
    </Row>
  );
}

function UserInfo({ theme = 'light', user, setUser, rating, setRating }) {  
  const [lastHandle, setLastHandle] = useState(''); 
  const [handle, setHandle] = useState(''); 
  const [isHandleFocused, setIsHandleFocused] = useState(false); 
  const [isRatingFocused, setIsRatingFocused] = useState(false); 

  async function updateUserInfo(handle) {
    if(lastHandle.toLowerCase() !== handle.toLowerCase()) {
      setLastHandle(handle); 
      try {
        const res = await enqueueRequest(`https://codeforces.com/api/user.info?handles=${handle}`); 
        const data = await res.json(); 
        if(data.status === 'OK') {
          if(data.result.length) {
            setUser(data.result[0]); 
            setHandle(data.result[0].handle); 
          } else {
            setUser(null); 
          }
        } else {
          throw Error(data.comment); 
        }
      } catch(err) {
        setUser(null); 
        console.log(err.message); 
      }
    }
  }

  return (
    <Row className='user-info mx-auto my-3 p-1'>
      <Col>
        <Form.Control 
          type='text' placeholder='Your Handle' size='md' value={handle}
          style={{fontWeight: !isHandleFocused && user && user.hasOwnProperty('rating') ? 'bold' : 'normal'}}
          className={`${!isHandleFocused && user && user.hasOwnProperty('rating') ? `user-${getRatingColor(user.rating)}` : ''} 
            bg-${theme} text-${getInverseTheme(theme)}`}
          onFocus={_ => setIsHandleFocused(true)}
          onBlur={e => {
            updateUserInfo(e.target.value); 
            setIsHandleFocused(false); 
          }}
          onChange={e => {
            setUser(null); 
            setLastHandle(''); 
            setHandle(e.target.value); 
          }}
          onKeyDown={e => {
            if(e.key === 'Enter') {
              e.preventDefault(); 
              updateUserInfo(e.target.value); 
            }
          }}
        ></Form.Control>
      </Col>
      <Col>
        <Form.Control 
          type='number' placeholder='Old Rating' 
          step='1' size='md'
          style={{fontWeight: !isRatingFocused && rating.length ? 'bold' : 'normal'}}
          className={`${!isRatingFocused && rating.length ? `user-${getRatingColor(rating)}` : ''} 
            bg-${theme} text-${getInverseTheme(theme)}`}
          onFocus={_ => setIsRatingFocused(true)}
          onBlur={e => {
            setRating(e.target.value); 
            setIsRatingFocused(false);
          }}
          onChange={e => setRating(e.target.value)}
          onKeyDown={e => {
            if(e.key === 'Enter') {
              e.preventDefault(); 
            }
          }}
        ></Form.Control>
      </Col>
    </Row>
  ); 
}

function ContestSelect({ theme = 'light', setContestId }) {
  const [isLoading, setIsLoading] = useState(false); 
  const [contestOptions, setContestOptions] = useState([]); 

  async function getContestData() {
    setIsLoading(true); 
    try {
      const res = await enqueueRequest('https://codeforces.com/api/contest.list?gym=false'); 
      const data = await res.json(); 
      if(data.status === 'OK') {
        setContestOptions(data.result
          .filter((contest) => contest.phase === 'FINISHED' && contest.type !== 'IOI')
          .map((contest) => ({value: contest.id.toString(), label: contest.name}))
        ); 
      } else {
        throw Error(data.comment); 
      }
    } catch(err) {
      console.log(err.message); 
    }
    setIsLoading(false); 
  }
  
  return (
    <Row className='contest-select mx-auto my-3 p-1'>
      <Select
        classNames={{
          control: (_) => `bg-${theme}`,
          input: (_) => `text-${getInverseTheme(theme)}`,
          menu: (_) => `bg-${theme}`,
          placeholder: (_) => `text-${getInverseTheme(theme)}`,
          option: (state) => {
            if(state.isSelected) {
              return 'bg-primary'; 
            } else if(state.isFocused) {
              return 'bg-info'; 
            }
            return ''; 
          },
          singleValue: (_) => `text-${getInverseTheme(theme)}`
        }} 
        options={contestOptions}
        filterOption={(contestOption, inputValue) => contestOption.label.toLowerCase().includes(inputValue.toLowerCase())} 
        isClearable={true}
        isLoading={isLoading}
        onFocus={_ => getContestData()}
        onChange={newValue => setContestId(newValue ? parseInt(newValue.value) : 0)}
      />
    </Row>
  )
}

function Scoreboard({ theme = 'light', contestId, handle, setPoints, setPenalty, isLoading, setIsLoading }) {
  const [contest, setContest] = useState(null); 
  const [problems, setProblems] = useState([]);  
  const [initialScores, setInitialScores] = useState([]); 
  const [scores, setScores] = useState([]); 
  const [submitTimes, setSubmitTimes] = useState([]); 
  const [attemptCounts, setAttemptCounts] = useState([]); 

  function getProblemLink(contestId, index) {
    return `https://codeforces.com/contest/${contestId}/problem/${index}`; 
  }

  function getTimeStr(value) {
    if(!value.length) {
      return '--:--'; 
    }
    const hr = Math.floor(parseInt(value) / 60); 
    const min = parseInt(value) % 60; 
    return `${hr.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
  }
  
  function getTotalTime(type, scores) {
    let totalTime = 0; 
    for(const s of scores) {
      if(s.hasOwnProperty('bestSubmissionTimeSeconds')) {
        totalTime += Math.floor(s.bestSubmissionTimeSeconds/60); 
        if(type === 'ICPC') {
          totalTime += 10*s.rejectedAttemptCount; 
        }
      }
    }
    return totalTime; 
  }
  
  function updateScore(index) {
    let newScores = scores.slice(); 
    let newSubmitTimes = submitTimes.slice(); 
    let newAttemptCounts = attemptCounts.slice(); 
    newScores[index] = Object.assign({}, scores[index]); 
    if(!newAttemptCounts[index].length) {
      newAttemptCounts[index] = '0'; 
    }
    newScores[index].rejectedAttemptCount = parseInt(newAttemptCounts[index]);
    if(newSubmitTimes[index].length) {
      newScores[index].bestSubmissionTimeSeconds = parseInt(newSubmitTimes[index]) * 60; 
      if(newScores[index].bestSubmissionTimeSeconds > contest.durationSeconds) {
        newScores[index].bestSubmissionTimeSeconds = contest.durationSeconds; 
        newSubmitTimes[index] = Math.floor(contest.durationSeconds / 60).toString(); 
      }
      if(contest.type === 'CF') {
        const min = Math.floor(newScores[index].bestSubmissionTimeSeconds / 60); 
        const decrement = Math.floor(problems[index].points / 250); 
        const penalty = 50 * newScores[index].rejectedAttemptCount; 
        newScores[index].points = Math.max(problems[index].points - min * decrement - penalty, 
          Math.floor(problems[index].points * 0.3)); 
      } else {
        newScores[index].points = 1;
      }
    } else {
      delete newScores[index].bestSubmissionTimeSeconds; 
      newScores[index].points = 0; 
    }
    setScores(newScores); 
    setSubmitTimes(newSubmitTimes); 
    setAttemptCounts(newAttemptCounts); 
    setPoints(newScores.reduce((acc, cur) => acc + cur.points, 0)); 
    setPenalty(contest.type === 'ICPC' ? getTotalTime('ICPC', newScores) : 0); 
  }

  useEffect(() => {
    let ignore = false; 
    const defaultProblems = ['A','B','C','D','E'].map(idx => ({index: idx})); 

    function setNullContest() {
      setContest(null); 
      setProblems(defaultProblems); 
      setInitialScores(Array(defaultProblems.length).fill({points: 0., rejectedAttemptCount: 0})); 
      setScores(Array(defaultProblems.length).fill({points: 0., rejectedAttemptCount: 0}));
      setSubmitTimes(Array(defaultProblems.length).fill('')); 
      setAttemptCounts(Array(defaultProblems.length).fill('0')); 
      setPoints(0); 
      setPenalty(0); 
    }

    async function getScores() {
      setIsLoading(true); 
      const res = await enqueueRequest(
        `https://codeforces.com/api/contest.standings?contestId=${contestId}` + 
        `&from=1&count=1&showUnofficial=true&handles=${handle}`
      ); 
      const data = await res.json(); 
      if(!ignore) {
        if(data.status === 'OK') {
          setContest(data.result.contest); 
          setProblems(data.result.problems); 
          if(handle.length && data.result.rows.length && data.result.rows[0].party.participantType !== 'PRACTICE') {
            setInitialScores(data.result.rows[0].problemResults); 
            setScores(data.result.rows[0].problemResults); 
            setSubmitTimes(data.result.rows[0].problemResults.map(s => s.hasOwnProperty('bestSubmissionTimeSeconds') ? 
              Math.floor(s.bestSubmissionTimeSeconds/60).toString() : '')); 
            setAttemptCounts(data.result.rows[0].problemResults.map(s => s.rejectedAttemptCount.toString()));  
            setPoints(data.result.rows[0].problemResults.reduce((acc, cur) => acc + cur.points, 0)); 
            setPenalty(data.result.contest.type === 'ICPC' ? getTotalTime(data.result.contest.type, 
              data.result.rows[0].problemResults) : 0); 
          } else {
            setInitialScores(Array(data.result.problems.length).fill({points: 0., rejectedAttemptCount: 0})); 
            setScores(Array(data.result.problems.length).fill({points: 0., rejectedAttemptCount: 0})); 
            setSubmitTimes(Array(data.result.problems.length).fill('')); 
            setAttemptCounts(Array(data.result.problems.length).fill('0')); 
            setPoints(0); 
            setPenalty(0); 
          }
        } else {
          const resNoHandle = await enqueueRequest(`https://codeforces.com/api/contest.standings?contestId=${contestId}&from=1&count=1`); 
          const dataNoHandle = await resNoHandle.json();  
          if(dataNoHandle.status === 'OK') {
            setContest(dataNoHandle.result.contest); 
            setProblems(dataNoHandle.result.problems); 
            setInitialScores(Array(dataNoHandle.result.problems.length).fill({points: 0., rejectedAttemptCount: 0})); 
            setScores(Array(dataNoHandle.result.problems.length).fill({points: 0., rejectedAttemptCount: 0})); 
            setSubmitTimes(Array(dataNoHandle.result.problems.length).fill('')); 
            setAttemptCounts(Array(dataNoHandle.result.problems.length).fill('0')); 
            setPoints(0); 
            setPenalty(0); 
          } else {
            setNullContest(); 
          }
        }
      }
      setIsLoading(false); 
    }

    if(contestId) {
      getScores(); 
    } else {
      setNullContest(); 
    }

    return () => ignore = true; 
  }, [contestId, handle, setPoints, setPenalty, setIsLoading]); 

  if(!isLoading) {
    return (
      <Row className='scoreboard mx-auto my-3 p-1'>
        <Table size='sm' variant={theme} responsive className='mx-auto'>
          <colgroup span={(problems.length+1).toString()}></colgroup>
          <thead>
            <tr className='top-row'>
              <th className={`border border-${getInverseTheme(theme)} text-center`}>
                <span>=</span>
              </th>
              {problems.map(p => 
                <th key={contestId + p.index} className={`border border-${getInverseTheme(theme)} text-center`}>
                  <span>
                    {!contest ? <>{p.index}</> : <a href={getProblemLink(contestId, p.index)} 
                      target='_blank' rel='noreferrer'>{p.index}</a>}
                  </span>
                </th>     
              )}
              <th className='border-0'></th>
            </tr>
          </thead>
          <tbody>
            <tr className='top-row'>
              <td className={`border border-${getInverseTheme(theme)} text-center`}>
                <span>{scores.reduce((acc, cur) => acc + cur.points, 0)}</span>
              </td>
              {scores.map((s, idx) => 
                <td key={contestId + problems[idx].index} className={`${(!contestId ? 'bg-secondary' : '')} border border-${getInverseTheme(theme)} text-center`}>
                  {contest ? <PointsCell theme={theme} type={contest.type} score={s} /> : <span></span>}
                </td>
              )}
              <td className='border-0'></td>
            </tr>
            <tr className='bottom-row'>
              <td className={`border border-${getInverseTheme(theme)} text-center`}>
                <span>{contest ? getTotalTime(contest.type, scores) : 0}</span>
              </td>
              {scores.map((s, idx) =>
                <td key={contestId + problems[idx].index} className={`${(!contestId ? 'bg-secondary' : '')} border border-${getInverseTheme(theme)} text-center`}>
                  <FocusedInput 
                    className='p-0' theme={theme}
                    focusType='number' blurType='text'
                    disabled={!contest}
                    onChange={e => {
                      if(!isNaN(e.target.value)) {
                        let newSubmitTimes = submitTimes.slice(); 
                        newSubmitTimes[idx] = e.target.value; 
                        setSubmitTimes(newSubmitTimes); 
                      }
                    }}
                    onKeyDown={e => {
                      if(e.key === 'Enter') {
                        e.preventDefault(); 
                        updateScore(idx); 
                      }
                    }}
                    focusValue={submitTimes[idx]}
                    onBlur={_ => updateScore(idx)}
                    blurValue={getTimeStr(submitTimes[idx])}
                  />
                </td> 
              )}
              <td className='border-0'></td>
            </tr>
            <tr className='bottom-row'>
              <td className={`border border-${getInverseTheme(theme)} text-center`}>
                <span>{scores.reduce((acc, cur) => acc + cur.rejectedAttemptCount, 0)}</span>
              </td>
              {scores.map((s, idx) =>
                <td key={contestId + problems[idx].index} className={`${(!contestId ? 'bg-secondary' : '')} border border-${getInverseTheme(theme)} text-center`}>
                  <Form.Control
                    type='number' size='md' className='p-0'
                    style={{color: theme === 'light' ? 'black' : 'white'}}
                    disabled={!contest}
                    value={attemptCounts[idx]}
                    onChange={e => {
                      let newAttemptCounts = attemptCounts.slice(); 
                      newAttemptCounts[idx] = e.target.value; 
                      setAttemptCounts(newAttemptCounts); 
                    }}
                    onKeyDown={e => {
                      if(e.key === 'Enter') {
                        e.preventDefault(); 
                        updateScore(idx); 
                      }
                    }}
                    onBlur={_ => updateScore(idx)}
                  >
                  </Form.Control>
                </td>
              )}
              <td className='border-0'>
                <button 
                  className='scoreboard-refresh-button' 
                  disabled={!contest} 
                  onClick={e => {
                    e.preventDefault(); 
                    setScores(initialScores); 
                    setSubmitTimes(initialScores.map(s => s.hasOwnProperty('bestSubmissionTimeSeconds') ? 
                      Math.floor(s.bestSubmissionTimeSeconds/60).toString() : '')); 
                    setAttemptCounts(initialScores.map(s => s.rejectedAttemptCount.toString()));  
                    setPoints(initialScores.reduce((acc, cur) => acc + cur.points, 0)); 
                    setPenalty(contest.type === 'ICPC' ? getTotalTime(contest.type, initialScores) : 0); 
                  }}
                >
                  <ArrowClockwise width='1em' height='1em' color={theme === 'light' ? 'black' : 'white'}/>
                </button>
              </td>
            </tr>
          </tbody>
        </Table>
        
      </Row>
    ); 
  } else {
    return (
      <Row className='scoreboard mx-auto my-3 p-1'>
        <Spinner animation='border' variant={getInverseTheme(theme)} className='m-auto'/>
      </Row>
    ); 
  }
} 

function PointsCell({ theme = 'light', type, score }) {
  return (
    <span className={score.points ? 'cell-accepted' : `cell-rejected-${theme}`}>
      {score.points ? 
        (type === 'CF' ? score.points.toString() : `+${score.rejectedAttemptCount ? score.rejectedAttemptCount : ''}`) :
        (score.rejectedAttemptCount ? `-${score.rejectedAttemptCount}` : ' ')}
    </span>
  ); 
}

function FocusedInput({ className = '', theme = 'light', focusType = 'text', blurType = 'text', 
                        disabled, onChange, onKeyDown, onFocus, focusValue, onBlur, blurValue}) {
  const [focused, setFocused] = useState(false); 

  return (
    <Form.Control 
      size='md' className={className}
      style={{color: theme === 'light' ? 'black' : 'white'}}
      type={focused ? focusType : blurType}
      disabled={disabled ? disabled : false}
      onChange={e => {
        if(onChange) {
          onChange(e); 
        }
      }}
      onKeyDown={e => {
        if(onKeyDown) {
          onKeyDown(e); 
        }
      }}
      onFocus={e => {
        if(onFocus) {
          onFocus(e); 
        }
        setFocused(true);
      }}
      onBlur={e => {
        if(onBlur) {
          onBlur(e); 
        }
        setFocused(false); 
      }}
      value={focused ? focusValue : blurValue}  
    ></Form.Control> 
  ); 
}

function SubmitButton({ disabled }) {
  return (
    <Row className='submit-button mx-auto my-3 p-1'>
      <Button type='submit' variant='outline-primary' disabled={disabled}>Calculate</Button>
    </Row>
  ); 
}

function ResultTable({ theme = 'light', results }) {
  if(results) {
    return (
      <Table striped hover size='xl' variant={theme} className={`mx-auto border-top border-bottom border-${getInverseTheme(theme)} shadow`}>
        <tbody>
          <tr>
            <th className={`py-3 border-start border-${getInverseTheme(theme)} text-start`}><span>Results</span></th>
            <th className={`py-3 border-end border-${getInverseTheme(theme)} text-end`}><span></span></th>
          </tr>
          <tr>
            <td className={`py-3 border-start border-${getInverseTheme(theme)} text-start`}><span>Expected Rank</span></td>
            <td className={`py-3 border-end border-${getInverseTheme(theme)} text-end`}><span>{Math.floor(results.seed)}</span></td>
          </tr>
          <tr>
            <td className={`py-3 border-start border-${getInverseTheme(theme)} text-start`}><span>Actual Rank</span></td>
            <td className={`py-3 border-end border-${getInverseTheme(theme)} text-end`}><span>{results.rank}</span></td>
          </tr>
          <tr>
            <td className={`py-3 border-start border-${getInverseTheme(theme)} text-start`}><span>Performance</span></td>
            <td className={`py-3 border-end border-${getInverseTheme(theme)} text-end`}>
              <span style={{fontWeight: 'bold'}} className={`user-${getRatingColor(results.performance)}`}>
                {results.performance}
              </span>
            </td>
          </tr>
          <tr>
            <td className={`py-3 border-start border-${getInverseTheme(theme)} text-start`}><span>Rating Change</span></td>
            <td className={`py-3 border-end border-${getInverseTheme(theme)} text-end`}>
              <span style={{fontWeight: 'bold'}} className={`rating-${results.delta ? (results.delta > 0 ? 'increase' : 'decrease') : 'constant'}`}>
                {`${results.delta > 0 ? '+' : ''}${results.delta}`}
              </span>
            </td>
          </tr>
        </tbody>
      </Table>
    );
  } else {
    return <></>; 
  }
}

function CalculatorOutput({ theme = 'light', calculationStatus, results }) {
  switch(calculationStatus) {
    case CalculationStatus.CALCULATION_IN_PROGRESS: 
      return (
        <Row className='calculator-output mx-auto my-3 text-center'>
          <Spinner animation='border' variant={getInverseTheme(theme)} className='mx-auto'/>
        </Row>
      ); 
    case CalculationStatus.CALCULATION_DONE: 
      return (
        <Row className='calculator-output mx-auto my-3 text-center'>
          <ResultTable theme={theme} results={results} />
        </Row>
      ); 
    case CalculationStatus.CALCULATION_FAILED: 
      return (
        <Row className='calculator-output mx-auto my-3 text-center'>
          <span className='mx-auto text-danger'>Contest not found, or not rated, or not finished yet.</span>
        </Row>
      ); 
    default: 
      return <></>; 
  } 
}