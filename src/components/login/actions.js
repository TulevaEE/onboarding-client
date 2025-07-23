/* eslint-disable no-useless-escape */

import * as Sentry from '@sentry/browser';
import config from 'react-global-configuration';

import {
  CHANGE_PHONE_NUMBER,
  CHANGE_PERSONAL_CODE,
  CHANGE_EMAIL,
  MOBILE_AUTHENTICATION_START,
  MOBILE_AUTHENTICATION_START_SUCCESS,
  MOBILE_AUTHENTICATION_START_ERROR,
  MOBILE_AUTHENTICATION_SUCCESS,
  MOBILE_AUTHENTICATION_ERROR,
  MOBILE_AUTHENTICATION_CANCEL,
  ID_CARD_AUTHENTICATION_START,
  ID_CARD_AUTHENTICATION_START_SUCCESS,
  ID_CARD_AUTHENTICATION_START_ERROR,
  ID_CARD_AUTHENTICATION_SUCCESS,
  ID_CARD_AUTHENTICATION_ERROR,
  GET_USER_START,
  GET_USER_SUCCESS,
  GET_USER_ERROR,
  GET_USER_CONVERSION_START,
  GET_USER_CONVERSION_SUCCESS,
  GET_USER_CONVERSION_ERROR,
  SET_LOGIN_TO_REDIRECT,
  LOG_OUT,
} from './constants';

import { api } from '../common';

import { ID_CARD_LOGIN_START_FAILED_ERROR } from '../common/errorAlert/ErrorAlert';

import { getAuthentication } from '../common/authenticationManager';

const POLL_DELAY = 1000;
let timeout;
let inflight = null;

export function changePhoneNumber(phoneNumber) {
  return { type: CHANGE_PHONE_NUMBER, phoneNumber };
}

export function changePersonalCode(personalCode) {
  return { type: CHANGE_PERSONAL_CODE, personalCode };
}

export function changeEmail(email) {
  return { type: CHANGE_EMAIL, email };
}

const LOGIN_COOKIE_EMAIL_NAME = 'email';
const LOGIN_COOKIE_AUTHENTICATION_PRINCIPAL_NAME = 'authenticationPrincipal';

// TODO: is this used?
function setCookie(name, value) {
  const date = new Date();
  date.setTime(date.getTime() + 5 * 1000);
  const expires = `;expires=${date.toGMTString()}`;
  const domain = `;domain=${window.location.hostname}`;
  document.cookie = `${name}=${value};path=/${domain}${expires}`;
}

function setLoginCookies(getState) {
  setCookie(LOGIN_COOKIE_AUTHENTICATION_PRINCIPAL_NAME, getAuthentication());
  setCookie(LOGIN_COOKIE_EMAIL_NAME, getState().login.email);
}

function handleLogin() {
  return (dispatch, getState) => {
    if (getState().login.redirectLogin) {
      setLoginCookies(getState);
      window.location = config.get('applicationUrl');
    }
  };
}

function getMobileIdTokens() {
  return (dispatch, getState) => {
    timeout = setTimeout(() => {
      api
        .getMobileIdTokens()
        .then((tokens) => {
          if (isTokenPresent(tokens)) {
            // authentication complete
            dispatch({
              type: MOBILE_AUTHENTICATION_SUCCESS,
              tokens,
              method: 'MOBILE_ID',
            });
            dispatch(handleLogin());
          } else if (getState().login.loadingAuthentication) {
            // authentication not yet completed
            dispatch(getMobileIdTokens()); // poll again
          }
        })
        .catch((error) => dispatch({ type: MOBILE_AUTHENTICATION_ERROR, error }));
    }, POLL_DELAY);
  };
}

export function authenticateWithMobileId(phoneNumber, personalCode) {
  return (dispatch) => {
    dispatch({ type: MOBILE_AUTHENTICATION_START });
    return api
      .authenticateWithMobileId(phoneNumber, personalCode)
      .then((controlCode) => {
        dispatch({ type: MOBILE_AUTHENTICATION_START_SUCCESS, controlCode });
        dispatch(getMobileIdTokens());
      })
      .catch((error) => dispatch({ type: MOBILE_AUTHENTICATION_START_ERROR, error }));
  };
}

const logPoll = (stage, value = '') =>
  // eslint-disable-next-line no-console
  console.log(`[poll] ${stage}`, value, Date.now());

// eslint-disable-next-line no-underscore-dangle
if (!window.__smartIdVisibilityLoggerAttached) {
  document.addEventListener('visibilitychange', () =>
    logPoll('tab-visibility', document.visibilityState),
  );
  // eslint-disable-next-line no-underscore-dangle
  window.__smartIdVisibilityLoggerAttached = true;
}

export const getSmartIdTokens = (authenticationHash) => (dispatch, getState) => {
  logPoll('schedule-timeout', POLL_DELAY);

  timeout = setTimeout(async () => {
    if (inflight) {
      logPoll('skip-new-request-because-inflight');
      return undefined;
    }

    logPoll('request-start');
    const controller = new AbortController();

    inflight = api
      .getSmartIdTokens(authenticationHash, { signal: controller.signal })
      .finally(() => {
        inflight = null;
      });

    try {
      const tokens = await inflight;
      logPoll('fetch-resolved', tokens);

      if (tokens?.accessToken && tokens?.refreshToken) {
        logPoll('token-present → SUCCESS');
        clearTimeout(timeout);
        controller.abort(); // ignore any late replies

        dispatch({
          type: MOBILE_AUTHENTICATION_SUCCESS,
          tokens,
          method: 'SMART_ID',
        });
        return dispatch(handleLogin());
      }

      if (getState().login.loadingAuthentication) {
        logPoll('token-absent → poll-again');
        return dispatch(getSmartIdTokens(authenticationHash));
      }
    } catch (error) {
      logPoll('fetch-error', error);

      if (error.message === 'Load failed') {
        logPoll('load-failed → poll-again');
        return dispatch(getSmartIdTokens(authenticationHash));
      }

      clearTimeout(timeout);
      logPoll('fatal-error → STOP');
      return dispatch({ type: MOBILE_AUTHENTICATION_ERROR, error });
    }
    return undefined;
  }, POLL_DELAY);
};

export function authenticateWithIdCode(personalCode) {
  return (dispatch) => {
    dispatch({ type: MOBILE_AUTHENTICATION_START });
    return api
      .authenticateWithIdCode(personalCode)
      .then((authentication) => {
        dispatch({
          type: MOBILE_AUTHENTICATION_START_SUCCESS,
          controlCode: authentication.challengeCode,
        });
        dispatch(getSmartIdTokens(authentication.authenticationHash));
      })
      .catch((error) => dispatch({ type: MOBILE_AUTHENTICATION_START_ERROR, error }));
  };
}

function getIdCardTokens() {
  return (dispatch, getState) => {
    timeout = setTimeout(() => {
      api
        .getIdCardTokens()
        .then((tokens) => {
          if (isTokenPresent(tokens)) {
            // authentication complete
            dispatch({ type: ID_CARD_AUTHENTICATION_SUCCESS, tokens });
            dispatch(handleLogin());
          } else if (getState().login.loadingAuthentication) {
            // authentication not yet completed
            dispatch(getIdCardTokens()); // poll again
          }
        })
        .catch((error) => dispatch({ type: ID_CARD_AUTHENTICATION_ERROR, error }));
    }, POLL_DELAY);
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function safariSpecialHandlingIdCardAuth() {
  // Safari doesn't support sending client certificates via CORS,
  // so we have to do a full page reload
  const isSafari = !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);
  if (isSafari) {
    window.location = `${config.get('idCardUrl')}/idLogin`;
  }
}

export function authenticateWithIdCard() {
  // safariSpecialHandlingIdCardAuth();
  return (dispatch) => {
    dispatch({ type: ID_CARD_AUTHENTICATION_START });
    return api
      .authenticateWithIdCard()
      .then(() => {
        dispatch({ type: ID_CARD_AUTHENTICATION_START_SUCCESS });
        dispatch(getIdCardTokens());
      })
      .catch(() => {
        const error = {
          body: { errors: [{ code: ID_CARD_LOGIN_START_FAILED_ERROR }] },
        };
        dispatch({ type: ID_CARD_AUTHENTICATION_START_ERROR, error });
      });
  };
}

function isTokenPresent(tokens) {
  return tokens.accessToken && tokens.refreshToken;
}

export function handleIdCardLogin(query) {
  if (query.login === 'ID_CARD') {
    return (dispatch) => {
      dispatch({ type: ID_CARD_AUTHENTICATION_START });
      dispatch({ type: ID_CARD_AUTHENTICATION_START_SUCCESS });
      return dispatch(getIdCardTokens());
    };
  }
  return () => {};
}

export function cancelMobileAuthentication() {
  if (timeout) {
    clearTimeout(timeout);
  }
  return { type: MOBILE_AUTHENTICATION_CANCEL };
}

export function getUser() {
  return (dispatch) => {
    dispatch({ type: GET_USER_START });
    return api
      .getUserWithToken()
      .then((user) => {
        if (process.env.NODE_ENV === 'production') {
          Sentry.configureScope((scope) => {
            scope.setUser({ id: user.id });
          });
        }
        dispatch({ type: GET_USER_SUCCESS, user });
      })
      .catch((error) => {
        // TODO This probably can be moved into an Axios interceptor nearer to http.js
        if (error.status === 403 || error.status === 502) {
          dispatch({ type: LOG_OUT });
        } else {
          dispatch({ type: GET_USER_ERROR, error });
        }
      });
  };
}

export function getUserConversion() {
  return async (dispatch) => {
    dispatch({ type: GET_USER_CONVERSION_START });
    try {
      const userConversion = await api.getUserConversionWithToken();
      dispatch({ type: GET_USER_CONVERSION_SUCCESS, userConversion });
    } catch (error) {
      dispatch({ type: GET_USER_CONVERSION_ERROR, error });
    }
  };
}

export function logOut() {
  return (dispatch) => {
    if (process.env.NODE_ENV === 'production') {
      Sentry.configureScope((scope) => {
        scope.clear();
      });
    }
    return api.logout().then(() => {
      dispatch({ type: LOG_OUT });
    });
  };
}
export function setLoginToRedirect() {
  return { type: SET_LOGIN_TO_REDIRECT };
}

export function useRedirectLoginWithPhoneNumber(phoneNumber, personalCode) {
  return (dispatch) => {
    dispatch(setLoginToRedirect());
    dispatch(authenticateWithMobileId(phoneNumber, personalCode));
  };
}

export function useRedirectLoginWithIdCard() {
  return (dispatch) => {
    dispatch(setLoginToRedirect());
    dispatch(authenticateWithIdCard());
  };
}

export function useRedirectLoginWithIdCode(personalCode) {
  return (dispatch) => {
    dispatch(setLoginToRedirect());
    dispatch(authenticateWithIdCode(personalCode));
  };
}
