import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { FormattedMessage } from 'react-intl';

export function emailValidator(value) {
  return value &&
    !/^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>().,;\s@"]+\.?)+[^<>().,;:\s@"]{2,})$/.test(
      value,
    )
    ? 'invalid.email'
    : undefined;
}

export function requiredField(value) {
  return value ? undefined : 'required.field';
}

export const renderField = ({
  input,
  type,
  placeholder,
  disabled,
  id,
  override,
  meta: { touched, error },
  children,
}) => (
  <div>
    <div className={`mb-3 ${touched && error ? 'text-danger' : ''}`}>
      {type !== 'select' && (
        <input
          {...input}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          id={id}
          {...override}
          className="form-control"
        />
      )}
      {type === 'select' && (
        <select {...input} disabled={disabled} id={id} className="form-control" {...override}>
          {children}
        </select>
      )}
      {touched && error && <FormattedMessage id={`new.user.flow.signup.error.${error}`} />}
    </div>
  </div>
);

renderField.defaultProps = {
  input: {},
  meta: {},
  type: 'text',
  placeholder: '',
  disabled: '',
  id: '',
  override: {},
  children: null,
};

renderField.propTypes = {
  input: Types.shape(),
  meta: Types.shape(),
  type: Types.string,
  placeholder: Types.string,
  disabled: Types.string,
  id: Types.string,
  override: Types.shape(),
  children: Types.arrayOf(Types.shape()),
};
