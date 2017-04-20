import mixpanel from 'mixpanel-browser';

import {
  SELECT_EXCHANGE_SOURCES,
  GET_TARGET_FUNDS_ERROR,
  SELECT_TARGET_FUND,
  CHANGE_AGREEMENT_TO_TERMS,
  SIGN_MANDATE_MOBILE_ID_START_SUCCESS,
  SIGN_MANDATE_MOBILE_ID_CANCEL,
  SIGN_MANDATE_ID_CARD_START,
  SIGN_MANDATE_SUCCESS,
  SIGN_MANDATE_ERROR,
} from '../exchange/constants';

import {
  LOG_OUT,
  MOBILE_AUTHENTICATION_START,
  ID_CARD_AUTHENTICATION_START,
  MOBILE_AUTHENTICATION_SUCCESS,
  ID_CARD_AUTHENTICATION_SUCCESS,
  GET_USER_SUCCESS,
} from '../login/constants';

function identifyUserForTracking(user) {
  mixpanel.identify(user.id);

  mixpanel.people.set({
    id: user.id,
  });
}

const initialState = {
};

export default function trackingReducer(state = initialState, action) {
  const actionType = action.type.split('/')[1];
  switch (action.type) {
    case SELECT_EXCHANGE_SOURCES:
      mixpanel.track(actionType, {
        sourceSelection: action.sourceSelection,
        sourceSelectionExact: !!action.sourceSelectionExact,
      });
      return initialState;
    case GET_USER_SUCCESS:
      identifyUserForTracking(action.user);
      mixpanel.track(actionType, {
        id: action.user.id,
      });
      return initialState;
    case SELECT_TARGET_FUND:
      mixpanel.track(actionType, {
        targetFundIsin: action.targetFundIsin,
      });
      return initialState;
    case SIGN_MANDATE_ERROR:
      mixpanel.track(actionType, {
        error: action.error,
      });
      return initialState;
    case LOG_OUT:
    case MOBILE_AUTHENTICATION_START:
    case MOBILE_AUTHENTICATION_SUCCESS:
    case ID_CARD_AUTHENTICATION_START:
    case ID_CARD_AUTHENTICATION_SUCCESS:
    case GET_TARGET_FUNDS_ERROR:
    case CHANGE_AGREEMENT_TO_TERMS:
    case SIGN_MANDATE_MOBILE_ID_START_SUCCESS:
    case SIGN_MANDATE_MOBILE_ID_CANCEL:
    case SIGN_MANDATE_ID_CARD_START:
    case SIGN_MANDATE_SUCCESS:
      mixpanel.track(actionType);
      return initialState;
    default:
      return initialState;
  }
}
