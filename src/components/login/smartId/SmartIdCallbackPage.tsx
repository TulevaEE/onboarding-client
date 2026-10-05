import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Redirect, useLocation } from 'react-router-dom';

import { ErrorAlert, Loader, logo } from '../../common';
import { getAuthentication } from '../../common/authenticationManager';
import { usePageTitle } from '../../common/usePageTitle';
import { CANCEL_BUTTON_CLASS } from '../../common/cancelButton/CancelButton';
import {
  cancelMobileAuthentication,
  completeSmartIdLogin,
  getPendingSmartIdReturnPath,
  hasAcceptedSmartIdCallback,
  resumeAcceptedSmartIdCallback,
  startSmartIdLoginInTheApp,
} from '../actions';
import { loginPath } from '../constants';
import { loginLanding } from '../loginLanding';
import { cancelledInTheApp } from '../cancelledInTheApp';
import { useLoginLanguage } from '../loginLanguage';
import { opensTheSmartIdApp } from './opensTheSmartIdApp';
import styles from '../LoginPage.module.scss';
import {
  forgetSmartIdCallbackParameters,
  smartIdCallbackParameters,
} from './smartIdCallbackParameters';

const SLOW_COMPLETION_MILLIS = 20000;
const ERRORS_OF_THE_SMART_ID_ACCOUNT_ITSELF = [
  'smart.id.account.not.found',
  'smart.id.unsupported.country',
  'smart.id.certificate.revoked',
  'smart.id.account.unusable',
];

type LoginState = { login: { error: string | null; loadingAuthentication: boolean } };

export const SmartIdCallbackPage: React.FC = () => {
  usePageTitle('pageTitle.loginPage');
  const dispatch = useDispatch();
  const language = useLoginLanguage();
  const { search } = useLocation();
  const isAuthenticated = useSelector(() => getAuthentication().isAuthenticated());
  const loginError = useSelector((state: LoginState) => state.login.error);
  const authenticating = useSelector((state: LoginState) => state.login.loadingAuthentication);
  const [arrivedLoggedIn] = useState(isAuthenticated);
  const [callback] = useState(() => smartIdCallbackParameters(search));
  const [callbackAccepted] = useState(() => !callback && hasAcceptedSmartIdCallback());
  const [destination] = useState(() => loginLanding(getPendingSmartIdReturnPath() ?? undefined));
  const [attemptStarted, setAttemptStarted] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (arrivedLoggedIn) {
      forgetSmartIdCallbackParameters();
    } else if (callback) {
      dispatch(completeSmartIdLogin(callback));
    } else if (callbackAccepted) {
      dispatch(resumeAcceptedSmartIdCallback());
    }
  }, [arrivedLoggedIn, callback, callbackAccepted, dispatch]);

  useEffect(() => {
    if (authenticating) {
      setAttemptStarted(true);
    }
  }, [authenticating]);

  useEffect(() => {
    const slowCompletion = setTimeout(() => setSlow(true), SLOW_COMPLETION_MILLIS);
    return () => clearTimeout(slowCompletion);
  }, []);

  if (isAuthenticated) {
    return <Redirect to={destination} />;
  }

  if (cancelledInTheApp(loginError)) {
    return <Redirect to={loginPath} />;
  }

  const aNewSessionCanFixIt = !ERRORS_OF_THE_SMART_ID_ACCOUNT_ITSELF.includes(loginError ?? '');

  const tryAgain = () => {
    if (aNewSessionCanFixIt && opensTheSmartIdApp({ qrCodeRequested: false })) {
      dispatch(startSmartIdLoginInTheApp(language));
    }
  };

  const attemptEnded = attemptStarted && !authenticating;
  const failed = (!callback && !callbackAccepted) || Boolean(loginError) || attemptEnded;

  return (
    <div className={styles.loginPage}>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-9 col-lg-7">
            <img width="146" height="66" src={logo} alt="Tuleva" className="d-block mx-auto mb-5" />
            {failed ? (
              <div className="bg-white shadow-sm rounded-3 p-5">
                <ErrorAlert description={loginError ?? undefined} />
                <div className="d-grid">
                  <Link className="btn btn-primary btn-lg" to={loginPath} onClick={tryAgain}>
                    <FormattedMessage id="login.smart.id.callback.retry" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow-sm rounded-3 p-5 text-center">
                <Loader className="align-middle" />
                {slow && (
                  <Link
                    className={`${CANCEL_BUTTON_CLASS} mt-4`}
                    to={loginPath}
                    onClick={() => dispatch(cancelMobileAuthentication())}
                  >
                    <FormattedMessage id="login.stop" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
