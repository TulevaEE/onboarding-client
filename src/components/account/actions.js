import { getInitialCapitalWithToken } from '../common/api';

import {
  GET_INITIAL_CAPITAL_START,
  GET_INITIAL_CAPITAL_SUCCESS,
  GET_INITIAL_CAPITAL_ERROR,
} from './constants';

import { withUpdatableAuthenticationPrincipal } from '../common/updatableAuthenticationPrincipal';

export function getInitialCapital() {
  return (dispatch, getState) => {
    dispatch({ type: GET_INITIAL_CAPITAL_START });
    return getInitialCapitalWithToken(
      withUpdatableAuthenticationPrincipal(getState().login.authenticationPrincipal, dispatch),
    )
      .then((initialCapital) => dispatch({ type: GET_INITIAL_CAPITAL_SUCCESS, initialCapital }))
      .catch((error) => dispatch({ type: GET_INITIAL_CAPITAL_ERROR, error }));
  };
}
