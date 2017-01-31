import { push } from 'react-router-redux';

import {
  CHANGE_PHONE_NUMBER,
  MOBILE_AUTHENTICATION_START,
  MOBILE_AUTHENTICATION_START_SUCCESS,
  MOBILE_AUTHENTICATION_START_ERROR,
  MOBILE_AUTHENTICATION_SUCCESS,
  MOBILE_AUTHENTICATION_ERROR,
  MOBILE_AUTHENTICATION_CANCEL,
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
            dispatch(push('/step/select-exchange'));
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
    dispatch({ type: MOBILE_AUTHENTICATION_START, phoneNumber });
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
