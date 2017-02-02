import { getExistingPensionFundsWithToken } from '../common/api';
import {
  GET_EXISTING_PENSION_FUNDS_START,
  GET_EXISTING_PENSION_FUNDS_SUCCESS,
  GET_EXISTING_PENSION_FUNDS_ERROR,
  SELECT_EXCHANGE_SOURCES,
} from './constants';

export function getExistingPensionFunds() { // eslint-disable-line
  return (dispatch, getState) => {
    dispatch({ type: GET_EXISTING_PENSION_FUNDS_START });
    return getExistingPensionFundsWithToken(getState().login.token)
      .then(pensionFunds => dispatch({ type: GET_EXISTING_PENSION_FUNDS_SUCCESS, pensionFunds }))
      .catch(error => dispatch({ type: GET_EXISTING_PENSION_FUNDS_ERROR, error }));
  };
}

export function selectExchangeSources(exchange, selectedSome = false) {
  return { type: SELECT_EXCHANGE_SOURCES, exchange, selectedSome };
}
