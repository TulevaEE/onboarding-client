import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { connect } from 'react-redux';
import { Field, reduxForm } from 'redux-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { emailValidator, requiredField } from '../../../common/form';

const renderField = ({ input, type, placeholder, disabled, meta: { touched, error } }) => (
  <div>
    <div className={`mb-3 ${touched && error ? 'has-error' : ''}`}>
      <input
        {...input}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className="form-control"
      />
      {touched && error && (
        <div className="help-block">
          <FormattedMessage id={`new.user.flow.signup.error.${error}`} />
        </div>
      )}
    </div>
  </div>
);

export const InlineSignUpForm = ({ handleSubmit, invalid, submitting, error }) => {
  const { formatMessage } = useIntl();

  return (
    <div>
      <form id="register-form" onSubmit={handleSubmit}>
        <div className="mb-2">
          <label htmlFor="register-form-email">
            <FormattedMessage id="new.user.flow.signup.email" />
          </label>
          <Field
            component={renderField}
            type="email"
            name="email"
            id="register-form-email"
            placeholder={formatMessage({ id: 'new.user.flow.signup.email' })}
            validate={[requiredField, emailValidator]}
          />
        </div>
        <div className="mb-2">
          <label htmlFor="register-form-phoneNumber">
            <FormattedMessage id="new.user.flow.signup.phoneNumber" />
          </label>
          <Field
            component={renderField}
            type="text"
            name="phoneNumber"
            id="register-form-phoneNumber"
            placeholder={formatMessage({ id: 'new.user.flow.signup.phoneNumber' })}
          />
        </div>
        <div className="mb-2">
          <span className="custom-control-indicator" />
          <div className="custom-control-description">
            <FormattedMessage id="new.user.flow.signup.tos.start" />
            <a
              href="https://tuleva.ee/wp-content/uploads/2017/10/P%C3%B5hikiri-Tulundus%C3%BChistu-Tuleva.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FormattedMessage id="new.user.flow.signup.tos.statute" />
            </a>
            <FormattedMessage id="new.user.flow.signup.tos.end" />
          </div>
        </div>
        <div>
          {error && (
            <div className="alert alert-danger mb-2" role="alert">
              <FormattedMessage id={`new.user.flow.signup.error.${error}`} />
            </div>
          )}
          <button
            type="submit"
            disabled={invalid || submitting}
            className="btn btn-primary btn-lg btn-block"
          >
            <FormattedMessage id="new.user.flow.signup.submit" />
          </button>
        </div>
      </form>
    </div>
  );
};

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
};

const mapStateToProps = (state) => ({
  initialValues: state.login.user ? { ...state.login.user } : null,
});

export default connect(mapStateToProps, null)(reduxForm({ form: 'signUp' })(InlineSignUpForm));
