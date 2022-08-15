import { LOCATION_CHANGE } from 'connected-react-router';
import { trackEvent } from "./actions";

import {
  SELECT_EXCHANGE_SOURCES,
  GET_TARGET_FUNDS_ERROR,
  SELECT_TARGET_FUND,
  CHANGE_AGREEMENT_TO_TERMS,
  SIGN_MANDATE_MOBILE_ID_START,
  SIGN_MANDATE_MOBILE_ID_START_SUCCESS,
  SIGN_MANDATE_MOBILE_ID_CANCEL,
  SIGN_MANDATE_SMART_ID_START,
  SIGN_MANDATE_SMART_ID_START_SUCCESS,
  SIGN_MANDATE_ID_CARD_START,
  SIGN_MANDATE_ID_CARD_START_SUCCESS,
  SIGN_MANDATE_START_ERROR,
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
  GET_USER_ERROR,
  GET_USER_CONVERSION_SUCCESS,
} from '../login/constants';

import { UPDATE_USER_SUCCESS } from '../common/user/constants';

const initialState = {};

export default function trackingReducer(state = initialState, action) {
  const actionType = action.type.split('/')[1];
  switch (action.type) {
    case SELECT_EXCHANGE_SOURCES:
      trackEvent(actionType, {
        sourceSelection: action.sourceSelection,
        sourceSelectionExact: !!action.sourceSelectionExact,
      });
      return state;
    case GET_USER_SUCCESS:
      trackEvent(actionType, {
        id: action.user.id,
      });
      return state;
    case SELECT_TARGET_FUND:
      trackEvent(actionType, {
        targetFundIsin: action.targetFundIsin,
      });
      return state;
    case SIGN_MANDATE_START_ERROR:
    case SIGN_MANDATE_ERROR:
      trackEvent(actionType, {
        error: action.error,
      });
      return state;
    case GET_USER_ERROR:
      trackEvent(actionType, {
        userError: action.userError,
      });
      return state;
    case GET_USER_CONVERSION_SUCCESS:
      trackEvent(actionType);
      return state;
    case LOG_OUT:
    case MOBILE_AUTHENTICATION_START:
    case MOBILE_AUTHENTICATION_SUCCESS:
    case ID_CARD_AUTHENTICATION_START:
    case ID_CARD_AUTHENTICATION_SUCCESS:
    case GET_TARGET_FUNDS_ERROR:
    case CHANGE_AGREEMENT_TO_TERMS:
    case SIGN_MANDATE_MOBILE_ID_START:
    case SIGN_MANDATE_MOBILE_ID_START_SUCCESS:
    case SIGN_MANDATE_SMART_ID_START:
    case SIGN_MANDATE_SMART_ID_START_SUCCESS:
    case SIGN_MANDATE_MOBILE_ID_CANCEL:
    case SIGN_MANDATE_ID_CARD_START:
    case SIGN_MANDATE_SUCCESS:
    case SIGN_MANDATE_ID_CARD_START_SUCCESS:
    case UPDATE_USER_SUCCESS:
      trackEvent(actionType);
      return state;
    case LOCATION_CHANGE:
      trackEvent(actionType, { path: action.payload.location.pathname });
      return state;
    default:
      return state;
  }
}
