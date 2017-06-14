import Raven from 'raven-js';
import { push } from 'react-router-redux';
import config from 'react-global-configuration';

import {
  CHANGE_PHONE_NUMBER,

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

  TOKEN_REFRESH_START,
  TOKEN_REFRESH_SUCCESS,
  TOKEN_REFRESH_ERROR,

  USE_REDIRECT_LOGIN,

  LOG_OUT,

  QUERY_PARAMETERS,
} from './constants';

import { api, http } from '../common';

const POLL_DELAY = 1000;

let timeout;

export function changePhoneNumber(phoneNumber) {
  return { type: CHANGE_PHONE_NUMBER, phoneNumber };
}

export function changeEmail(email) {
  return { type: CHANGE_EMAIL, email };
}

const LOGIN_COOKIE_TOKEN_NAME = 'token';
const LOGIN_COOKIE_REFRESH_TOKEN_NAME = 'refreshToken';
const LOGIN_COOKIE_EMAIL_NAME = 'email';
const LOGIN_COOKIE_METHOD_NAME = 'loginMethod';

function setCookie(name, value) {
  const date = new Date();
  date.setTime(date.getTime() + (30 * 1000));
  const expires = `;expires=${date.toGMTString()}`;
  const domain = `;domain=${window.location.hostname}`;
  document.cookie = `${name}=${value};path=/${domain}${expires}`;
}

function setLoginCookies(getState) {
  setCookie(LOGIN_COOKIE_TOKEN_NAME, getState().login.token);
  setCookie(LOGIN_COOKIE_REFRESH_TOKEN_NAME, getState().login.refreshToken);
  setCookie(LOGIN_COOKIE_EMAIL_NAME, getState().login.email);
  setCookie(LOGIN_COOKIE_METHOD_NAME, getState().login.loginMethod);
}

function hanleLogin() {
  return (dispatch, getState) => {
    if (getState().login.redirectLogin) {
      setLoginCookies(getState);
      window.location = config.get('applicationUrl');
    } else {
      dispatch(push('/'));
    }
  };
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  return null;
}

export function handleLoginCookies() {
  return (dispatch) => {
    const email = getCookie(LOGIN_COOKIE_EMAIL_NAME);
    if (email) {
      dispatch(changeEmail(email));
    }
    const tokens = {
      accessToken: getCookie(LOGIN_COOKIE_TOKEN_NAME),
      refreshToken: getCookie(LOGIN_COOKIE_REFRESH_TOKEN_NAME),
    };
    if (tokens.accessToken && tokens.refreshToken) {
      if (getCookie(LOGIN_COOKIE_METHOD_NAME) === 'mobileId') {
        dispatch({ type: MOBILE_AUTHENTICATION_SUCCESS, tokens });
        dispatch(push('/'));
      } else if (getCookie(LOGIN_COOKIE_METHOD_NAME) === 'idCard') {
        dispatch({ type: ID_CARD_AUTHENTICATION_SUCCESS, tokens });
        dispatch(push('/'));
      } else {
        throw new Error('Login method not recognized.');
      }
    }
  };
}

function getMobileIdTokens() {
  return (dispatch, getState) => {
    if (timeout && process.env.NODE_ENV !== 'test') {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      api
        .getMobileIdTokens()
        .then((tokens) => {
          if (tokens.accessToken) { // authentication complete
            dispatch({ type: MOBILE_AUTHENTICATION_SUCCESS, tokens });
            dispatch(hanleLogin());
          } else if (getState().login.loadingAuthentication) { // authentication not yet completed
            dispatch(getMobileIdTokens()); // poll again
          }
        })
        .catch(error => dispatch({ type: MOBILE_AUTHENTICATION_ERROR, error }));
    }, POLL_DELAY);
  };
}

export function authenticateWithPhoneNumber(phoneNumber) {
  return (dispatch) => {
    dispatch({ type: MOBILE_AUTHENTICATION_START });
    return api
      .authenticateWithPhoneNumber(phoneNumber)
      .then((controlCode) => {
        dispatch({ type: MOBILE_AUTHENTICATION_START_SUCCESS, controlCode });
        dispatch(getMobileIdTokens());
      })
      .catch(error => dispatch({ type: MOBILE_AUTHENTICATION_START_ERROR, error }));
  };
}

function getIdCardTokens() {
  return (dispatch, getState) => {
    if (timeout && process.env.NODE_ENV !== 'test') {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      api
        .getIdCardTokens()
        .then((tokens) => {
          if (tokens.accessToken) { // authentication complete
            dispatch({ type: ID_CARD_AUTHENTICATION_SUCCESS, tokens });
            dispatch(hanleLogin());
          } else if (getState().login.loadingAuthentication) { // authentication not yet completed
            dispatch(getIdCardTokens()); // poll again
          }
        })
        .catch(error => dispatch({ type: ID_CARD_AUTHENTICATION_ERROR, error }));
    }, POLL_DELAY);
  };
}

export function authenticateWithIdCard() {
  return (dispatch) => {
    dispatch({ type: ID_CARD_AUTHENTICATION_START });
    return api
      .authenticateWithIdCard()
      .then(() => {
        dispatch({ type: ID_CARD_AUTHENTICATION_START_SUCCESS });
        dispatch(getIdCardTokens());
      })
      .catch(error => dispatch({ type: ID_CARD_AUTHENTICATION_START_ERROR, error }));
  };
}

export function cancelMobileAuthentication() {
  if (timeout) {
    clearTimeout(timeout);
  }
  return { type: MOBILE_AUTHENTICATION_CANCEL };
}

export function getUser() {
  return (dispatch, getState) => {
    dispatch({ type: GET_USER_START });
    return api
      .getUserWithToken(getState().login.token)
      .then((user) => {
        if (process.env.NODE_ENV === 'production') {
          Raven.setUserContext({ id: user.id });
        }
        dispatch({ type: GET_USER_SUCCESS, user });
      })
      .catch((error) => {
        if (error.status === 401) {
          dispatch({ type: LOG_OUT });
        } else {
          dispatch({ type: GET_USER_ERROR, error });
        }
      });
  };
}

export function getUserConversion() {
  return (dispatch, getState) => {
    dispatch({ type: GET_USER_CONVERSION_START });
    return api
      .getUserConversionWithToken(getState().login.token)
      .then((userConversion) => {
        dispatch({ type: GET_USER_CONVERSION_SUCCESS, userConversion });
      })
      .catch((error) => {
        dispatch({ type: GET_USER_CONVERSION_ERROR, error });
      });
  };
}

export function refreshToken() {
  return (dispatch, getState) => {
    dispatch({ type: TOKEN_REFRESH_START });
    return api.refreshTokenWith(getState().login.refreshToken)
      .then((tokens) => {
        dispatch({ type: TOKEN_REFRESH_SUCCESS, tokens });
      })
      .catch(error => dispatch({ type: TOKEN_REFRESH_ERROR, error }));
  };
}

export function logOut() {
  if (process.env.NODE_ENV === 'production') {
    Raven.setUserContext(); // unauthenticate
  }
  http.resetStatisticsIdentification();
  return { type: LOG_OUT };
}

export function mapUrlQueryParamsToState(query) {
  return { type: QUERY_PARAMETERS, query };
}

export function useRedirectLogin() {
  return { type: USE_REDIRECT_LOGIN };
}

export function useRedirectLoginWithPhoneNumber(phoneNumber) {
  return (dispatch) => {
    dispatch(useRedirectLogin());
    dispatch(authenticateWithPhoneNumber(phoneNumber));
  };
}

export function useRedirectLoginWithIdCard() {
  return (dispatch) => {
    dispatch(useRedirectLogin());
    dispatch(authenticateWithIdCard());
  };
}
