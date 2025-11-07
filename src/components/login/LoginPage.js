import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Redirect, withRouter } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { logo, AuthenticationLoader, ErrorAlert } from '../common';
import { usePageTitle } from '../common/usePageTitle';
import styles from './LoginPage.module.scss';
import { loginPath } from './constants';

import LoginForm from './loginForm';
import {
  changePhoneNumber,
  changePersonalCode,
  authenticateWithMobileId,
  cancelMobileAuthentication,
  authenticateWithIdCard,
  authenticateWithIdCode,
} from './actions';
import { getAuthentication } from '../common/authenticationManager';

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
}) => {
  usePageTitle('pageTitle.loginPage');

  if (isAuthenticated) {
    return <Redirect to={location.state && location.state.from ? location.state.from : '/'} />;
  }

  return (
    <div className={styles.loginPage}>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-9 col-lg-7">
            <img width="146" height="66" src={logo} alt="Tuleva" className="d-block mx-auto mb-5" />
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

  location: Types.shape({ state: Types.shape({ from: Types.string }) }),
};

const mapStateToProps = (state) => ({
  isAuthenticated: getAuthentication().isAuthenticated(),
  phoneNumber: state.login.phoneNumber,
  personalCode: state.login.personalCode,
  controlCode: state.login.controlCode,
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
      onIdCodeSubmit: authenticateWithIdCode,
      onAuthenticateWithIdCard: authenticateWithIdCard,
    },
    dispatch,
  );

const withRedux = connect(mapStateToProps, mapDispatchToProps);

export { loginPath };

export default withRouter(withRedux(LoginPage));
