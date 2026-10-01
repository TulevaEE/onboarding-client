import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Redirect, useLocation } from 'react-router-dom';

import { ErrorAlert, Loader, logo } from '../../common';
import { getAuthentication } from '../../common/authenticationManager';
import { usePageTitle } from '../../common/usePageTitle';
import {
  cancelMobileAuthentication,
  completeSmartIdLogin,
  getPendingSmartIdReturnPath,
  hasAcceptedSmartIdCallback,
  resumeAcceptedSmartIdCallback,
} from '../actions';
import { loginPath } from '../constants';
import { loginLanding } from '../loginLanding';
import styles from '../LoginPage.module.scss';
import {
  forgetSmartIdCallbackParameters,
  smartIdCallbackParameters,
} from './smartIdCallbackParameters';

const SLOW_COMPLETION_MILLIS = 20000;

type LoginState = { login: { error: string | null; loadingAuthentication: boolean } };

export const SmartIdCallbackPage: React.FC = () => {
  usePageTitle('pageTitle.loginPage');
  const dispatch = useDispatch();
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
                  <Link className="btn btn-primary btn-lg" to={loginPath}>
                    <FormattedMessage id="login.smart.id.callback.retry" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow-sm rounded-3 p-5 text-center">
                <Loader className="align-middle" />
                {slow && (
                  <div>
                    <Link
                      className="btn btn-outline-primary mt-4"
                      to={loginPath}
                      onClick={() => dispatch(cancelMobileAuthentication())}
                    >
                      <FormattedMessage id="login.stop" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
