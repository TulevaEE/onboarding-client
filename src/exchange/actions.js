import { getSourceFundsWithToken, getTargetFundsWithToken } from '../common/api';
import {
  GET_SOURCE_FUNDS_START,
  GET_SOURCE_FUNDS_SUCCESS,
  GET_SOURCE_FUNDS_ERROR,

  SELECT_EXCHANGE_SOURCES,

  GET_TARGET_FUNDS_START,
  GET_TARGET_FUNDS_SUCCESS,
  GET_TARGET_FUNDS_ERROR,

  SELECT_TARGET_FUND,
} from './constants';

export function getSourceFunds() {
  return (dispatch, getState) => {
    dispatch({ type: GET_SOURCE_FUNDS_START });
    return getSourceFundsWithToken(getState().login.token)
      .then(sourceFunds => dispatch({ type: GET_SOURCE_FUNDS_SUCCESS, sourceFunds }))
      .catch(error => dispatch({ type: GET_SOURCE_FUNDS_ERROR, error }));
  };
}

export function selectExchangeSources(sourceSelection, sourceSelectionExact = false) {
  return { type: SELECT_EXCHANGE_SOURCES, sourceSelection, sourceSelectionExact };
}

export function getTargetFunds() {
  return (dispatch, getState) => {
    dispatch({ type: GET_TARGET_FUNDS_START });
    return getTargetFundsWithToken(getState().login.token)
      .then(targetFunds => dispatch({ type: GET_TARGET_FUNDS_SUCCESS, targetFunds }))
      .catch(error => dispatch({ type: GET_TARGET_FUNDS_ERROR, error }));
  };
}

export function selectTargetFund(targetFund) {
  return { type: SELECT_TARGET_FUND, targetFund };
}
