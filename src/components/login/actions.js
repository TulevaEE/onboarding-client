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

import { ID_CARD_LOGIN_START_FAILED_ERROR } from '../common/errorAlert/ErrorAlert';

import { getAuthentication } from '../common/authenticationManager';
import { isMobileDevice } from '../common/isMobileDevice';
import {
  forgetMobileIdPhoneNumber,
  rememberMobileIdPhoneNumber,
} from './mobileId/rememberedPhoneNumbers';

const POLL_DELAY = 1000;
let timeout;
let smartIdAttempt = null;
let smartIdStartSequence = 0;

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

function getMobileIdTokens(onSuccess = () => undefined) {
  return (dispatch, getState) => {
    timeout = setTimeout(() => {
      api
        .getMobileIdTokens()
        .then((tokens) => {
          if (isTokenPresent(tokens)) {
            onSuccess();
            dispatch({
              type: MOBILE_AUTHENTICATION_SUCCESS,
              tokens,
              method: 'MOBILE_ID',
            });
            dispatch(handleLogin());
          } else if (getState().login.loadingAuthentication) {
            dispatch(getMobileIdTokens(onSuccess));
          }
        })
        .catch((error) => dispatch({ type: MOBILE_AUTHENTICATION_ERROR, error }));
    }, POLL_DELAY);
  };
}

export function authenticateWithMobileId(phoneNumber, personalCode, rememberPhoneNumber = false) {
  return (dispatch) => {
    dispatch({ type: MOBILE_AUTHENTICATION_START });
    return api
      .authenticateWithMobileId(phoneNumber, personalCode)
      .then((controlCode) => {
        dispatch({ type: MOBILE_AUTHENTICATION_START_SUCCESS, controlCode });
        dispatch(
          getMobileIdTokens(() => {
            if (rememberPhoneNumber) {
              rememberMobileIdPhoneNumber(personalCode, phoneNumber);
            } else {
              forgetMobileIdPhoneNumber(personalCode);
            }
          }),
        );
      })
      .catch((error) => dispatch({ type: MOBILE_AUTHENTICATION_START_ERROR, error }));
  };
}

const logPoll = (stage, value = '') =>
  // eslint-disable-next-line no-console
  console.log(`[poll] ${stage}`, value, Date.now());

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

function savePendingSmartIdAuthentication({ web2AppLink, controlCode, returnPath }) {
  if (!window.sessionStorage) {
    return;
  }
  try {
    sessionStorage.setItem(
      PENDING_SMART_ID_KEY,
      JSON.stringify({ web2AppLink, controlCode, returnPath, startedAt: Date.now() }),
    );
  } catch (error) {
    logPoll('pending-login-persistence-failed', error); // reload recovery degrades, login proceeds
  }
}

function clearPendingSmartIdAuthentication() {
  if (window.sessionStorage) {
    sessionStorage.removeItem(PENDING_SMART_ID_KEY);
  }
}

function loadPendingSmartIdAuthentication() {
  if (!window.sessionStorage) {
    return null;
  }
  try {
    const pending = JSON.parse(sessionStorage.getItem(PENDING_SMART_ID_KEY));
    return pending && pending.startedAt ? pending : null;
  } catch (error) {
    return null;
  }
}

export function getPendingSmartIdReturnPath() {
  const pending = loadPendingSmartIdAuthentication();
  return pending?.returnPath ?? null;
}

export function resumePendingSmartIdAuthentication() {
  return (dispatch, getState) => {
    const pending = loadPendingSmartIdAuthentication();
    if (!pending) {
      return;
    }
    if (Date.now() - pending.startedAt > PENDING_SMART_ID_TTL_MILLIS) {
      clearPendingSmartIdAuthentication();
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
    if (window.location.pathname.startsWith(smartIdCallbackPath)) {
      return; // the callback page completes the login itself
    }
    logPoll('resume-pending-login');
    dispatch({ type: MOBILE_AUTHENTICATION_START });
    if (pending.web2AppLink) {
      dispatch({ type: SMART_ID_LOGIN_START_SUCCESS, web2AppLink: pending.web2AppLink });
    }
    if (pending.controlCode) {
      dispatch({ type: MOBILE_AUTHENTICATION_START_SUCCESS, controlCode: pending.controlCode });
    }
    dispatch(getSmartIdTokens());
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

export const getSmartIdTokens = () => (dispatch, getState) => {
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
      const tokens = await api.getSmartIdTokens({ signal: controller.signal });
      if (attempt !== smartIdAttempt || controller !== attempt.controller) {
        return undefined; // superseded — ignore late replies
      }
      logPoll('fetch-resolved', tokens);

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
    if (document.visibilityState !== 'visible') {
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

export function startSmartIdLogin(language, flow = 'DEVICE_LINK') {
  return (dispatch, getState) => {
    smartIdStartSequence += 1;
    const startSequence = smartIdStartSequence;
    dispatch({ type: MOBILE_AUTHENTICATION_START });
    return api
      .startSmartIdLogin(language, flow)
      .then((start) => {
        if (startSequence !== smartIdStartSequence) {
          return; // canceled or superseded while the session start was pending
        }
        const returnPath = getState().router?.location?.state?.from;
        if (start.flow === 'NOTIFICATION') {
          const controlCode = start.verificationCode;
          savePendingSmartIdAuthentication({ controlCode, returnPath });
          dispatch({ type: MOBILE_AUTHENTICATION_START_SUCCESS, controlCode });
          dispatch(getSmartIdTokens());
          return;
        }
        const { web2AppLink } = start;
        savePendingSmartIdAuthentication({ web2AppLink, returnPath });
        dispatch({ type: SMART_ID_LOGIN_START_SUCCESS, web2AppLink });
        dispatch(getSmartIdTokens());
        if (isMobileDevice()) {
          window.location.assign(web2AppLink);
        }
      })
      .catch((error) => {
        if (startSequence !== smartIdStartSequence) {
          return;
        }
        dispatch({ type: MOBILE_AUTHENTICATION_START_ERROR, error });
      });
  };
}

export function completeSmartIdLogin(callback) {
  return (dispatch) => {
    smartIdStartSequence += 1;
    const startSequence = smartIdStartSequence;
    dispatch({ type: MOBILE_AUTHENTICATION_START });
    return api
      .completeSmartIdCallback(callback)
      .then(() => {
        if (startSequence !== smartIdStartSequence) {
          return;
        }
        dispatch(getSmartIdTokens());
      })
      .catch((error) => {
        if (startSequence !== smartIdStartSequence) {
          return;
        }
        dispatch({ type: MOBILE_AUTHENTICATION_START_ERROR, error });
      });
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

export function cancelMobileAuthentication() {
  if (timeout) {
    clearTimeout(timeout);
  }
  smartIdStartSequence += 1; // invalidate any /authenticate still in flight
  stopSmartIdPolling();
  clearPendingSmartIdAuthentication();
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
