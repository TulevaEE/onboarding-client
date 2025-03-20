/* eslint-disable no-param-reassign,no-underscore-dangle */
import { SubmissionError } from 'redux-form';

import { redirectToPayment, updateUserWithToken } from '../api';
import {
  UPDATE_USER_START,
  UPDATE_USER_SUCCESS,
  UPDATE_USER_ERROR,
  USER_UPDATED,
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

// This method calls PATCH /me, but does not update contact details in EPIS
// Reason being – during II or III pillar flows, user may not have pension account
// Updating contact details in EPIS before pension account is created causes an error
// So this method is used to update phone and email in our database
// but crucially, user returned is **the user argument that was passed in to the method**, not the one returned from the backend request
// The user argument passed into the method also contains the address field from the form required for EPIS
// And contact details from the user argument are attached to mandate which are then used to initialize contact details in EPIS
// when opening pension account with this request, and just updated otherwise
export function updateUserWithoutEpisUpdate(user) {
  return (dispatch) =>
    dispatch(
      updateUser({
        email: user.email,
        phoneNumber: user.phoneNumber,
      }),
    ).then(() => dispatch({ type: UPDATE_USER_SUCCESS, newUser: user }));
}

export function updateUser(user) {
  return (dispatch) => {
    dispatch({ type: UPDATE_USER_START });
    return updateUserWithToken(user)
      .then((newUser) => dispatch({ type: UPDATE_USER_SUCCESS, newUser }))
      .catch((errorResponse) => {
        dispatch({ type: UPDATE_USER_ERROR, errorResponse });
        throw new SubmissionError(toFieldErrors(errorResponse));
      });
  };
}

export function userUpdated() {
  return (dispatch) => dispatch({ type: USER_UPDATED });
}

export function createNewMember(user) {
  return (dispatch) => {
    dispatch({ type: UPDATE_USER_START });

    return updateUserWithToken(user)
      .then((newUser) => {
        dispatch({ type: UPDATE_USER_SUCCESS, newUser });
        redirectToPayment({
          recipientPersonalCode: newUser.personalCode,
          amount: null,
          currency: 'EUR',
          type: 'MEMBER_FEE',
          paymentChannel: 'TULUNDUSUHISTU',
        });
      })
      .catch((errorResponse) => {
        dispatch({ type: UPDATE_USER_ERROR, errorResponse });
        throw new SubmissionError(toFieldErrors(errorResponse));
      });
  };
}
