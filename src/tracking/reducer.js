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
  MOBILE_AUTHENTICATION_SUCCESS,
  ID_CARD_AUTHENTICATION_SUCCESS,
  GET_USER_SUCCESS,
} from '../login/constants';

function identifyUserForTracking(user) {
  mixpanel.identify(user.id);

  mixpanel.people.set({
    userId: user.id,
  });

  mixpanel.track('init_user');
}

export default function trackingReducer(state, action) {
  const actionType = action.type.split('/')[1];
  switch (action.type) {
    case SELECT_EXCHANGE_SOURCES:
      mixpanel.track(actionType, {
        sourceSelection: action.sourceSelection,
        sourceSelectionExact: !!action.sourceSelectionExact,
      });
      break;
    case LOG_OUT:
    case MOBILE_AUTHENTICATION_SUCCESS:
    case ID_CARD_AUTHENTICATION_SUCCESS:
    case GET_USER_SUCCESS:
      identifyUserForTracking(user);
      break;
    case GET_TARGET_FUNDS_ERROR:
    case SELECT_TARGET_FUND:
    case CHANGE_AGREEMENT_TO_TERMS:
    case SIGN_MANDATE_MOBILE_ID_START_SUCCESS:
    case SIGN_MANDATE_MOBILE_ID_CANCEL:
    case SIGN_MANDATE_ID_CARD_START:
    case SIGN_MANDATE_SUCCESS:
    case SIGN_MANDATE_ERROR:
    default:

  }
}
