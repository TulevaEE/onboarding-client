import React, { PropTypes as Types } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message } from 'retranslate';
import { logo } from '../common';
import LoginForm from './loginForm';
import AuthenticationLoader from './authenticationLoader';
import ErrorAlert from './errorAlert';
import { changePhoneNumber, authenticateWithPhoneNumber, cancelMobileAuthentication } from './actions';

export const LoginPage = ({
  onPhoneNumberSubmit,
  onPhoneNumberChange,
  onCancelMobileAuthentication,
  phoneNumber,
  controlCode,
  loadingControlCode,
  errorDescription,
}) => (
  <div className="container mt-4 pt-4">
    <div className="row">
      <div className="col-12 text-center">
        <img src={logo} alt="Tuleva" className="img-responsive brand-logo mb-4 pb-4 mt-4" />
        <div>
          <h3><Message>login.title</Message></h3>
          <small className="mt-2 text-muted"><Message>login.subtitle</Message></small>
        </div>
      </div>
    </div>
    {
      !errorDescription && !loadingControlCode && !controlCode ?
        <LoginForm
          onPhoneNumberSubmit={onPhoneNumberSubmit}
          onPhoneNumberChange={onPhoneNumberChange}
          phoneNumber={phoneNumber}
        /> : ''
    }
    {
      !errorDescription && (loadingControlCode || controlCode) ?
        <AuthenticationLoader
          onCancel={onCancelMobileAuthentication}
          controlCode={controlCode}
        /> : ''
    }
    { errorDescription ? <ErrorAlert description={errorDescription} /> : '' }
  </div>
);

const noop = () => null;

LoginPage.defaultProps = {
  onPhoneNumberChange: noop,
  onPhoneNumberSubmit: noop,
  onCancelMobileAuthentication: noop,

  phoneNumber: '',
  controlCode: '',
  loadingControlCode: false,
  successful: false,
  errorDescription: '',
};

LoginPage.propTypes = {
  onPhoneNumberChange: Types.func,
  onPhoneNumberSubmit: Types.func,
  onCancelMobileAuthentication: Types.func,

  phoneNumber: Types.string,
  controlCode: Types.string,
  loadingControlCode: Types.bool,
  errorDescription: Types.string,
};

const mapStateToProps = state => ({
  phoneNumber: state.login.phoneNumber,
  controlCode: state.login.controlCode,
  loadingControlCode: state.login.loadingControlCode,
  errorDescription: (state.login.error || {}).error_description,
  successful: !!state.login.token, // not used right now
});
const mapDispatchToProps = dispatch => bindActionCreators({
  onPhoneNumberChange: changePhoneNumber,
  onPhoneNumberSubmit: authenticateWithPhoneNumber,
  onCancelMobileAuthentication: cancelMobileAuthentication,
}, dispatch);

const withRedux = connect(mapStateToProps, mapDispatchToProps);

export default withRedux(LoginPage);
