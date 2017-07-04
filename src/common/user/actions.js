/* eslint-disable no-param-reassign,no-underscore-dangle */
import { push } from 'react-router-redux';
import { SubmissionError } from 'redux-form';
import config from 'react-global-configuration';

import {
  createUserWithToken,
  updateUserWithToken,
} from '../api';
import {
  UPDATE_USER_START,
  UPDATE_USER_SUCCESS,
  UPDATE_USER_ERROR,
} from './constants';

function toFieldErrors(errorResponse) {
  return errorResponse.body.errors.reduce((totalErrors, currentError) => {
    if (currentError.path) {
      totalErrors[currentError.path] = currentError.code;
    } else {
      totalErrors._error = currentError.code;
    }
    return totalErrors;
  }, {});
}

function updateUserAndPush(user, route) {
  return (dispatch, getState) => {
    dispatch({ type: UPDATE_USER_START });
    return updateUserWithToken(user, getState().login.token)
      .then((newUser) => {
        dispatch({ type: UPDATE_USER_SUCCESS, newUser });
        dispatch(push(route));
      }).catch((errorResponse) => {
        dispatch({ type: UPDATE_USER_ERROR, errorResponse });
        throw new SubmissionError(toFieldErrors(errorResponse));
      });
  };
}

export function registerUser(user) {
  return updateUserAndPush(user, '/steps/payment');
}

export function updateUser(user) {
  return updateUserAndPush(user, '/account');
}

export function createUser(user) {
  return (dispatch) => {
    dispatch({ type: UPDATE_USER_START });
    return createUserWithToken(user, config.get('clientCredentialsAccessToken'))
      .then((newUser) => {
        dispatch({ type: UPDATE_USER_SUCCESS, newUser });
        const paymentUrl = `${config.get('newUserPaymentRedirectBaseUrl')}&reference=${newUser.id}`;
        window.location = paymentUrl;
      }).catch((errorResponse) => {
        dispatch({ type: UPDATE_USER_ERROR, errorResponse });
        throw new SubmissionError(toFieldErrors(errorResponse));
      });
  };
}
