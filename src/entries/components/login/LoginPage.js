import React from 'react';
import { PropTypes as Types } from 'prop-types';
import FacebookProvider, { Like } from 'react-facebook';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message } from 'retranslate';

import './LoginPage.scss';

import { logo, AuthenticationLoader, ErrorAlert } from '../common';
import LoginForm from './loginForm';
import {
  changePhoneNumber,
  authenticateWithPhoneNumber,
  cancelMobileAuthentication,
  authenticateWithIdCard,
  changeIdCode,
  authenticateWithIdCode,
} from './actions';

export const LoginPage = ({
  onPhoneNumberSubmit,
  onPhoneNumberChange,
  onCancelMobileAuthentication,
  onIdCodeChange,
  onIdCodeSubmit,
  onAuthenticateWithIdCard,
  phoneNumber,
  identityCode,
  controlCode,
  loadingAuthentication,
  loadingUserConversion,
  errorDescription,
  monthlyThirdPillarContribution,
  exchangeExistingThirdPillarUnits,
}) => (
  <div className="login-page">
    <div className="container pt-5">
      <div className="row">
        <div className="col-lg-12 text-center">
          <img src={logo} alt="Tuleva" className="img-responsive brand-logo mb-3 pb-3 mt-2" />
        </div>
      </div>
      <div className="row">
        <div className="col-lg-10 offset-lg-1 col-sm-12 offset-sm-0 text-center">
          <div className="col-lg-6 offset-lg-3 col-md-8 offset-md-2 col-sm-12">
            {errorDescription ? <ErrorAlert description={errorDescription} /> : ''}
            {!loadingAuthentication && !controlCode && !loadingUserConversion ? (
              <LoginForm
                onPhoneNumberSubmit={onPhoneNumberSubmit}
                onPhoneNumberChange={onPhoneNumberChange}
                phoneNumber={phoneNumber}
                onIdCodeSubmit={onIdCodeSubmit}
                onIdCodeChange={onIdCodeChange}
                identityCode={identityCode}
                onAuthenticateWithIdCard={onAuthenticateWithIdCard}
                monthlyThirdPillarContribution={monthlyThirdPillarContribution}
                exchangeExistingThirdPillarUnits={exchangeExistingThirdPillarUnits}
              />
            ) : (
              ''
            )}
            {!errorDescription &&
            (loadingAuthentication || controlCode || loadingUserConversion) ? (
              <AuthenticationLoader
                onCancel={onCancelMobileAuthentication}
                controlCode={controlCode}
              />
            ) : (
              ''
            )}
            <div className="mt-3 small mb-3">
              <a href="/terms-of-use" target="_blank" rel="noopener noreferrer">
                <Message>login.terms.link</Message>
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-12 text-center fb-widget">
          <FacebookProvider appId="1939240566313354">
            <Like href="http://www.facebook.com/Tuleva.ee" colorScheme="dark" showFaces />
          </FacebookProvider>
        </div>
      </div>
    </div>
  </div>
);

const noop = () => null;

LoginPage.defaultProps = {
  onPhoneNumberChange: noop,
  onPhoneNumberSubmit: noop,
  onCancelMobileAuthentication: noop,
  onIdCodeChange: noop,
  onIdCodeSubmit: noop,
  onAuthenticateWithIdCard: noop,

  phoneNumber: '',
  identityCode: '',
  controlCode: '',
  loadingAuthentication: false,
  loadingUserConversion: false,
  errorDescription: '',
  monthlyThirdPillarContribution: null,
  exchangeExistingThirdPillarUnits: false,
};

LoginPage.propTypes = {
  onPhoneNumberChange: Types.func,
  onPhoneNumberSubmit: Types.func,
  onCancelMobileAuthentication: Types.func,
  onIdCodeChange: Types.func,
  onIdCodeSubmit: Types.func,
  onAuthenticateWithIdCard: Types.func,

  phoneNumber: Types.string,
  identityCode: Types.string,
  controlCode: Types.string,
  loadingAuthentication: Types.bool,
  loadingUserConversion: Types.bool,
  errorDescription: Types.string,
  monthlyThirdPillarContribution: Types.number,
  exchangeExistingThirdPillarUnits: Types.bool,
};

const mapStateToProps = state => ({
  phoneNumber: state.login.phoneNumber,
  identityCode: state.login.identityCode,
  controlCode: state.login.controlCode,
  loadingAuthentication: state.login.loadingAuthentication,
  loadingUserConversion: state.login.loadingUserConversion,
  errorDescription: state.login.error || state.login.userConversionError,
  monthlyThirdPillarContribution: state.thirdPillar.monthlyContribution,
  exchangeExistingThirdPillarUnits: state.thirdPillar.exchangeExistingUnits,
});
const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onPhoneNumberChange: changePhoneNumber,
      onPhoneNumberSubmit: authenticateWithPhoneNumber,
      onCancelMobileAuthentication: cancelMobileAuthentication,
      onIdCodeChange: changeIdCode,
      onIdCodeSubmit: authenticateWithIdCode,
      onAuthenticateWithIdCard: authenticateWithIdCard,
    },
    dispatch,
  );

const withRedux = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default withRedux(LoginPage);
