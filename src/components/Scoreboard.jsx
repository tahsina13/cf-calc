import { useEffect, useState } from 'react';
import './Scoreboard.css';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';
import { ArrowClockwise } from 'react-bootstrap-icons';

import { getInverseTheme } from '../utils';
import { useTheme } from '../ThemeContext';
import enqueueRequest from '../timedRequest';
import FocusedInput from './FocusedInput';
import PointsCell from './PointsCell';

export default function Scoreboard({ contestId, handle, setPoints, setPenalty }) {
  const { theme } = useTheme();
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
      ignore = true;
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
                  key={contestId + problems[idx].index}
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
