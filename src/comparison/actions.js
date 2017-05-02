import {
  getComparisonWithToken,
} from '../common/api';

import {
  GET_COMPARISON_START,
  GET_COMPARISON_SUCCESS,
  GET_COMPARISON_ERROR,
} from './constants';

export function getComparison(monthlyWage, returnRate) {
  return (dispatch, getState) => {
    dispatch({ type: GET_COMPARISON_START });
    return getComparisonWithToken(monthlyWage, returnRate, getState().login.token)
      .then(comparison => dispatch({ type: GET_COMPARISON_SUCCESS, comparison }))
      .catch(error => dispatch({ type: GET_COMPARISON_ERROR, error }));
  };
}

export default getComparison;
