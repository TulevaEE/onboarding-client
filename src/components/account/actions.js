import { getCapitalRowsWithToken } from '../common/api';

import {
  GET_INITIAL_CAPITAL_START,
  GET_INITIAL_CAPITAL_SUCCESS,
  GET_INITIAL_CAPITAL_ERROR,
} from './constants';

export function getInitialCapital() {
  return (dispatch) => {
    dispatch({ type: GET_INITIAL_CAPITAL_START });
    return getCapitalRowsWithToken()
      .then((initialCapital) => dispatch({ type: GET_INITIAL_CAPITAL_SUCCESS, initialCapital }))
      .catch((error) => dispatch({ type: GET_INITIAL_CAPITAL_ERROR, error }));
  };
}
