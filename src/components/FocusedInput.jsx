import { useState } from 'react';
import Form from 'react-bootstrap/Form';

import { getInverseTheme } from '../utils';
import { useTheme } from '../ThemeContext';

export default function FocusedInput(props) {
  const { theme } = useTheme();
  const {
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
