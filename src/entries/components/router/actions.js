import { push } from 'react-router-redux';

import { ROUTE_TO_ACCOUNT } from './constants';

export function routeToAccount() {
  return { type: ROUTE_TO_ACCOUNT };
}

export function isRouteToAccount(location) {
  if (location.pathname === '/account') {
    return true;
  }
  return false;
}

function isSelectionComplete(getState) {
  const userConversion = getState().login.userConversion;
  if (userConversion.selectionComplete) {
    return true;
  }
  return false;
}

function isTransfersComplete(getState) {
  const userConversion = getState().login.userConversion;
  if (userConversion.transfersComplete) {
    return true;
  }
  return false;
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
    if (getState().login.disableRouter === true) {
      return;
    }

    if (getState().router.routeToAccount === true) {
      dispatch(push('/account'));
      return;
    }

    if (!isUserLoaded(getState)) {
      dispatch(push('/')); // load user
    } else if (isFullyConverted(getState)) {
      dispatch(push('/account'));
    } else if (getState().exchange.shortFlow === true) {
      dispatch(push('/steps/confirm-mandate'));
    } else {
      dispatch(push('/steps/select-sources'));
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
      dispatch(push('/steps/confirm-mandate'));
    } else {
      dispatch(push('/steps/transfer-future-capital'));
    }
  };
}

export function routeBackFromMandateConfirmation() {
  return (dispatch, getState) => {
    if (isSkippingFutureCapitalStepNecessary(getState)) {
      dispatch(push('/steps/select-sources'));
    } else {
      dispatch(push('/steps/transfer-future-capital'));
    }
  };
}
