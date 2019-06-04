import { push } from 'connected-react-router';

function isUserLoaded(getState) {
  return !!getState().login.user;
}

export function selectRouteForState() {
  return (dispatch, getState) => {
    if (!isUserLoaded(getState)) {
      dispatch(push('/')); // load user
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
