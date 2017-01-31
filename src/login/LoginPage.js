import React, { PropTypes as Types } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message } from 'retranslate';

import { logo } from '../common';
import LoginForm from './loginForm';
import AuthenticationLoader from './authenticationLoader';
import { changePhoneNumber, authenticateWithPhoneNumber, cancelMobileAuthentication } from './actions';

export const LoginPage = ({
  onPhoneNumberSubmit,
  onPhoneNumberChange,
  onCancelMobileAuthentication,
  phoneNumber,
  controlCode,
  loadingControlCode,
  error,
}) => (
  <div className="container mt-4 pt-4">
    <div className="row">
      <div className="col-12 text-center">
        <img src={logo} alt="Tuleva" className="img-responsive brand-logo mb-4 pb-4 mt-4" />
        <h3><Message>login.title</Message></h3>
        <small className="mt-2"><Message>login.subtitle</Message></small>
      </div>
    </div>
    {
      !error && !loadingControlCode && !controlCode ?
        <LoginForm
          onPhoneNumberSubmit={onPhoneNumberSubmit}
          onPhoneNumberChange={onPhoneNumberChange}
          phoneNumber={phoneNumber}
        /> : ''
    }
    {
      loadingControlCode || controlCode ?
        <AuthenticationLoader
          onCancel={onCancelMobileAuthentication}
          controlCode={controlCode}
        /> : ''
    }
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
  error: null,
};

LoginPage.propTypes = {
  onPhoneNumberChange: Types.func,
  onPhoneNumberSubmit: Types.func,
  onCancelMobileAuthentication: Types.func,

  phoneNumber: Types.string,
  controlCode: Types.string,
  loadingControlCode: Types.bool,
  error: Types.shape({}),
};

const mapStateToProps = state => ({
  phoneNumber: state.login.phoneNumber,
  controlCode: state.login.controlCode,
  loadingControlCode: state.login.loadingControlCode,
  error: state.login.error,
  successful: !!state.login.token, // not used right now
});
const mapDispatchToProps = dispatch => bindActionCreators({
  onPhoneNumberChange: changePhoneNumber,
  onPhoneNumberSubmit: authenticateWithPhoneNumber,
  onCancelMobileAuthentication: cancelMobileAuthentication,
}, dispatch);

const withRedux = connect(mapStateToProps, mapDispatchToProps);

export default withRedux(LoginPage);
