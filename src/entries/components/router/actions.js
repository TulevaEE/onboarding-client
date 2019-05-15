import { push } from 'react-router-redux';

import { ROUTE_TO_ACCOUNT } from './constants';

export function routeToAccount() {
  return { type: ROUTE_TO_ACCOUNT };
}

function isSelectionComplete(getState) {
  const { userConversion } = getState().login;
  return !!(userConversion && userConversion.selectionComplete);
}

function isTransfersComplete(getState) {
  const { userConversion } = getState().login;
  return !!(userConversion && userConversion.transfersComplete);
}

function isFullyConverted(getState) {
  return isSelectionComplete(getState) && isTransfersComplete(getState);
}

function isUserLoaded(getState) {
  if (getState().login.user) {
    return true;
  }
  return false;
}

export function selectRouteForState() {
  return (dispatch, getState) => {
    if (getState().router.routeToAccount === true) {
      dispatch(push('/account'));
      return;
    }

    if (!isUserLoaded(getState)) {
      dispatch(push('/')); // load user
    } else if (isFullyConverted(getState)) {
      dispatch(push('/account'));
    } else if (getState().exchange.shortFlow === true) {
      dispatch(push('/account'));
    } else {
      dispatch(push('/account'));
    }
  };
}

function isSkippingFutureCapitalStepNecessary(getState) {
  const state = getState();
  return !state.exchange.sourceSelectionExact && state.exchange.sourceSelection.length > 0;
}

export function routeForwardFromSourceSelection() {
  return (dispatch, getState) => {
    if (isSkippingFutureCapitalStepNecessary(getState)) {
      dispatch(push('/2nd-pillar-flow/confirm-mandate'));
    } else {
      dispatch(push('/2nd-pillar-flow/transfer-future-capital'));
    }
  };
}

export function routeBackFromMandateConfirmation() {
  return (dispatch, getState) => {
    if (isSkippingFutureCapitalStepNecessary(getState)) {
      dispatch(push('/2nd-pillar-flow/select-sources'));
    } else {
      dispatch(push('/2nd-pillar-flow/transfer-future-capital'));
    }
  };
}
