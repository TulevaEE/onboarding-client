import { push } from 'react-router-redux';
import { SubmissionError } from 'redux-form';

import {
  createUserWithToken,
} from '../common/api';
import {
  CREATE_NEW_USER_START,
  CREATE_NEW_USER_SUCCESS,
  CREATE_NEW_USER_ERROR,
} from './constants';

function toFieldErrors(errorResponse) {
  return errorResponse.body.errors.reduce((totalErrors, currentError) => {
    // eslint-disable-next-line no-param-reassign
    totalErrors[currentError.path] = currentError.code;
    return totalErrors;
  }, {});
}

export function createNewUser(user) {
  return (dispatch, getState) => {
    dispatch({ type: CREATE_NEW_USER_START });
    return createUserWithToken(user, getState().login.token)
      .then((newUser) => {
        dispatch({ type: CREATE_NEW_USER_SUCCESS, newUser });
        dispatch(push('/payment'));
      },
      ).catch((errorResponse) => {
        dispatch({ type: CREATE_NEW_USER_ERROR, errorResponse });
        throw new SubmissionError(toFieldErrors(errorResponse));
      });
  };
}

export default createNewUser;
