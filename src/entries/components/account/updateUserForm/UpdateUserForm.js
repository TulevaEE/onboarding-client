import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { connect } from 'react-redux';
import { Field, reduxForm } from 'redux-form';
import { Message, withTranslations } from 'retranslate';

import { requiredField, emailValidator, renderField } from '../../common/form';

export const UpdateUserForm = ({
  handleSubmit,
  updateUserSuccess,
  invalid,
  submitting,
  error,
  translations: { translate },
}) => (
  <div>
    <form id="register-form" onSubmit={handleSubmit}>
      {updateUserSuccess && (
        <div className="alert alert-success" role="alert">
          <strong>
            <Message>update.user.thanks</Message>
          </strong>
          <Message>update.user.success.message</Message>
        </div>
      )}
      <div className="row">
        <div className="col-md-4">
          <div className="form-group">
            <Field
              component={renderField}
              type="email"
              name="email"
              placeholder={translate('new.user.flow.signup.email')}
              validate={[requiredField, emailValidator]}
            />
          </div>
        </div>
        <div className="col-md-4">
          <div className="form-group">
            <Field
              component={renderField}
              type="number"
              name="phoneNumber"
              placeholder={translate('new.user.flow.signup.phoneNumber')}
            />
          </div>
        </div>
        <div className="col-md-4">
          <div className={`form-group ${error ? 'has-danger' : ''}`}>
            {error && <div className="form-control-feedback mb-3">{error}</div>}
            <button
              type="submit"
              disabled={invalid || submitting}
              className="btn btn-primary btn-block mb-2 mr-2"
            >
              <Message>update.user.save</Message>
            </button>
          </div>
        </div>
      </div>
    </form>
  </div>
);

const noop = () => null;

UpdateUserForm.defaultProps = {
  handleSubmit: noop,
  invalid: true,
  submitting: false,
  error: '',
  updateUserSuccess: false,
};

UpdateUserForm.propTypes = {
  handleSubmit: Types.func,
  invalid: Types.bool,
  submitting: Types.bool,
  error: Types.string,
  translations: Types.shape({ translate: Types.func.isRequired }).isRequired,
  updateUserSuccess: Types.bool,
};

const reduxSignUpForm = reduxForm({ form: 'updateUser' })(UpdateUserForm);
const translatedForm = withTranslations(reduxSignUpForm);

const mapStateToProps = state => ({
  initialValues: state.login.user ? { ...state.login.user } : null,
  updateUserSuccess: state.account.updateUserSuccess,
});

const connectToRedux = connect(
  mapStateToProps,
  null,
);

const prefilledForm = connectToRedux(translatedForm);

export default prefilledForm;
