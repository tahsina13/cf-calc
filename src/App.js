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
import InputGroup from 'react-bootstrap/InputGroup'; 
import Modal from 'react-bootstrap/Modal';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Row from 'react-bootstrap/Row'; 
import Spinner from 'react-bootstrap/Spinner'; 
import Table from 'react-bootstrap/Table'; 
import { ArrowClockwise, BrightnessHighFill, MoonStarsFill, Github } from 'react-bootstrap-icons';

import AsyncSelect from 'react-select/async'; 
import { AsyncFzf } from 'fzf';

// Utility enums and functions
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
        <CalculatorOutput 
          theme={theme} 
          calculationStatus={calculationStatus} 
          results={results} 
        />
      </Container>
    </>
  );    
}

function Calculator({ theme = 'light', calculationStatus, setCalculationStatus, setResults }) {
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
          />
          <SubmitButton 
            theme={theme} 
            disabled={(!user && !rating.length) || !contestId || points < 0 || penalty < 0 ||
              calculationStatus === CalculationStatus.CALCULATION_IN_PROGRESS}
          /> 
        </Form>
      </Card>
    </Row>
  );
}

function UserInfo({ theme = 'light', user, setUser, rating, setRating }) {  
  const [handle, setHandle] = useState(''); 
  const [isHandleFocused, setIsHandleFocused] = useState(false); 
  const [isLoading, setIsLoading] = useState(false); 
  const [request, setRequest] = useState(null); 

  const updateUserInfo = async (handle) => {
    request?.abort(); 
    setHandle(handle); 
    setIsLoading(true); 
    const req = enqueueRequest(`https://codeforces.com/api/user.info?handles=${handle}`); 
    setRequest(req); 
    try {
      const data = await req.ready; 
      if(data.status === 'OK') {
        if(data.result.length && data.result[0].hasOwnProperty('rating')) {
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
    setIsLoading(false); 
  }

  return (
    <Row className='user-info mx-auto my-3 p-1'>
      <Col>
        <InputGroup>
          <FocusedInput
            theme={theme}
            placeholder='Your Handle'
            classNames={{
              both: `shadow-none ${isLoading ? 'border-end-0' : ''}`,
              blur: user && user.hasOwnProperty('rating') ? `user-${getRatingColor(user.rating)} fw-bold` : ''
            }}
            types={{both: 'text'}}
            values={{both: handle}}
            onChange={e => updateUserInfo(e.target.value)}
            onKeyDown={e => {
              if(e.key === 'Enter') {
                e.preventDefault(); 
              }
            }}
            onFocus={() => setIsHandleFocused(true)}
            onBlur={() => setIsHandleFocused(false)}
          />
          {isLoading && 
            <InputGroup.Text className={`bg-${theme} border-start-0 ${isHandleFocused ? 'border-2 border-primary' : ''}`}>
              <Spinner size='sm' animation='grow' variant={getInverseTheme(theme)}/>
            </InputGroup.Text>}
        </InputGroup>
      </Col>
      <Col>
        <FocusedInput
          theme={theme}
          placeholder='Old Rating'
          types={{both: 'number'}}
          values={{both: rating}}
          classNames={{
            both: 'shadow-none',
            blur: rating.length ? `user-${getRatingColor(rating)} fw-bold` : ''
          }}
          onChange={e => setRating(e.target.value)}
          onKeyDown={e => {
            if(e.key === 'Enter') {
              e.preventDefault(); 
            }
          }}
        />
      </Col>
    </Row>
  ); 
}

function FocusedInput(props) {
  const {
    theme = 'light', 
    size = 'md',
    step = '1',
    placeholder,
    disabled,
    styles, 
    classNames,
    types, 
    values, 
    onChange,
    onKeyDown,
    onFocus,
    onBlur,
  } = props; 
  const [focused, setFocused] = useState(false); 

  return (
    <Form.Control 
      size={size}
      step={step}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        ...(styles && styles.hasOwnProperty('both') ? styles.both : {}), 
        ...(focused 
            ? (styles && styles.hasOwnProperty('focus') ? styles.focus : {}) 
            : (styles && styles.hasOwnProperty('blur') ? styles.blur : {}))
      }}
      className={[
        `bg-${theme}`,
        `text-${getInverseTheme(theme)}`,
        classNames && classNames.hasOwnProperty('both') ? classNames.both : '',
        focused ? 'border-2 border-primary' : '',
        focused
          ? (classNames && classNames.hasOwnProperty('focus') ? classNames.focus : '')
          : (classNames && classNames.hasOwnProperty('blur') ? classNames.blur : '')
      ].join(' ')}
      type={types && types.hasOwnProperty('both')
        ? types.both 
        : focused 
        ? (types && types.hasOwnProperty('focus') ? types.focus : '') 
        : (types && types.hasOwnProperty('blur') ? types.blur : '')}
      value={values && values.hasOwnProperty('both')
        ? values.both
        : focused
        ? (values && values.hasOwnProperty('focus') ? values.focus : '')
        : (values && values.hasOwnProperty('blur') ? values.blur : '')
      }
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
    ></Form.Control> 
  ); 
}

function ContestSelect({ theme = 'light', setContestId }) {
  const [contestFzf, setContestFzf] = useState(new AsyncFzf([])); 
  const [defaultOptions, setDefaultOptions] = useState([]); 
  const [isLoading, setIsLoading] = useState(false); 

  const Option = (props) => {
    const {
      cx,
      data,
      getStyles,
      getClassNames,
      isDisabled,
      isFocused,
      isSelected,
      innerRef,
      innerProps,
    } = props;

    const textBlocks = []; 
    for(let i = 0; i < data.label.length;) {
      let j = i; 
      while(j < data.label.length && data.positions.has(i) === data.positions.has(j)) {
        j++;  
      }
      textBlocks.push(data.positions.has(i)
        ? <span key={`${data.value}-${i}`} style={{color: theme === 'light' ? 'gold' : 'lime'}} className='fw-bold'>
            {data.label.slice(i, j)}
          </span>
        : <span key={`${data.value}-${i}`}>{data.label.slice(i, j)}</span>); 
      i = j;   
    }

    return (
      <div
        ref={innerRef}
        style={getStyles('option', props)}
        className={cx(
          {
            option: true,
            'option--is-disabled': isDisabled,
            'option--is-focused': isFocused,
            'option--is-selected': isSelected,
          },
          getClassNames('option', props)
        )}
        {...innerProps}
      >
        {textBlocks}
      </div>
    );
  };

  const getContestData = async () => {
    setIsLoading(true); 
    try {
      const data = await enqueueRequest('https://codeforces.com/api/contest.list?gym=false').ready; 
      if(data.status === 'OK') {
        const fzf = new AsyncFzf(data.result
          .filter((contest) => contest.phase === 'FINISHED' && contest.type !== 'IOI')
          .map((contest) => ({value: contest.id.toString(), label: contest.name, relativeTimeSeconds: contest.relativeTimeSeconds})),
          { selector: item => item.label, tiebreakers: [(a, b) => a.item.relativeTimeSeconds - b.item.relativeTimeSeconds] }); 
        setContestFzf(fzf); 
        const entries = await fzf.find(''); 
        setDefaultOptions(entries.map(e => ({...e.item, positions: e.positions}))); 
      } else {
        throw Error(data.comment); 
      }
    } catch(err) {
      console.log(err.message); 
    }
    setIsLoading(false); 
  }; 

  const loadOptions = async (inputValue, callback) => {
    try {
      const entries = await contestFzf.find(inputValue); 
      const options = entries.map(e => ({...e.item, positions: e.positions})); 
      callback(options); 
    } catch {} 
  };

  return (
    <Row className='contest-select mx-auto my-3 p-1'>
      <AsyncSelect
        components={{ Option }}
        classNames={{
          control: (state) => `bg-${theme} ${state.isFocused ? 'border-2 border-primary' : ''}`,
          input: () => `text-${getInverseTheme(theme)}`,
          menu: () => `bg-${theme}`,
          placeholder: () => `text-${getInverseTheme(theme)}`,
          option: (state) => 
            state.isSelected ? 'bg-primary' :
            state.isFocused ? 'bg-info' : '',
          singleValue: () => `text-${getInverseTheme(theme)}`
        }} 
        isClearable={true}
        isLoading={isLoading}
        onFocus={getContestData}
        onChange={newValue => setContestId(newValue ? parseInt(newValue.value) : 0)}
        cacheOptions={!isLoading} defaultOptions={defaultOptions} loadOptions={loadOptions}
      />
    </Row>
  );
}

function Scoreboard({ theme = 'light', contestId, handle, setPoints, setPenalty }) {
  const [contest, setContest] = useState({id: 0}); 
  const [problems, setProblems] = useState([]);  
  const [initialScores, setInitialScores] = useState([]); 
  const [scores, setScores] = useState([]); 
  const [submitTimes, setSubmitTimes] = useState([]); 
  const [attemptCounts, setAttemptCounts] = useState([]); 
  const [isLoading, setIsLoading] = useState(false); 

  const getProblemLink = (contestId, index) => 
    `https://codeforces.com/contest/${contestId}/problem/${index}`; 

  const getTimeStr = (value) => {
    if(!value.length) {
      return '--:--'; 
    }
    const hr = Math.floor(parseInt(value) / 60); 
    const min = parseInt(value) % 60; 
    return `${hr.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
  }
  
  const getTotalTime = (type, scores) => {
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
  
  const updateScore = (index) => {
    const newScores = scores.slice(); 
    const newSubmitTimes = submitTimes.slice(); 
    const newAttemptCounts = attemptCounts.slice(); 
    newScores[index] = Object.assign({}, scores[index]); 
    if(!newAttemptCounts[index].length || parseInt(newAttemptCounts[index]) < 0) {
      newAttemptCounts[index] = '0'; 
    }
    newScores[index].rejectedAttemptCount = parseInt(newAttemptCounts[index]);
    if(!newSubmitTimes[index].length || parseInt(newSubmitTimes[index]) < 0) {
      delete newScores[index].bestSubmissionTimeSeconds; 
      newScores[index].points = 0; 
      newSubmitTimes[index] = ''; 
    } else {
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
    }
    setScores(newScores); 
    setSubmitTimes(newSubmitTimes); 
    setAttemptCounts(newAttemptCounts); 
    setPoints(newScores.reduce((acc, cur) => acc + cur.points, 0)); 
    setPenalty(contest.type === 'ICPC' ? getTotalTime('ICPC', newScores) : 0); 
  }

  useEffect(() => {
    const defaultProblems = ['A','B','C','D','E'].map(idx => ({index: idx})); 
    let ignore = false; 
    let request = null; 

    const setupScoreboard = (data) => {
      if(data) {
        setContest(data.contest); 
        setProblems(data.problems); 
        const hasRow = data.rows.length && data.rows[0].party.participantType !== 'PRACTICE' && 
          handle.toLowerCase() === data.rows[0].party.members[0].handle.toLowerCase(); 
        if(hasRow) {
          setInitialScores(data.rows[0].problemResults); 
          setScores(data.rows[0].problemResults); 
          setSubmitTimes(data.rows[0].problemResults.map(s => s.hasOwnProperty('bestSubmissionTimeSeconds') 
            ? Math.floor(s.bestSubmissionTimeSeconds/60).toString() : '')); 
          setAttemptCounts(data.rows[0].problemResults.map(s => s.rejectedAttemptCount.toString()));  
          setPoints(data.rows[0].problemResults.reduce((acc, cur) => acc + cur.points, 0)); 
          setPenalty(data.contest.type === 'ICPC' ? getTotalTime(data.contest.type, data.rows[0].problemResults) : 0); 
        } else {
          setInitialScores(Array(data.problems.length).fill({points: 0., rejectedAttemptCount: 0})); 
          setScores(Array(data.problems.length).fill({points: 0., rejectedAttemptCount: 0})); 
          setSubmitTimes(Array(data.problems.length).fill('')); 
          setAttemptCounts(Array(data.problems.length).fill('0')); 
          setPoints(0); 
          setPenalty(0);
        }
      } else {
        setContest({id: 0}); 
        setProblems(defaultProblems); 
        setInitialScores(Array(defaultProblems.length).fill({points: 0., rejectedAttemptCount: 0})); 
        setScores(Array(defaultProblems.length).fill({points: 0., rejectedAttemptCount: 0}));
        setSubmitTimes(Array(defaultProblems.length).fill('')); 
        setAttemptCounts(Array(defaultProblems.length).fill('0')); 
      }
    }

    const getScores = async () => {
      setIsLoading(true); 
      request = enqueueRequest(
        `https://codeforces.com/api/contest.standings?contestId=${contestId}` + 
        `&from=1&count=1&showUnofficial=true&handles=${handle}`
      );
      try {
        const data = await request.ready; 
        if(!ignore) {
          setupScoreboard(data?.result); 
        }
      } catch(err) {
        console.log(err.message); 
      }
      setIsLoading(false); 
    }

    setPoints(-1); 
    setPenalty(-1); 
    if(contestId) {
      getScores(); 
    } else {
      setupScoreboard(); 
    }

    return () => {
      ignore = false; 
      request?.abort(); 
    }
  }, [contestId, handle, setPoints, setPenalty, setIsLoading ]); 

  const labelCellClasses = [
    'border', `border-${getInverseTheme(theme)}`, 
    'text-center'].join(' '); 
  const inputCellClasses = [
    `${!contestId ? 'bg-secondary' : ''}`, 
    'border', `border-${getInverseTheme(theme)}`, 
    'text-center'].join(' '); 
  if(!isLoading) {
    return (
      <Row className='scoreboard mx-auto my-3 p-1'>
        <Table size='sm' variant={theme} responsive className='mx-auto'>
          <colgroup span={(problems.length+1).toString()}></colgroup>
          <thead>
            <tr className='top-row'>
              <th className={labelCellClasses}>
                <span>=</span>
              </th>
              {problems.map(p => 
                <th key={contestId + p.index} className={labelCellClasses}>
                  <span>
                    {!contest 
                      ? <>{p.index}</> 
                      : <a href={getProblemLink(contestId, p.index)} target='_blank' rel='noreferrer'>{p.index}</a>}
                  </span>
                </th>     
              )}
              <th className='border-0'></th>
            </tr>
          </thead>
          <tbody>
            <tr className='top-row'>
              <td className={labelCellClasses}>
                <span>{scores.reduce((acc, cur) => acc + cur.points, 0)}</span>
              </td>
              {scores.map((score, idx) => 
                <PointsCell 
                  theme={theme} 
                  className={inputCellClasses} 
                  contest={contest}
                  handle={handle}
                  index={problems[idx].index}
                  score={score}
                />
              )}
              <td className='border-0'></td>
            </tr>
            <tr className='bottom-row'>
              <td className={labelCellClasses}>
                <span>{contest ? getTotalTime(contest.type, scores) : 0}</span>
              </td>
              {submitTimes.map((submitTime, idx) =>
                <td key={contestId + problems[idx].index} className={inputCellClasses}>
                  <FocusedInput 
                    theme={theme}
                    disabled={!contest.id}
                    classNames={{both: 'p-0'}}
                    types={{focus: 'number', blur: 'text'}}
                    values={{focus: submitTime, blur: getTimeStr(submitTime)}}
                    onChange={e => {
                      let newSubmitTimes = submitTimes.slice(); 
                      newSubmitTimes[idx] = e.target.value; 
                      setSubmitTimes(newSubmitTimes); 
                    }}
                    onKeyDown={e => {
                      if(e.key === 'Enter') {
                        e.preventDefault(); 
                        updateScore(idx); 
                      }
                    }}
                    onBlur={() => updateScore(idx)}
                  />
                </td> 
              )}
              <td className='border-0'></td>
            </tr>
            <tr className='bottom-row'>
              <td className={labelCellClasses}>
                <span>{scores.reduce((acc, cur) => acc + cur.rejectedAttemptCount, 0)}</span>
              </td>
              {attemptCounts.map((attemptCount, idx) =>
                <td key={contestId + problems[idx].index} className={inputCellClasses}>
                  <FocusedInput
                    theme={theme}
                    disabled={!contest.id}
                    classNames={{both: 'p-0'}}
                    types={{both: 'number'}}
                    values={{both: attemptCount}}
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
                    onBlur={() => updateScore(idx)}
                  />
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

function PointsCell({ theme = 'light', className, contest, handle, index, score}) {
  const [showSubmissions, setShowSubmissions] = useState(false); 
  const [submissions, setSubmissions] = useState([]); 
  const [isLoading, setIsLoading] = useState(false); 
  const [request, setRequest] = useState(null); 

  const getSubmissionLink = (contestId, submissionId) => 
    `https://codeforces.com/contest/${contestId}/submission/${submissionId}`; 

  const getDateStr = (sec) => {
    const d = new Date(sec*1000); 
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; 
    return `${months[d.getMonth()]}/${d.getDate()}/${d.getFullYear()} 
      ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  const getVerdictStr = (verdict, passedTestCount) => {
    switch(verdict) {
      case 'OK': 
        return 'Accepted'; 
      case 'COMPILATION_ERROR':
        return 'Compilation error'; 
      case 'RUNTIME_ERROR': 
        return `Runtime error on test ${passedTestCount+1}`;
      case 'WRONG_ANSWER':
        return `Wrong answer on test ${passedTestCount+1}`; 
      case 'PRESENTATION_ERROR':
        return `Presentation error on test ${passedTestCount+1}`
      case 'TIME_LIMIT_EXCEEDED':
        return `Time limit exceeded on test ${passedTestCount+1}`; 
      case 'MEMORY_LIMIT_EXCEEDED':
        return `Memory limit exceeded on test ${passedTestCount+1}`; 
      case 'IDLENESS_LIMIT_EXCEEDED':
        return `Idleness limit exceeded on test ${passedTestCount+1}`
      case 'CHALLENGED':
        return 'Hacked'; 
      case 'SKIPPED': 
        return 'Skipped'; 
      case 'TESTING':
        return `Running on test ${passedTestCount+1}`
      default: 
        return ''; 
    }
  }

  const getVerdictClass = (verdict) => {
    switch(verdict) {
      case 'OK': 
        return 'cell-accepted'; 
      case 'CHALLENGED':
        return 'cell-hacked'; 
      case 'SKIPPED': 
        return ''; 
      case 'TESTING':
        return 'cell-testing'; 
      default: 
        return `cell-rejected-${theme}`
    }
  }

  const handleShow = async () => {
    if(contest.id) {
      setShowSubmissions(true); 
      setSubmissions([]); 
      setIsLoading(true); 
      if(contest.id && handle.length) {
        const req = enqueueRequest(`https://codeforces.com/api/contest.status?contestId=${contest.id}&handle=${handle}`);   
        setRequest(req); 
        try {
          const data = await req.ready; 
          if(data.status === 'OK') {
            setSubmissions(data.result.filter(s => s.problem.index === index).reverse()); 
          } else {
            throw Error(data.message); 
          }
        } catch(err) {
          console.log(err.message);  
        }
      }
      setIsLoading(false); 
    }
  }

  const handleHide = () => {
    request?.abort(); 
    setShowSubmissions(false); 
  }

  return (
    <td key={contest.id + index} className={className} onDoubleClick={handleShow}>
      <span className={score.points ? 'cell-accepted' : `cell-rejected-${theme}`}>
        {score.points 
          ? (contest?.type === 'CF' 
          ? score.points.toString() 
          : `+${score.rejectedAttemptCount ? score.rejectedAttemptCount : ''}`) 
          : (score.rejectedAttemptCount ? `-${score.rejectedAttemptCount}` : ' ')}
      </span>
      <Modal show={showSubmissions} onHide={handleHide} className='mx-auto'>
        <Modal.Header closeButton closeVariant={theme === 'dark' ? 'white' : ''} className={`bg-${theme}`}>
          <Modal.Title className={`text-${getInverseTheme(theme)}`}>Submissions</Modal.Title>
        </Modal.Header>
        <Modal.Body className={`bg-${theme}`}>
          {isLoading
            ? <Spinner animation='border' variant={getInverseTheme(theme)} size='sm' />
            : submissions.length
            ? <ul style={{listStyle: 'none'}} className={`text-${getInverseTheme(theme)} p-1`}>
                {submissions.map(s => 
                  <li key={s.id}>
                    <span>{getDateStr(s.creationTimeSeconds)}</span>
                    &nbsp;&nbsp; 
                    <span className={getVerdictClass(s.verdict)}>{getVerdictStr(s.verdict, s.passedTestCount)}</span>
                    <span> → </span>
                    <a href={getSubmissionLink(contest.id, s.id)} target='_blank' rel='noreferrer'>{s.id}</a>
                  </li>)}
              </ul>
            : <span className={`text-${getInverseTheme(theme)}`}>No submissions found.</span>}
        </Modal.Body>
      </Modal>
    </td>
  ); 
}

function SubmitButton({ theme = 'light', disabled }) {
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

function CalculatorOutput({ theme = 'light', calculationStatus, results }) {
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
          <ResultTable theme={theme} results={results} />
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

function ResultTable({ theme = 'light', results }) {
  const labelCellClasses = ['py-3', 'border-start', `border-${getInverseTheme(theme)}`, 'text-start'].join(' '); 
  const resultCellClasses = ['py-3', 'border-end', `border-${getInverseTheme(theme)}`, 'text-end'].join(' '); 
  if(results) {
    return (
      <Table striped hover size='xl' variant={theme} 
        className={`mx-auto border-top border-bottom border-${getInverseTheme(theme)} shadow`}>
        <tbody>
          <tr>
            <th className={labelCellClasses}><span>Results</span></th>
            <th className={resultCellClasses}><span></span></th>
          </tr>
          <tr>
            <td className={labelCellClasses}><span>Expected Rank</span></td>
            <td className={resultCellClasses}><span>{Math.floor(results.seed)}</span></td>
          </tr>
          <tr>
            <td className={labelCellClasses}><span>Actual Rank</span></td>
            <td className={resultCellClasses}><span>{results.rank}</span></td>
          </tr>
          <tr>
            <td className={labelCellClasses}><span>Performance</span></td>
            <td className={resultCellClasses}>
              <span style={{fontWeight: 'bold'}} className={`user-${getRatingColor(results.performance)}`}>
                {results.performance}
              </span>
            </td>
          </tr>
          <tr>
            <td className={labelCellClasses}><span>Rating Change</span></td>
            <td className={resultCellClasses}>
              <span style={{fontWeight: 'bold'}} className={`rating-${results.delta 
                ? (results.delta > 0 ? 'increase' : 'decrease') : 'constant'}`}>
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
