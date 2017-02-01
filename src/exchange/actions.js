import { getPensionFundsWithToken } from '../common/api';
import {
  GET_PENSION_FUNDS_START,
  GET_PENSION_FUNDS_SUCCESS,
  GET_PENSION_FUNDS_ERROR,
} from './constants';

export function getPensionFunds() { // eslint-disable-line
  return (dispatch, getState) => {
    dispatch({ type: GET_PENSION_FUNDS_START });
    return getPensionFundsWithToken(getState().login.token)
      .then(pensionFunds => dispatch({ type: GET_PENSION_FUNDS_SUCCESS, pensionFunds }))
      .catch(error => dispatch({ type: GET_PENSION_FUNDS_ERROR, error }));
  };
}
