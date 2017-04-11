import { push } from 'react-router-redux';
import Raven from 'raven-js';

import {
  CHANGE_PHONE_NUMBER,

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

  LOG_OUT,
} from './constants';

import { api, http } from '../common';

const POLL_DELAY = 1000;

let timeout;

export function changePhoneNumber(phoneNumber) {
  return { type: CHANGE_PHONE_NUMBER, phoneNumber };
}

function getMobileIdToken() {
  return (dispatch, getState) => {
    if (timeout && process.env.NODE_ENV !== 'test') {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      api
        .getMobileIdToken()
        .then((token) => {
          if (token) { // authentication complete
            dispatch({ type: MOBILE_AUTHENTICATION_SUCCESS, token });
            dispatch(push('/steps/select-sources'));
          } else if (getState().login.loadingAuthentication) { // authentication not yet completed
            dispatch(getMobileIdToken()); // poll again
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
        dispatch(getMobileIdToken());
      })
      .catch(error => dispatch({ type: MOBILE_AUTHENTICATION_START_ERROR, error }));
  };
}

function getIdCardToken() {
  return (dispatch, getState) => {
    if (timeout && process.env.NODE_ENV !== 'test') {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      api
        .getIdCardToken()
        .then((token) => {
          if (token) { // authentication complete
            dispatch({ type: ID_CARD_AUTHENTICATION_SUCCESS, token });
            dispatch(push('/steps/select-sources'));
          } else if (getState().login.loadingAuthentication) { // authentication not yet completed
            dispatch(getIdCardToken()); // poll again
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
        dispatch(getIdCardToken());
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

export function logOut() {
  if (process.env.NODE_ENV === 'production') {
    Raven.setUserContext(); // unauthenticate
  }
  http.resetStatisticsIdentification();
  return { type: LOG_OUT };
}
