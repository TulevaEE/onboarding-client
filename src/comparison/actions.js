import {
  getComparisonWithToken,
} from '../common/api';

import {
  GET_COMPARISON_START,
  GET_COMPARISON_SUCCESS,
  GET_COMPARISON_ERROR,
  COMPARISON_SALARY_CHANGE,
  COMPARISON_RATE_CHANGE,
  SHOW_COMPARISON,
  HIDE_COMPARISON,
} from './constants';

export function getComparison() {
  return (dispatch, getState) => {
    const salary = getState().comparison.salary;
    const rate = getState().comparison.rate;
    dispatch({ type: GET_COMPARISON_START });
    return getComparisonWithToken(salary, rate, getState().login.token)
        .then(comparison => dispatch({ type: GET_COMPARISON_SUCCESS, comparison }))
        .catch(error => dispatch({ type: GET_COMPARISON_ERROR, error }));
  };
}

export function show() {
  return (dispatch) => {
    dispatch({ type: SHOW_COMPARISON });
  };
}

export function hide() {
  return (dispatch) => {
    dispatch({ type: HIDE_COMPARISON });
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
