import { push } from 'react-router-redux';

function isMember(getState) {
  if (getState().login.user.memberNumber) {
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
    if (getState().quiz.routeToQuiz === true) {
      dispatch(push('/quiz')); // load user
      return;
    }
    if (!isUserLoaded(getState)) {
      dispatch(push('/')); // load user
    } else if (isMember(getState)) {
      if (isFullyConverted(getState)) {
        dispatch(push('/account'));
      } else if (isSelectionComplete(getState)) {
        dispatch(push('/steps/select-sources'));
      } else if (isTransfersComplete(getState)) {
        dispatch(push('/steps/transfer-future-capital'));
      } else {
        dispatch(push('/steps/select-sources'));
      }
    } else {
      dispatch(push('/steps/new-user'));
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
