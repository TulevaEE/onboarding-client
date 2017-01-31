import { push } from 'react-router-redux';

import {
  CHANGE_PHONE_NUMBER,

  MOBILE_AUTHENTICATION_START,
  MOBILE_AUTHENTICATION_START_SUCCESS,
  MOBILE_AUTHENTICATION_START_ERROR,

  MOBILE_AUTHENTICATION_SUCCESS,
  MOBILE_AUTHENTICATION_ERROR,
  MOBILE_AUTHENTICATION_CANCEL,

  GET_USER_START,
  GET_USER_SUCCESS,
  GET_USER_ERROR,
} from './constants';

import { api } from '../common';

const POLL_DELAY = 1000;

let timeout;

export function changePhoneNumber(phoneNumber) {
  return { type: CHANGE_PHONE_NUMBER, phoneNumber };
}

function getToken() {
  return (dispatch) => {
    if (timeout && process.env.NODE_ENV !== 'test') {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      api
        .getToken()
        .then((token) => {
          if (token) { // authentication complete
            dispatch({ type: MOBILE_AUTHENTICATION_SUCCESS, token });
            dispatch(push('/steps/select-exchange'));
          } else { // authentication not yet completed, poll again.
            dispatch(getToken());
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
        dispatch(getToken());
      })
      .catch(error => dispatch({ type: MOBILE_AUTHENTICATION_START_ERROR, error }));
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
      .then(user => dispatch({ type: GET_USER_SUCCESS, user }))
      .catch(error => dispatch({ type: GET_USER_ERROR, error }));
  };
}
