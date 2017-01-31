import {
  CHANGE_PHONE_NUMBER,
  MOBILE_AUTHENTICATION_START,
  MOBILE_AUTHENTICATION_START_SUCCESS,
  MOBILE_AUTHENTICATION_START_ERROR,
  MOBILE_AUTHENTICATION_CANCEL,
} from './constants';

import { api } from '../common';

export function changePhoneNumber(phoneNumber) {
  return { type: CHANGE_PHONE_NUMBER, phoneNumber };
}

export function authenticateWithPhoneNumber(phoneNumber) {
  return (dispatch) => {
    dispatch({ type: MOBILE_AUTHENTICATION_START, phoneNumber });
    return api
      .authenticateWithPhoneNumber(phoneNumber)
      .then(controlCode => dispatch({ type: MOBILE_AUTHENTICATION_START_SUCCESS, controlCode }))
      .catch(error => dispatch({ type: MOBILE_AUTHENTICATION_START_ERROR, error }));
  };
}

export function cancelMobileAuthentication() {
  return { type: MOBILE_AUTHENTICATION_CANCEL };
}
