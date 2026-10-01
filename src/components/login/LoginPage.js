import React, { useState } from 'react';
import { PropTypes as Types } from 'prop-types';
import { Redirect, withRouter } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { logo, AuthenticationLoader, ErrorAlert } from '../common';
import { usePageTitle } from '../common/usePageTitle';
import styles from './LoginPage.module.scss';
import { loginPath } from './constants';

import LoginForm from './loginForm';
import { SmartIdDeviceLinkLogin } from './smartId/SmartIdDeviceLinkLogin';
import { automaticRenewalAllowance } from './smartId/automaticRenewalAllowance';
import {
  changePhoneNumber,
  changePersonalCode,
  authenticateWithMobileId,
  cancelMobileAuthentication,
  authenticateWithIdCard,
  startSmartIdLogin,
  clearLoginError,
} from './actions';
import { getAuthentication } from '../common/authenticationManager';
import { loginLanding } from './loginLanding';
import { MOBILE_ID_PHONE_NUMBER_REQUIRED } from './mobileId/MobileIdLoginTab';

const ERRORS_SHOWN_BESIDE_THEIR_FIELD = [MOBILE_ID_PHONE_NUMBER_REQUIRED];

export const LoginPage = ({
  isAuthenticated,
  onMobileIdSubmit,
  onPhoneNumberChange,
  onPersonalCodeChange,
  onCancelMobileAuthentication,
  onSmartIdLoginStart,
  onAuthenticateWithIdCard,
  onLoginMethodChange,
  phoneNumber,
  personalCode,
  controlCode,
  verificationCodeChoice,
  smartIdWeb2AppLink,
  loadingAuthentication,
  loadingUserConversion,
  errorDescription,
  monthlyThirdPillarContribution,
  exchangeExistingThirdPillarUnits,
  location,
}) => {
  usePageTitle('pageTitle.loginPage');
  const [qrCodeRenewals] = useState(automaticRenewalAllowance);

  if (isAuthenticated) {
    const from = location.state && location.state.from;
    return <Redirect to={loginLanding(from)} />;
  }

  const authenticating = loadingAuthentication || controlCode || loadingUserConversion;

  return (
    <div className={styles.loginPage}>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-9 col-lg-7">
            <img width="146" height="66" src={logo} alt="Tuleva" className="d-block mx-auto mb-5" />
            {errorDescription && !ERRORS_SHOWN_BESIDE_THEIR_FIELD.includes(errorDescription) ? (
              <ErrorAlert description={errorDescription} />
            ) : (
              ''
            )}
            {!authenticating ? (
              <LoginForm
                onMobileIdSubmit={onMobileIdSubmit}
                onPhoneNumberChange={onPhoneNumberChange}
                onPersonalCodeChange={onPersonalCodeChange}
                phoneNumber={phoneNumber}
                personalCode={personalCode}
                mobileIdStartError={errorDescription}
                onSmartIdLoginStart={onSmartIdLoginStart}
                onAuthenticateWithIdCard={onAuthenticateWithIdCard}
                onLoginMethodChange={onLoginMethodChange}
                monthlyThirdPillarContribution={monthlyThirdPillarContribution}
                exchangeExistingThirdPillarUnits={exchangeExistingThirdPillarUnits}
              />
            ) : (
              ''
            )}
            {!errorDescription && authenticating && smartIdWeb2AppLink ? (
              <SmartIdDeviceLinkLogin
                web2AppLink={smartIdWeb2AppLink}
                onCancel={onCancelMobileAuthentication}
                onSmartIdLoginStart={onSmartIdLoginStart}
                automaticRenewals={qrCodeRenewals}
              />
            ) : (
              ''
            )}
            {!errorDescription && authenticating && !smartIdWeb2AppLink ? (
              <AuthenticationLoader
                onCancel={onCancelMobileAuthentication}
                controlCode={controlCode}
                verificationCodeChoice={verificationCodeChoice}
              />
            ) : (
              ''
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const noop = () => null;

LoginPage.defaultProps = {
  onPhoneNumberChange: noop,
  onPersonalCodeChange: noop,
  onMobileIdSubmit: noop,
  onCancelMobileAuthentication: noop,
  onSmartIdLoginStart: noop,
  onAuthenticateWithIdCard: noop,
  onLoginMethodChange: noop,

  isAuthenticated: false,
  phoneNumber: '',
  personalCode: '',
  controlCode: '',
  verificationCodeChoice: false,
  smartIdWeb2AppLink: null,
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
  onSmartIdLoginStart: Types.func,
  onAuthenticateWithIdCard: Types.func,
  onLoginMethodChange: Types.func,

  isAuthenticated: Types.bool,
  phoneNumber: Types.string,
  personalCode: Types.string,
  controlCode: Types.string,
  verificationCodeChoice: Types.bool,
  smartIdWeb2AppLink: Types.string,
  loadingAuthentication: Types.bool,
  loadingUserConversion: Types.bool,
  errorDescription: Types.string,
  monthlyThirdPillarContribution: Types.number,
  exchangeExistingThirdPillarUnits: Types.bool,

  location: Types.shape({ state: Types.shape({ from: Types.string }) }),
};

const mapStateToProps = (state) => ({
  isAuthenticated: getAuthentication().isAuthenticated(),
  phoneNumber: state.login.phoneNumber,
  personalCode: state.login.personalCode,
  controlCode: state.login.controlCode,
  verificationCodeChoice: state.login.verificationCodeChoice,
  smartIdWeb2AppLink: state.login.smartIdWeb2AppLink,
  loadingAuthentication: state.login.loadingAuthentication,
  loadingUserConversion: state.login.loadingUserConversion,
  errorDescription: state.login.error || state.login.userConversionError,
  monthlyThirdPillarContribution: state.thirdPillar.monthlyContribution,
  exchangeExistingThirdPillarUnits: state.thirdPillar.exchangeExistingUnits,
});
const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      onPhoneNumberChange: changePhoneNumber,
      onPersonalCodeChange: changePersonalCode,
      onMobileIdSubmit: authenticateWithMobileId,
      onCancelMobileAuthentication: cancelMobileAuthentication,
      onSmartIdLoginStart: startSmartIdLogin,
      onAuthenticateWithIdCard: authenticateWithIdCard,
      onLoginMethodChange: clearLoginError,
    },
    dispatch,
  );

const withRedux = connect(mapStateToProps, mapDispatchToProps);

export { loginPath };

export default withRouter(withRedux(LoginPage));
