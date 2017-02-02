import { getSourceFundsWithToken } from '../common/api';
import {
  GET_SOURCE_FUNDS_START,
  GET_SOURCE_FUNDS_SUCCESS,
  GET_SOURCE_FUNDS_ERROR,
  SELECT_EXCHANGE_SOURCES,
} from './constants';

export function getSourceFunds() { // eslint-disable-line
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
