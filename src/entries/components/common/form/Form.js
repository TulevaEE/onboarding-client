/* eslint-disable no-useless-escape */

import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Message } from 'retranslate';

export function emailValidator(value) {
  return value &&
    !/^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()\.,;\s@\"]+\.{0,1})+[^<>()\.,;:\s@\"]{2,})$/.test(
      value,
    )
    ? 'invalid.email'
    : undefined;
}

export function requiredField(value) {
  return value ? undefined : 'required.field';
}

export function length11(value) {
  return value && value.length === 11 ? undefined : 'field.length';
}

export const renderField = ({
  input,
  type,
  placeholder,
  disabled,
  id,
  meta: { touched, error },
  children,
}) => (
  <div>
    <div className={`form-group ${touched && error ? 'has-danger' : ''}`}>
      {type !== 'select' && (
        <input
          {...input}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          id={id}
          className="form-control"
        />
      )}
      {type === 'select' && (
        <select {...input} disabled={disabled} id={id} className="form-control">
          {children}
        </select>
      )}
      {touched && error && (
        <div className="form-control-feedback">
          <Message>{`new.user.flow.signup.error.${error}`}</Message>
        </div>
      )}
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
  children: null,
};

renderField.propTypes = {
  input: Types.shape(),
  meta: Types.shape(),
  type: Types.string,
  placeholder: Types.string,
  disabled: Types.string,
  id: Types.string,
  children: Types.arrayOf(Types.shape()),
};
