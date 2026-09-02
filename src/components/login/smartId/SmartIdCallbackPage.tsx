import React, { useEffect, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Redirect, useLocation } from 'react-router-dom';

import { ErrorAlert, logo } from '../../common';
import { SMART_ID_CALLBACK_FAILED_ERROR } from '../../common/errorAlert/ErrorAlert';
import AuthenticationLoader from '../../common/authenticationLoader/AuthenticationLoader';
import { getAuthentication } from '../../common/authenticationManager';
import { usePageTitle } from '../../common/usePageTitle';
import { SmartIdLoginCallback } from '../../common/apiModels';
import { completeSmartIdLogin } from '../actions';
import { loginPath } from '../constants';
import styles from '../LoginPage.module.scss';

export const SmartIdCallbackPage: React.FC = () => {
  usePageTitle('pageTitle.loginPage');
  const dispatch = useDispatch();
  const { search } = useLocation();
  const isAuthenticated = useSelector(() => getAuthentication().isAuthenticated());
  const loginError = useSelector((state: { login: { error: string | null } }) => state.login.error);
  const callback = useMemo(() => parseCallback(search), [search]);

  useEffect(() => {
    if (callback) {
      dispatch(completeSmartIdLogin(callback));
    }
  }, [callback, dispatch]);

  if (isAuthenticated) {
    return <Redirect to="/" />;
  }

  return (
    <div className={styles.loginPage}>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-9 col-lg-7">
            <img width="146" height="66" src={logo} alt="Tuleva" className="d-block mx-auto mb-5" />
            {!callback || loginError ? (
              <>
                <ErrorAlert description={SMART_ID_CALLBACK_FAILED_ERROR} />
                <div className="d-grid">
                  <Link className="btn btn-primary btn-lg" to={loginPath}>
                    <FormattedMessage id="login.enter" />
                  </Link>
                </div>
              </>
            ) : (
              <AuthenticationLoader />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function parseCallback(search: string): SmartIdLoginCallback | null {
  const parameters = new URLSearchParams(search);
  const value = parameters.get('value');
  const sessionSecretDigest = parameters.get('sessionSecretDigest');
  const userChallengeVerifier = parameters.get('userChallengeVerifier');

  return value && sessionSecretDigest && userChallengeVerifier
    ? { value, sessionSecretDigest, userChallengeVerifier }
    : null;
}
