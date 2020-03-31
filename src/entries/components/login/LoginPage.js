import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Redirect, withRouter } from 'react-router-dom';
import FacebookProvider, { Like } from 'react-facebook';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Message } from 'retranslate';

import './LoginPage.scss';

import { logo, AuthenticationLoader, ErrorAlert } from '../common';
import LoginForm from './loginForm';
import {
  changePhoneNumber,
  changePersonalCode,
  authenticateWithMobileId,
  cancelMobileAuthentication,
  authenticateWithIdCard,
  authenticateWithIdCode,
} from './actions';

export const LoginPage = ({
  isAuthenticated,
  onMobileIdSubmit,
  onPhoneNumberChange,
  onPersonalCodeChange,
  onCancelMobileAuthentication,
  onIdCodeSubmit,
  onAuthenticateWithIdCard,
  phoneNumber,
  personalCode,
  controlCode,
  loadingAuthentication,
  loadingUserConversion,
  errorDescription,
  monthlyThirdPillarContribution,
  exchangeExistingThirdPillarUnits,
  location,
}) =>
  isAuthenticated ? (
    <Redirect to={location.state && location.state.from ? location.state.from : ''} />
  ) : (
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
                  onMobileIdSubmit={onMobileIdSubmit}
                  onPhoneNumberChange={onPhoneNumberChange}
                  onPersonalCodeChange={onPersonalCodeChange}
                  phoneNumber={phoneNumber}
                  personalCode={personalCode}
                  onIdCodeSubmit={onIdCodeSubmit}
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
  onPersonalCodeChange: noop,
  onMobileIdSubmit: noop,
  onCancelMobileAuthentication: noop,
  onIdCodeSubmit: noop,
  onAuthenticateWithIdCard: noop,

  isAuthenticated: false,
  phoneNumber: '',
  personalCode: '',
  controlCode: '',
  loadingAuthentication: false,
  loadingUserConversion: false,
  errorDescription: '',
  monthlyThirdPillarContribution: null,
  exchangeExistingThirdPillarUnits: false,

  location: { state: { from: '' } },
};

LoginPage.propTypes = {
  onPhoneNumberChange: Types.func,
  onPersonalCodeChange: Types.func,
  onMobileIdSubmit: Types.func,
  onCancelMobileAuthentication: Types.func,
  onIdCodeSubmit: Types.func,
  onAuthenticateWithIdCard: Types.func,

  isAuthenticated: Types.bool,
  phoneNumber: Types.string,
  personalCode: Types.string,
  controlCode: Types.string,
  loadingAuthentication: Types.bool,
  loadingUserConversion: Types.bool,
  errorDescription: Types.string,
  monthlyThirdPillarContribution: Types.number,
  exchangeExistingThirdPillarUnits: Types.bool,

  location: Types.shape({ state: { from: Types.string } }),
};

const mapStateToProps = state => ({
  isAuthenticated: !!state.login.token,
  phoneNumber: state.login.phoneNumber,
  personalCode: state.login.personalCode,
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
      onPersonalCodeChange: changePersonalCode,
      onMobileIdSubmit: authenticateWithMobileId,
      onCancelMobileAuthentication: cancelMobileAuthentication,
      onIdCodeSubmit: authenticateWithIdCode,
      onAuthenticateWithIdCard: authenticateWithIdCard,
    },
    dispatch,
  );

const withRedux = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default withRouter(withRedux(LoginPage));
