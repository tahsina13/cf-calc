import { useState } from 'react';
import './UserInfo.css';
import Row from 'react-bootstrap/Row';
import AsyncSelect from 'react-select/async';
import { AsyncFzf } from 'fzf';

import { getInverseTheme } from '../utils';
import { useTheme } from '../ThemeContext';
import enqueueRequest from '../timedRequest';

function Option(props) {
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
  const { theme } = useTheme();

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
}

export default function ContestSelect({ setContestId }) {
  const { theme } = useTheme();
  const [contestFzf, setContestFzf] = useState(new AsyncFzf([]));
  const [defaultOptions, setDefaultOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
