/* eslint-disable no-useless-escape */

import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';

export function emailValidator(value) {
  return value && !/^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()\.,;\s@\"]+\.{0,1})+[^<>()\.,;:\s@\"]{2,})$/.test(value) ?
    <Message>new.user.flow.signup.invalid.email</Message> : undefined;
}

export function requiredField(value) {
  return value ? undefined : <Message>new.user.flow.signup.required.field</Message>;
}

export const renderField = ({ input, type, placeholder, disabled, meta: { touched, error } }) => (
  <div>
    <div className={`form-group ${touched && error ? 'has-danger' : ''}`}>
      <input
        {...input} type={type} placeholder={placeholder} disabled={disabled}
        className="form-control"
      />
      {touched && error && <div className="form-control-feedback">{error}</div>}
    </div>
  </div>
);

renderField.defaultProps = {
  input: {},
  meta: {},
  type: 'text',
  placeholder: '',
  disabled: '',
};

renderField.propTypes = {
  input: Types.shape(),
  meta: Types.shape(),
  type: Types.string,
  placeholder: Types.string,
  disabled: Types.string,
};
