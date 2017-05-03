import {
  getComparisonWithToken,
} from '../common/api';

import {
  GET_COMPARISON_START,
  GET_COMPARISON_SUCCESS,
  GET_COMPARISON_ERROR,
  COMPARISON_SALARY_CHANGE,
  COMPARISON_RATE_CHANGE,
} from './constants';

export function getComparison(monthlyWage, returnRate) {
  return (dispatch, getState) => {
    dispatch({ type: GET_COMPARISON_START });
    return getComparisonWithToken(monthlyWage, returnRate, getState().login.token)
      .then(comparison => dispatch({ type: GET_COMPARISON_SUCCESS, comparison }))
      .catch(error => dispatch({ type: GET_COMPARISON_ERROR, error }));
  };
}

export function changeSalary(salary) {
  return (dispatch) => {
    dispatch({ type: COMPARISON_SALARY_CHANGE, salary });
  };
}

export function changeRate(rate) {
  return (dispatch) => {
    dispatch({ type: COMPARISON_RATE_CHANGE, rate });
  };
}

export default getComparison;
