import debounce from 'lodash/debounce';

import {
  getComparisonForSalaryAndRateWithToken,
} from '../common/api';

import {
  GET_COMPARISON_START,
  GET_COMPARISON_SUCCESS,
  GET_COMPARISON_BONUS_SUCCESS,
  GET_COMPARISON_ERROR,
  COMPARISON_SALARY_CHANGE,
  COMPARISON_RATE_CHANGE,
  SHOW_COMPARISON,
  HIDE_COMPARISON,
} from './constants';

const debounceTime = 500;

export function getComparison() {
  return (dispatch, getState) => {
    const salary = getState().comparison.salary;
    const rate = getState().comparison.rate;
    dispatch({ type: GET_COMPARISON_START });
    return getComparisonForSalaryAndRateWithToken(salary, rate, getState().login.token)
      .then(comparison => dispatch({ type: GET_COMPARISON_SUCCESS, comparison }))
      .then(() =>
        getComparisonForSalaryAndRateWithToken(salary, rate, getState().login.token, true))
      .then(comparison => dispatch({ type: GET_COMPARISON_BONUS_SUCCESS, comparison }))
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

export function debouncedSalaryChange(salary) {
  return (dispatch) => {
    dispatch(changeSalary(salary));
    const debouncedDispatch = debounce(dispatch, debounceTime);
    debouncedDispatch(getComparison());
  };
}

export function debouncedRateChange(rate) {
  return (dispatch) => {
    dispatch(changeRate(rate));
    const debouncedDispatch = debounce(dispatch, debounceTime);
    debouncedDispatch(getComparison());
  };
}
