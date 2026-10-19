import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Redirect, useLocation } from 'react-router-dom';

import { ErrorAlert, Loader } from '../../common';
import { getAuthentication } from '../../common/authenticationManager';
import { usePageTitle } from '../../common/usePageTitle';
import { CANCEL_BUTTON_CLASS } from '../../common/cancelButton/CancelButton';
import {
  cancelMobileAuthentication,
  completeSmartIdLogin,
  getPendingSmartIdReturnPath,
  hasPendingSmartIdAuthentication,
  hasAcceptedSmartIdCallback,
  resumeAcceptedSmartIdCallback,
  startSmartIdLoginInTheApp,
} from '../actions';
import { loginPath } from '../constants';
import { loginLanding } from '../loginLanding';
import { cancelledInTheApp } from '../cancelledInTheApp';
import { useLoginLanguage } from '../loginLanguage';
import { opensTheSmartIdApp } from './opensTheSmartIdApp';
import { usePrivateSafariTabOnAnIphone } from './usePrivateSafariTabOnAnIphone';
import { PrivateSafariTabInstruction } from './PrivateSafariTabInstruction';
import { LoginFrame } from '../LoginFrame';
import { connectPathOfTheLatestLoginInFlight } from '../../connect/freshLogin';
import {
  forgetSmartIdCallbackParameters,
  returnPathInCallbackAddress,
  smartIdCallbackParameters,
} from './smartIdCallbackParameters';

const SLOW_COMPLETION_MILLIS = 20000;
const CALLBACK_IN_ANOTHER_BROWSER = 'smart.id.callback.in.another.browser';
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
  const [returnPath] = useState(
    () =>
      returnPathInCallbackAddress(search) ??
      getPendingSmartIdReturnPath() ??
      (hasPendingSmartIdAuthentication() ? undefined : connectPathOfTheLatestLoginInFlight()),
  );
  const [destination] = useState(() => loginLanding(returnPath));
  const backToTheLogin = { pathname: loginPath, state: { from: returnPath } };
  const [attemptStarted, setAttemptStarted] = useState(false);
  const [slow, setSlow] = useState(false);
  const inAPrivateSafariTab = usePrivateSafariTabOnAnIphone();

  useEffect(() => {
    if (arrivedLoggedIn) {
      forgetSmartIdCallbackParameters();
    } else if (callback) {
      dispatch(completeSmartIdLogin(callback, returnPath));
    } else if (callbackAccepted) {
      dispatch(resumeAcceptedSmartIdCallback());
    }
  }, [arrivedLoggedIn, callback, callbackAccepted, returnPath, dispatch]);

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
    return <Redirect to={backToTheLogin} />;
  }

  const aNewSessionCanFixIt = !ERRORS_OF_THE_SMART_ID_ACCOUNT_ITSELF.includes(loginError ?? '');

  const tryAgain = () => {
    if (aNewSessionCanFixIt && opensTheSmartIdApp({ qrCodeRequested: false })) {
      dispatch(startSmartIdLoginInTheApp(language, returnPath));
    }
  };

  const attemptEnded = attemptStarted && !authenticating;
  const tryingAgainHereFailsTheSameWay =
    loginError === CALLBACK_IN_ANOTHER_BROWSER && inAPrivateSafariTab;
  const failed = (!callback && !callbackAccepted) || Boolean(loginError) || attemptEnded;

  return (
    <LoginFrame>
      {failed ? (
        <div className="bg-white shadow-sm rounded-3 p-5">
          {tryingAgainHereFailsTheSameWay ? (
            <div className="alert alert-danger text-pretty" role="alert">
              <PrivateSafariTabInstruction />
            </div>
          ) : (
            <ErrorAlert description={loginError ?? undefined} />
          )}
          {!tryingAgainHereFailsTheSameWay && (
            <div className="d-grid">
              <Link className="btn btn-primary btn-lg" to={backToTheLogin} onClick={tryAgain}>
                <FormattedMessage id="login.smart.id.callback.retry" />
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-3 p-5 text-center">
          <Loader className="align-middle" />
          {slow && (
            <Link
              className={`${CANCEL_BUTTON_CLASS} mt-4`}
              to={backToTheLogin}
              onClick={() => dispatch(cancelMobileAuthentication())}
            >
              <FormattedMessage id="login.stop" />
            </Link>
          )}
        </div>
      )}
    </LoginFrame>
  );
};
