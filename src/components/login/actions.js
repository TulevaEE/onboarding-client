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
  SMART_ID_LOGIN_START_SUCCESS,
  MOBILE_AUTHENTICATION_SUCCESS,
  MOBILE_AUTHENTICATION_ERROR,
  MOBILE_AUTHENTICATION_CANCEL,
  ID_CARD_AUTHENTICATION_START,
  ID_CARD_AUTHENTICATION_START_SUCCESS,
  ID_CARD_AUTHENTICATION_START_ERROR,
  ID_CARD_AUTHENTICATION_SUCCESS,
  ID_CARD_AUTHENTICATION_ERROR,
  WEB_EID_AUTHENTICATION_ERROR,
  LOGIN_ERROR_CLEARED,
  GET_USER_START,
  GET_USER_SUCCESS,
  GET_USER_ERROR,
  GET_USER_CONVERSION_START,
  GET_USER_CONVERSION_SUCCESS,
  GET_USER_CONVERSION_ERROR,
  SET_LOGIN_TO_REDIRECT,
  LOG_OUT,
  smartIdCallbackPath,
} from './constants';

import { api } from '../common';
import { getGlobalErrorCode } from '../common/errorMessage';

import { ID_CARD_LOGIN_START_FAILED_ERROR } from '../common/errorAlert/ErrorAlert';

import { getAuthentication } from '../common/authenticationManager';
import { forgetSmartIdCallbackParameters } from './smartId/smartIdCallbackParameters';
import { pageInView } from './smartId/pageInView';
import { opensTheSmartIdApp } from './smartId/opensTheSmartIdApp';

const POLL_DELAY = 1000;
let timeout;
let smartIdAttempt = null;
let loginStartSequence = 0;

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
            dispatch({
              type: MOBILE_AUTHENTICATION_SUCCESS,
              tokens,
              method: 'MOBILE_ID',
            });
            dispatch(handleLogin());
          } else if (getState().login.loadingAuthentication) {
            dispatch(getMobileIdTokens());
          }
        })
        .catch((error) => dispatch({ type: MOBILE_AUTHENTICATION_ERROR, error }));
    }, POLL_DELAY);
  };
}

function abandonLoginStartsInFlight() {
  loginStartSequence += 1;
}

function beginLoginStart() {
  abandonLoginStartsInFlight();
  const startSequence = loginStartSequence;
  return () => startSequence !== loginStartSequence;
}

function startMobileIdLogin(start) {
  return (dispatch) => {
    const canceledOrSuperseded = beginLoginStart();
    dispatch({ type: MOBILE_AUTHENTICATION_START });
    return start()
      .then((controlCode) => {
        if (canceledOrSuperseded()) {
          return;
        }
        dispatch({ type: MOBILE_AUTHENTICATION_START_SUCCESS, controlCode });
        dispatch(getMobileIdTokens());
      })
      .catch((error) => {
        if (canceledOrSuperseded()) {
          return;
        }
        dispatch({ type: MOBILE_AUTHENTICATION_START_ERROR, error });
      });
  };
}

export function authenticateWithMobileId(phoneNumber, personalCode, rememberMe = false) {
  return startMobileIdLogin(() =>
    api.authenticateWithMobileId(phoneNumber, personalCode, rememberMe),
  );
}

export function authenticateWithRememberedMobileId() {
  return startMobileIdLogin(() => api.startRememberedMobileIdLogin());
}

const isProductionBuild = () => process.env.NODE_ENV === 'production';

const logPoll = (stage, value = '') => {
  if (isProductionBuild()) {
    return;
  }
  // eslint-disable-next-line no-console
  console.log(`[poll] ${stage}`, value, Date.now());
};

// The pending login survives the page reload Android/iOS force on tab discard while
// the user confirms in the Smart-ID app; the completed result waits in the backend
// session, so a resumed poll can still collect it within the backend grant TTL.
const PENDING_SMART_ID_KEY = 'pendingSmartIdAuthentication';
const PENDING_SMART_ID_TTL_MILLIS = 180 * 1000; // mirrors SmartIdAuthProvider.GRANT_TTL

// Per-browser fetch network-failure messages: transport blips must retry, not kill the
// login — only definitive server answers may stop polling and drop the pending record.
const TRANSIENT_POLL_ERRORS = [
  'Load failed', // Safari
  'Failed to fetch', // Chromium
  'NetworkError when attempting to fetch resource.', // Firefox
];

function clearPendingSmartIdAuthentication() {
  if (window.sessionStorage) {
    sessionStorage.removeItem(PENDING_SMART_ID_KEY);
  }
}

function savePendingSmartIdAuthentication({
  authenticationHash,
  web2AppLink,
  rememberMe,
  qrCodeRequested,
  controlCode,
  returnPath,
  language,
  callbackAccepted,
}) {
  if (!window.sessionStorage) {
    return;
  }
  try {
    sessionStorage.setItem(
      PENDING_SMART_ID_KEY,
      JSON.stringify({
        authenticationHash,
        web2AppLink,
        rememberMe,
        qrCodeRequested,
        controlCode,
        returnPath,
        language,
        callbackAccepted,
        startedAt: Date.now(),
      }),
    );
  } catch (error) {
    clearPendingSmartIdAuthentication();
    logPoll('pending-login-persistence-failed', error); // reload recovery degrades, login proceeds
  }
}

function loadPendingSmartIdAuthentication() {
  if (!window.sessionStorage) {
    return null;
  }
  try {
    const pending = JSON.parse(sessionStorage.getItem(PENDING_SMART_ID_KEY));
    return pending && pending.startedAt && pending.authenticationHash ? pending : null;
  } catch (error) {
    return null;
  }
}

export function getPendingSmartIdReturnPath() {
  const pending = loadPendingSmartIdAuthentication();
  return pending?.returnPath ?? null;
}

const onSmartIdCallbackPage = () => window.location.pathname.startsWith(smartIdCallbackPath);

export function getPendingSmartIdStartedAt() {
  const pending = loadPendingSmartIdAuthentication();
  return pending?.startedAt ?? null;
}

export function getPendingSmartIdLanguage() {
  const pending = loadPendingSmartIdAuthentication();
  return pending?.language ?? null;
}

function loadUnexpiredPendingSmartIdAuthentication() {
  const pending = loadPendingSmartIdAuthentication();
  if (pending && Date.now() - pending.startedAt > PENDING_SMART_ID_TTL_MILLIS) {
    clearPendingSmartIdAuthentication();
    return null;
  }
  return pending;
}

export function hasAcceptedSmartIdCallback() {
  return Boolean(loadUnexpiredPendingSmartIdAuthentication()?.callbackAccepted);
}

export function resumePendingSmartIdAuthentication() {
  return (dispatch, getState) => {
    const pending = loadUnexpiredPendingSmartIdAuthentication();
    if (!pending) {
      return;
    }
    if (getAuthentication().isAuthenticated()) {
      clearPendingSmartIdAuthentication(); // a completed login supersedes the pending one
      return;
    }
    if (getState().login.loadingAuthentication) {
      return; // another authentication flow is already running
    }
    if (window.location.pathname.startsWith('/trigger-procedure')) {
      return; // partner handover brings its own token
    }
    if (onSmartIdCallbackPage()) {
      return;
    }
    logPoll('resume-pending-login');
    dispatch({ type: MOBILE_AUTHENTICATION_START });
    if (pending.web2AppLink) {
      dispatch({
        type: SMART_ID_LOGIN_START_SUCCESS,
        web2AppLink: pending.web2AppLink,
        rememberMe: pending.rememberMe === true,
        qrCodeRequested: pending.qrCodeRequested === true,
      });
    }
    if (pending.controlCode) {
      dispatch({
        type: MOBILE_AUTHENTICATION_START_SUCCESS,
        controlCode: pending.controlCode,
        verificationCodeChoice: true,
      });
    }
    dispatch(getSmartIdTokens(pending.authenticationHash));
  };
}

// A poll request stranded by tab suspension (iOS Safari kills in-flight fetches on
// app switch and the promise may never settle) must never block later polling —
// all attempt state is scoped here and reclaimed on cancel, retry, and completion.
function stopSmartIdPolling() {
  if (!smartIdAttempt) {
    return;
  }
  clearTimeout(smartIdAttempt.timeout);
  if (smartIdAttempt.controller) {
    smartIdAttempt.controller.abort();
  }
  document.removeEventListener('visibilitychange', smartIdAttempt.pollNow);
  window.removeEventListener('pageshow', smartIdAttempt.pollNow);
  smartIdAttempt = null;
}

const isSmartIdTimeout = (error) => getGlobalErrorCode(error?.body) === 'smart.id.timeout';

const isSmartIdSessionNotFound = (error) =>
  getGlobalErrorCode(error?.body) === 'auth.session.not.found';

const waitsForTheSmartIdAppOnThisPhone = ({ login }) =>
  Boolean(login.smartIdWeb2AppLink) &&
  opensTheSmartIdApp({ qrCodeRequested: login.smartIdQrCodeRequested });

const callbackTakenByAnotherTab = (error, state) =>
  isSmartIdSessionNotFound(error) && waitsForTheSmartIdAppOnThisPhone(state);

export const getSmartIdTokens = (authenticationHash) => (dispatch, getState) => {
  stopSmartIdPolling();

  const attempt = {};
  smartIdAttempt = attempt;

  const poll = async () => {
    if (attempt !== smartIdAttempt) {
      return undefined;
    }
    if (attempt.controller) {
      attempt.controller.abort(); // reclaim a request stranded by tab suspension
    }
    const controller = new AbortController();
    attempt.controller = controller;
    logPoll('request-start');

    try {
      const tokens = await api.getSmartIdTokens(authenticationHash, { signal: controller.signal });
      if (attempt !== smartIdAttempt || controller !== attempt.controller) {
        return undefined; // superseded — ignore late replies
      }
      logPoll('fetch-resolved', Boolean(tokens?.accessToken));

      if (tokens?.accessToken && tokens?.refreshToken) {
        logPoll('token-present → SUCCESS');
        stopSmartIdPolling();
        clearPendingSmartIdAuthentication();

        dispatch({
          type: MOBILE_AUTHENTICATION_SUCCESS,
          tokens,
          method: 'SMART_ID',
        });
        return dispatch(handleLogin());
      }

      if (getState().login.loadingAuthentication) {
        logPoll('token-absent → poll-again');
        attempt.timeout = setTimeout(poll, POLL_DELAY);
      }
    } catch (error) {
      if (attempt !== smartIdAttempt || controller !== attempt.controller) {
        return undefined;
      }
      logPoll('fetch-error', error);

      if (TRANSIENT_POLL_ERRORS.includes(error.message)) {
        logPoll('network-error → poll-again');
        attempt.timeout = setTimeout(poll, POLL_DELAY);
        return undefined;
      }

      stopSmartIdPolling();
      clearPendingSmartIdAuthentication();
      logPoll('fatal-error → STOP');
      if (attempt.qrCodeExpired && isSmartIdTimeout(error)) {
        return undefined;
      }
      if (callbackTakenByAnotherTab(error, getState())) {
        return dispatch({ type: MOBILE_AUTHENTICATION_CANCEL });
      }
      return dispatch({ type: MOBILE_AUTHENTICATION_ERROR, error });
    }
    return undefined;
  };

  // iOS Safari suspends the page while the user confirms in the Smart-ID app,
  // freezing timers and stranding fetches — poll the moment the tab comes back.
  attempt.pollNow = () => {
    if (attempt !== smartIdAttempt || !getState().login.loadingAuthentication) {
      return;
    }
    if (!pageInView()) {
      return;
    }
    logPoll('tab-visible → poll-now');
    clearTimeout(attempt.timeout);
    poll();
  };
  document.addEventListener('visibilitychange', attempt.pollNow);
  window.addEventListener('pageshow', attempt.pollNow);

  logPoll('schedule-timeout', POLL_DELAY);
  attempt.timeout = setTimeout(poll, POLL_DELAY);
};

const showTheQrCode = { qrCodeRequested: true, afterDeviceLinkStarted: () => {} };

const openTheSmartIdApp = {
  qrCodeRequested: false,
  afterDeviceLinkStarted: (web2AppLink) => window.location.assign(web2AppLink),
};

export function startSmartIdLogin(language, flow = 'DEVICE_LINK', rememberMe = false) {
  return startSmartIdSession(language, flow, rememberMe, showTheQrCode);
}

export function startSmartIdLoginInTheApp(language) {
  return startSmartIdSession(language, 'DEVICE_LINK', false, openTheSmartIdApp);
}

function startSmartIdSession(
  language,
  flow,
  rememberMe,
  { qrCodeRequested, afterDeviceLinkStarted },
) {
  return (dispatch, getState) => {
    const canceledOrSuperseded = beginLoginStart();
    stopSmartIdPolling();
    dispatch({ type: MOBILE_AUTHENTICATION_START });
    const failToStart = (error) => {
      if (canceledOrSuperseded()) {
        return;
      }
      clearPendingSmartIdAuthentication();
      dispatch({ type: MOBILE_AUTHENTICATION_START_ERROR, error });
    };
    return api.startSmartIdLogin(language, flow, rememberMe).then((start) => {
      if (canceledOrSuperseded()) {
        return;
      }
      const returnPath = getState().router?.location?.state?.from;
      const { authenticationHash } = start;
      if (start.flow === 'NOTIFICATION') {
        const controlCode = start.verificationCode;
        savePendingSmartIdAuthentication({
          authenticationHash,
          controlCode,
          returnPath,
          language,
        });
        dispatch({
          type: MOBILE_AUTHENTICATION_START_SUCCESS,
          controlCode,
          verificationCodeChoice: true,
        });
        dispatch(getSmartIdTokens(authenticationHash));
        return;
      }
      const { web2AppLink } = start;
      savePendingSmartIdAuthentication({
        authenticationHash,
        web2AppLink,
        rememberMe,
        qrCodeRequested,
        returnPath,
        language,
      });
      dispatch({ type: SMART_ID_LOGIN_START_SUCCESS, web2AppLink, rememberMe, qrCodeRequested });
      dispatch(getSmartIdTokens(authenticationHash));
      afterDeviceLinkStarted(web2AppLink);
    }, failToStart);
  };
}

const SMART_ID_SESSION_NOT_FOUND = { body: { errors: [{ code: 'auth.session.not.found' }] } };

export function completeSmartIdLogin(callback) {
  return (dispatch) => {
    const canceledOrSuperseded = beginLoginStart();
    dispatch({ type: MOBILE_AUTHENTICATION_START });
    return api
      .completeSmartIdCallback(callback)
      .then((acceptedAuthenticationHash) => {
        forgetSmartIdCallbackParameters();
        if (canceledOrSuperseded()) {
          return;
        }
        const pending = loadPendingSmartIdAuthentication();
        const authenticationHash = acceptedAuthenticationHash ?? pending?.authenticationHash;
        if (!authenticationHash) {
          clearPendingSmartIdAuthentication();
          dispatch({ type: MOBILE_AUTHENTICATION_START_ERROR, error: SMART_ID_SESSION_NOT_FOUND });
          return;
        }
        savePendingSmartIdAuthentication({
          authenticationHash,
          returnPath: pending?.returnPath,
          language: pending?.language,
          callbackAccepted: true,
        });
        dispatch(getSmartIdTokens(authenticationHash));
      })
      .catch((error) => {
        forgetSmartIdCallbackParameters();
        if (canceledOrSuperseded()) {
          return;
        }
        clearPendingSmartIdAuthentication();
        dispatch({ type: MOBILE_AUTHENTICATION_START_ERROR, error });
      });
  };
}

export function resumeAcceptedSmartIdCallback() {
  return (dispatch) => {
    const pending = loadUnexpiredPendingSmartIdAuthentication();
    if (!pending?.callbackAccepted) {
      return;
    }
    abandonLoginStartsInFlight();
    dispatch({ type: MOBILE_AUTHENTICATION_START });
    dispatch(getSmartIdTokens(pending.authenticationHash));
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

export function authenticateWithIdCard() {
  return (dispatch) => {
    dispatch({ type: ID_CARD_AUTHENTICATION_START });

    return api
      .authenticateWithIdCardMtls()
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

export function failWebEidLogin(errorCode) {
  return { type: WEB_EID_AUTHENTICATION_ERROR, errorCode };
}

export function clearLoginError() {
  return { type: LOGIN_ERROR_CLEARED };
}

export function expireSmartIdQrCode() {
  return () => {
    if (smartIdAttempt) {
      smartIdAttempt.qrCodeExpired = true;
    }
  };
}

export function cancelMobileAuthentication() {
  if (timeout) {
    clearTimeout(timeout);
  }
  abandonLoginStartsInFlight();
  stopSmartIdPolling();
  clearPendingSmartIdAuthentication();
  forgetSmartIdCallbackParameters();
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
    // api.logout() drops the local authentication before the request settles, so the
    // local LOG_OUT cleanup (state reset, query cache clear) must run even on failure
    return api.logout().finally(() => {
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

export function useRedirectLoginWithSmartId(language) {
  return (dispatch) => {
    dispatch(setLoginToRedirect());
    dispatch(startSmartIdLogin(language));
  };
}
