import React, { useState } from 'react';
import { PropTypes as Types } from 'prop-types';
import { Redirect, withRouter } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { useIntl } from 'react-intl';

import { logo, AuthenticationLoader, ErrorAlert } from '../common';
import { usePageTitle } from '../common/usePageTitle';
import styles from './LoginPage.module.scss';
import { loginPath } from './constants';

import LoginForm from './loginForm';
import { SmartIdDeviceLinkLogin } from './smartId/SmartIdDeviceLinkLogin';
import { automaticRenewalAllowance } from './smartId/automaticRenewalAllowance';
import { opensTheSmartIdApp } from './smartId/opensTheSmartIdApp';
import {
  changePhoneNumber,
  changePersonalCode,
  authenticateWithMobileId,
  cancelMobileAuthentication,
  authenticateWithIdCard,
  startSmartIdLogin,
  startSmartIdLoginInTheApp,
  expireSmartIdQrCode,
  markSmartIdAppOpened,
} from './actions';
import { getAuthentication } from '../common/authenticationManager';
import { loginLanding } from './loginLanding';
import { MOBILE_ID_PHONE_NUMBER_REQUIRED } from './mobileId/MobileIdLoginForm';
import { cancelledInTheApp } from './cancelledInTheApp';

const ERRORS_SHOWN_BESIDE_THEIR_FIELD = [MOBILE_ID_PHONE_NUMBER_REQUIRED];

export const LoginPage = ({
  isAuthenticated,
  onMobileIdSubmit,
  onPhoneNumberChange,
  onPersonalCodeChange,
  onCancelMobileAuthentication,
  onSmartIdLoginStart,
  onSmartIdAppLoginStart,
  onSmartIdQrCodeExpire,
  onSmartIdAppOpen,
  onAuthenticateWithIdCard,
  onLoginMethodChange,
  phoneNumber,
  personalCode,
  controlCode,
  verificationCodeChoice,
  smartIdWeb2AppLink,
  smartIdRememberMe,
  smartIdQrCodeRequested,
  smartIdSession,
  loadingAuthentication,
  loadingUserConversion,
  errorDescription,
  monthlyThirdPillarContribution,
  exchangeExistingThirdPillarUnits,
  location,
}) => {
  usePageTitle('pageTitle.loginPage');
  const { formatMessage } = useIntl();
  const [qrCodeRenewals] = useState(automaticRenewalAllowance);

  if (isAuthenticated) {
    const from = location.state && location.state.from;
    return <Redirect to={loginLanding(from)} />;
  }

  const startSmartIdLoginFromTheTab = (language, flow, rememberMe, qrCodeRequested = false) => {
    if (flow === 'DEVICE_LINK' && opensTheSmartIdApp({ qrCodeRequested })) {
      onSmartIdAppLoginStart(language);
      return;
    }
    onSmartIdLoginStart(language, flow, rememberMe);
  };

  const authenticating = loadingAuthentication || controlCode || loadingUserConversion;
  const showsAlert =
    errorDescription &&
    !ERRORS_SHOWN_BESIDE_THEIR_FIELD.includes(errorDescription) &&
    !cancelledInTheApp(errorDescription);

  const waitsForConfirmationOnThePhone =
    !errorDescription &&
    Boolean(authenticating) &&
    Boolean(
      controlCode ||
        (smartIdWeb2AppLink && opensTheSmartIdApp({ qrCodeRequested: smartIdQrCodeRequested })),
    );

  const confirmingWith =
    controlCode && !verificationCodeChoice ? 'login.mobile.id' : 'login.smart.id';

  const pendingLogin = () => {
    if (errorDescription || !authenticating) {
      return null;
    }
    if (smartIdWeb2AppLink) {
      return (
        <SmartIdDeviceLinkLogin
          session={smartIdSession}
          web2AppLink={smartIdWeb2AppLink}
          rememberMe={smartIdRememberMe}
          qrCodeRequested={smartIdQrCodeRequested}
          onCancel={onCancelMobileAuthentication}
          onSmartIdLoginStart={onSmartIdLoginStart}
          onExpire={onSmartIdQrCodeExpire}
          onAppOpen={onSmartIdAppOpen}
          automaticRenewals={qrCodeRenewals}
        />
      );
    }
    return (
      <AuthenticationLoader
        onCancel={onCancelMobileAuthentication}
        controlCode={controlCode}
        verificationCodeChoice={verificationCodeChoice}
      />
    );
  };

  return (
    <div className={styles.loginPage}>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-9 col-lg-7">
            <img width="146" height="66" src={logo} alt="Tuleva" className="d-block mx-auto mb-5" />
            {waitsForConfirmationOnThePhone ? (
              <section
                className="bg-white shadow-sm rounded-3 p-4 p-sm-5 text-center"
                aria-label={formatMessage({ id: confirmingWith })}
              >
                {pendingLogin()}
              </section>
            ) : (
              <LoginForm
                onMobileIdSubmit={onMobileIdSubmit}
                onPhoneNumberChange={onPhoneNumberChange}
                onPersonalCodeChange={onPersonalCodeChange}
                phoneNumber={phoneNumber}
                personalCode={personalCode}
                mobileIdStartError={errorDescription}
                onSmartIdLoginStart={startSmartIdLoginFromTheTab}
                onAuthenticateWithIdCard={onAuthenticateWithIdCard}
                onLoginMethodChange={onLoginMethodChange}
                monthlyThirdPillarContribution={monthlyThirdPillarContribution}
                exchangeExistingThirdPillarUnits={exchangeExistingThirdPillarUnits}
                alert={showsAlert ? <ErrorAlert description={errorDescription} /> : null}
                pendingLogin={pendingLogin()}
              />
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
  onSmartIdAppLoginStart: noop,
  onSmartIdQrCodeExpire: noop,
  onSmartIdAppOpen: noop,
  onAuthenticateWithIdCard: noop,
  onLoginMethodChange: noop,

  isAuthenticated: false,
  phoneNumber: '',
  personalCode: '',
  controlCode: '',
  verificationCodeChoice: false,
  smartIdWeb2AppLink: null,
  smartIdRememberMe: false,
  smartIdQrCodeRequested: false,
  smartIdSession: 0,
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
  onSmartIdAppLoginStart: Types.func,
  onSmartIdQrCodeExpire: Types.func,
  onSmartIdAppOpen: Types.func,
  onAuthenticateWithIdCard: Types.func,
  onLoginMethodChange: Types.func,

  isAuthenticated: Types.bool,
  phoneNumber: Types.string,
  personalCode: Types.string,
  controlCode: Types.string,
  verificationCodeChoice: Types.bool,
  smartIdWeb2AppLink: Types.string,
  smartIdRememberMe: Types.bool,
  smartIdQrCodeRequested: Types.bool,
  smartIdSession: Types.number,
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
  smartIdRememberMe: state.login.smartIdRememberMe,
  smartIdQrCodeRequested: state.login.smartIdQrCodeRequested,
  smartIdSession: state.login.smartIdSession,
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
      onSmartIdAppLoginStart: startSmartIdLoginInTheApp,
      onSmartIdQrCodeExpire: expireSmartIdQrCode,
      onSmartIdAppOpen: markSmartIdAppOpened,
      onAuthenticateWithIdCard: authenticateWithIdCard,
      onLoginMethodChange: cancelMobileAuthentication,
    },
    dispatch,
  );

const withRedux = connect(mapStateToProps, mapDispatchToProps);

export { loginPath };

export default withRouter(withRedux(LoginPage));
