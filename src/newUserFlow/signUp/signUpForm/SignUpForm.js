/* eslint-disable no-confusing-arrow,no-useless-escape */

import React, { PropTypes as Types } from 'react';
import { connect } from 'react-redux';
import { Field, reduxForm, formValueSelector } from 'redux-form';
import { Message, withTranslations } from 'retranslate';
import { Link } from 'react-router';

const requiredField = value => value ? undefined :
<Message>new.user.flow.signup.required.field</Message>;

const emailValidator = value =>
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


export const SignUpForm = ({ handleSubmit, invalid, submitting, error, hasAcceptedTerms,
translations: { translate } }) => (
  <div>
    <form id="register-form" onSubmit={handleSubmit} role="form">
      <div className="form-group">
        <Field
          component={renderField} type="email" name="email"
          placeholder={translate('new.user.flow.signup.email')}
          validate={[requiredField, emailValidator]}
        />
      </div>
      <div className="form-group">
        <Field
          component={renderField} type="number" name="phoneNumber"
          placeholder={translate('new.user.flow.signup.phoneNumber')}
        />
      </div>
      <div className="form-check">
        <label className="custom-control custom-checkbox" htmlFor="hasAcceptedTerms">
          <Field
            component="input" name="hasAcceptedTerms" id="hasAcceptedTerms"
            type="checkbox" className="custom-control-input"
          />
          <span className="custom-control-indicator" />
          <div className="custom-control-description">
            <Message>new.user.flow.signup.tos.start</Message>
            <a href="https://drive.google.com/open?id=0BxDN-jvgOSUxd1J5LXVKWDlDa1U"><Message>new.user.flow.signup.tos.statute</Message></a>
            <Message>new.user.flow.signup.tos.end</Message>
          </div>
        </label>
      </div>
      <div className={`form-group ${error ? 'has-danger' : ''}`}>
        {error && <div className="form-control-feedback mb-3">{error}</div>}
        <button type="submit" disabled={invalid || submitting || !hasAcceptedTerms} className={'btn btn-primary mb-2 mr-2'}>
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
  invalid: true,
  submitting: false,
  error: '',
  hasAcceptedTerms: false,
};

SignUpForm.propTypes = {
  handleSubmit: Types.func,
  invalid: Types.bool,
  submitting: Types.bool,
  error: Types.string,
  hasAcceptedTerms: Types.bool,
  translations: Types.shape({ translate: Types.func.isRequired }).isRequired,
};

const reduxSignUpForm = reduxForm({ form: 'signUp' })(SignUpForm);
const translatedForm = withTranslations(reduxSignUpForm);

const selector = formValueSelector('signUp');

const mapStateToProps = state => ({
  initialValues: state.login.user ? { ...state.login.user, hasAcceptedTerms: false } : null,
  hasAcceptedTerms: selector(state, 'hasAcceptedTerms'),
});

const connectToRedux = connect(mapStateToProps, null);

const prefilledForm = connectToRedux(translatedForm);

export default prefilledForm;

