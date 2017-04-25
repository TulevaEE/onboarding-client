/* eslint-disable no-confusing-arrow,no-useless-escape */

import React, { PropTypes as Types } from 'react';
import { connect } from 'react-redux';
import { Field, reduxForm } from 'redux-form';
import { Message, withTranslations } from 'retranslate';
import { Link } from 'react-router';

const required = value => value ? undefined :
<Message>new.user.flow.signup.required.field</Message>;
const email = value =>
  value && !/^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()\.,;\s@\"]+\.{0,1})+[^<>()\.,;:\s@\"]{2,})$/.test(value) ?
    <Message>new.user.flow.signup.invalid.email</Message> : undefined;

const renderField = ({ input, type, placeholder, disabled, meta: { touched, error } }) => (
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


export const SignUpForm = ({ handleSubmit, pristine, submitting, error,
translations: { translate } }) => (
  <div>
    <form id="register-form" onSubmit={handleSubmit} role="form">
      <div className="form-group">
        <Field
          component={renderField} type="text" name="firstName"
          placeholder={translate('new.user.flow.signup.firstName')}
          validate={required} disabled="disabled"
        />
      </div>
      <div className="form-group">
        <Field
          component={renderField} type="text" name="lastName"
          placeholder={translate('new.user.flow.signup.lastName')}
          validate={required} disabled="disabled"
        />
      </div>
      <div className="form-group">
        <Field
          component={renderField} type="number" name="personalCode"
          placeholder={translate('new.user.flow.signup.personalCode')}
          validate={required} disabled="disabled"
        />
      </div>
      <div className="form-group">
        <Field
          component={renderField} type="email" name="email"
          placeholder={translate('new.user.flow.signup.email')}
          validate={[required, email]}
        />
      </div>
      <div className="form-group">
        <Field
          component={renderField} type="number" name="phoneNumber"
          placeholder={translate('new.user.flow.signup.phoneNumber')}
        />
      </div>
      <div className={`form-group ${error ? 'has-danger' : ''}`}>
        {error && <div className="form-control-feedback mb-3">{error}</div>}
        <button type="submit" disabled={pristine || submitting} className={'btn btn-primary mb-2 mr-2'}>
          <Message>new.user.flow.signup.submit</Message>
        </button>
        <Link to="/steps/new-user" className={'btn btn-secondary mb-2'}>
          <Message>new.user.flow.back</Message>
        </Link>
      </div>
    </form>
  </div>
);

const noop = () => null;

SignUpForm.defaultProps = {
  handleSubmit: noop,
  pristine: true,
  submitting: false,
  error: '',
};

SignUpForm.propTypes = {
  handleSubmit: Types.func,
  pristine: Types.bool,
  submitting: Types.bool,
  error: Types.string,
  translations: Types.shape({ translate: Types.func.isRequired }).isRequired,
};

const reduxSignUpForm = reduxForm({ form: 'signUp' })(SignUpForm);
const translatedForm = withTranslations(reduxSignUpForm);

const mapStateToProps = state => ({
  initialValues: state.login.user,
});

const connectToRedux = connect(mapStateToProps, null);

const prefilledForm = connectToRedux(translatedForm);

export default prefilledForm;

