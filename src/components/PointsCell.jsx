import { useState } from 'react';
import './PointsCell.css';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';

import { getInverseTheme } from '../utils';
import { useTheme } from '../ThemeContext';
import enqueueRequest from '../timedRequest';

export default function PointsCell({ className, contest, handle, index, score}) {
  const { theme } = useTheme();
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
    <td className={className} onDoubleClick={handleShow}>
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
