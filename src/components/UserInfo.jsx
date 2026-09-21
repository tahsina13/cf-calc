import { useState } from 'react';
import './UserInfo.css';
import Col from 'react-bootstrap/Col';
import InputGroup from 'react-bootstrap/InputGroup';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';

import { getInverseTheme, getRatingColor } from '../utils';
import { useTheme } from '../ThemeContext';
import enqueueRequest from '../timedRequest';
import FocusedInput from './FocusedInput';

export default function UserInfo({ user, setUser, rating, setRating }) {
  const { theme } = useTheme();
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
