import { push } from 'react-router-redux';

import {
  getSourceFundsWithToken,
  getTargetFundsWithToken,
  saveMandateWithToken,
  getMandateControlCodeForMandateIdWithToken,
  getMandateSignatureForMandateIdWithToken,
} from '../common/api';
import {
  GET_SOURCE_FUNDS_START,
  GET_SOURCE_FUNDS_SUCCESS,
  GET_SOURCE_FUNDS_ERROR,

  SELECT_EXCHANGE_SOURCES,

  GET_TARGET_FUNDS_START,
  GET_TARGET_FUNDS_SUCCESS,
  GET_TARGET_FUNDS_ERROR,

  SELECT_TARGET_FUND,

  SIGN_MANDATE_START,
  SIGN_MANDATE_START_SUCCESS,
  SIGN_MANDATE_START_ERROR,
  SIGN_MANDATE_SUCCESS,
  SIGN_MANDATE_ERROR,
  SIGN_MANDATE_CANCEL,

  CHANGE_AGREEMENT_TO_TERMS,
} from './constants';

const POLL_DELAY = 1000;

const SIGNING_IN_PROGRESS_STATUS = 'OUTSTANDING_TRANSACTION';

let timeout;

export function getSourceFunds() {
  return (dispatch, getState) => {
    dispatch({ type: GET_SOURCE_FUNDS_START });
    return getSourceFundsWithToken(getState().login.token)
      .then((sourceFunds) => {
        if (sourceFunds.length === 0) {
          dispatch(push('/'));
          return;
        }
        dispatch({ type: GET_SOURCE_FUNDS_SUCCESS, sourceFunds });
      })
      .catch(error => dispatch({ type: GET_SOURCE_FUNDS_ERROR, error }));
  };
}

export function selectExchangeSources(sourceSelection, sourceSelectionExact = false) {
  return { type: SELECT_EXCHANGE_SOURCES, sourceSelection, sourceSelectionExact };
}

export function changeAgreementToTerms(agreement) {
  return { type: CHANGE_AGREEMENT_TO_TERMS, agreement };
}

export function getTargetFunds() {
  return (dispatch, getState) => {
    dispatch({ type: GET_TARGET_FUNDS_START });
    return getTargetFundsWithToken(getState().login.token)
      .then(targetFunds => dispatch({ type: GET_TARGET_FUNDS_SUCCESS, targetFunds }))
      .catch(error => dispatch({ type: GET_TARGET_FUNDS_ERROR, error }));
  };
}

export function selectFutureContributionsFund(targetFundIsin) {
  return { type: SELECT_TARGET_FUND, targetFundIsin };
}

function pollForMandateSignatureWithMandateId(id) {
  return (dispatch, getState) => {
    if (timeout && process.env.NODE_ENV !== 'test') {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      getMandateSignatureForMandateIdWithToken(id, getState().login.token)
        .then(({ statusCode }) => {
          if (statusCode === SIGNING_IN_PROGRESS_STATUS) {
            dispatch(pollForMandateSignatureWithMandateId(id));
          } else {
            dispatch({ type: SIGN_MANDATE_SUCCESS });
            dispatch(push('/steps/success'));
          }
        })
        .catch(error => dispatch({ type: SIGN_MANDATE_ERROR, error }));
    }, POLL_DELAY);
  };
}

export function signMandate(mandate) {
  return (dispatch, getState) => {
    dispatch({ type: SIGN_MANDATE_START });
    const token = getState().login.token;
    let mandateId;
    return saveMandateWithToken(mandate, token)
      .then(({ id }) => {
        mandateId = id;
        return getMandateControlCodeForMandateIdWithToken(id, token);
      })
      .then((controlCode) => {
        dispatch({ type: SIGN_MANDATE_START_SUCCESS, controlCode });
        dispatch(pollForMandateSignatureWithMandateId(mandateId));
      })
      .catch(error => dispatch({ type: SIGN_MANDATE_START_ERROR, error }));
  };
}

export function cancelSigningMandate() {
  if (timeout && process.env.NODE_ENV !== 'test') {
    clearTimeout(timeout);
  }
  return { type: SIGN_MANDATE_CANCEL };
}
