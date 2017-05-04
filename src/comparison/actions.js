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

export function changeSalary(salary) {
  return (dispatch) => {
    dispatch({ type: COMPARISON_SALARY_CHANGE, salary });
    dispatch(getComparison());
  };
}

export function changeRate(rate) {
  return (dispatch) => {
    dispatch({ type: COMPARISON_RATE_CHANGE, rate });
    dispatch(getComparison());
  };
}

export default getComparison;
