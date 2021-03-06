/* eslint-disable react/prop-types */

import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { connect } from 'react-redux';
import { Field, reduxForm } from 'redux-form';
import { Message, withTranslations } from 'retranslate';
import { requiredField, emailValidator } from '../../../common/form';

const renderField = ({ input, type, placeholder, disabled, meta: { touched, error } }) => (
  <div>
    <div className={`form-group ${touched && error ? 'has-error' : ''}`}>
      <input
        {...input}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className="form-control"
      />
      {touched && error && (
        <div className="help-block">
          <Message>{`new.user.flow.signup.error.${error}`}</Message>
        </div>
      )}
    </div>
  </div>
);

export const InlineSignUpForm = ({
  handleSubmit,
  invalid,
  submitting,
  error,
  translations: { translate },
}) => (
  <div>
    <form id="register-form" onSubmit={handleSubmit}>
      <div className="form-group mb-2">
        <label htmlFor="register-form-email">
          <Message>new.user.flow.signup.email</Message>
        </label>
        <Field
          component={renderField}
          type="email"
          name="email"
          id="register-form-email"
          placeholder={translate('new.user.flow.signup.email')}
          validate={[requiredField, emailValidator]}
        />
      </div>
      <div className="form-group mb-2">
        <label htmlFor="register-form-phoneNumber">
          <Message>new.user.flow.signup.phoneNumber</Message>
        </label>
        <Field
          component={renderField}
          type="text"
          name="phoneNumber"
          id="register-form-phoneNumber"
          placeholder={translate('new.user.flow.signup.phoneNumber')}
        />
      </div>
      <div className="mb-2">
        <span className="custom-control-indicator" />
        <div className="custom-control-description">
          <Message>new.user.flow.signup.tos.start</Message>
          <a
            href="https://tuleva.ee/wp-content/uploads/2017/10/P%C3%B5hikiri-Tulundus%C3%BChistu-Tuleva.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Message>new.user.flow.signup.tos.statute</Message>
          </a>
          <Message>new.user.flow.signup.tos.end</Message>
        </div>
      </div>
      <div>
        {error && (
          <div className="alert alert-danger mb-2" role="alert">
            <Message>{`new.user.flow.signup.error.${error}`}</Message>
          </div>
        )}
        <button
          type="submit"
          disabled={invalid || submitting}
          className="btn btn-primary btn-lg btn-block"
        >
          <Message>new.user.flow.signup.submit</Message>
        </button>
      </div>
    </form>
  </div>
);

const noop = () => null;

InlineSignUpForm.defaultProps = {
  handleSubmit: noop,
  invalid: true,
  submitting: false,
  error: '',
};

InlineSignUpForm.propTypes = {
  handleSubmit: Types.func,
  invalid: Types.bool,
  submitting: Types.bool,
  error: Types.string,
  translations: Types.shape({ translate: Types.func.isRequired }).isRequired,
};

const reduxInlineSignUpForm = reduxForm({ form: 'signUp' })(withTranslations(InlineSignUpForm));

const mapStateToProps = (state) => ({
  initialValues: state.login.user ? { ...state.login.user } : null,
});

const connectToRedux = connect(mapStateToProps, null);

const prefilledForm = connectToRedux(reduxInlineSignUpForm);

export default prefilledForm;
