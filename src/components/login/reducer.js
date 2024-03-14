import {
  CHANGE_PHONE_NUMBER,
  CHANGE_EMAIL,
  MOBILE_AUTHENTICATION_START,
  MOBILE_AUTHENTICATION_START_SUCCESS,
  MOBILE_AUTHENTICATION_START_ERROR,
  MOBILE_AUTHENTICATION_SUCCESS,
  MOBILE_AUTHENTICATION_ERROR,
  MOBILE_AUTHENTICATION_CANCEL,
  ID_CARD_AUTHENTICATION_START,
  ID_CARD_AUTHENTICATION_START_ERROR,
  ID_CARD_AUTHENTICATION_SUCCESS,
  ID_CARD_AUTHENTICATION_ERROR,
  GET_USER_START,
  GET_USER_SUCCESS,
  GET_USER_ERROR,
  GET_USER_CONVERSION_START,
  GET_USER_CONVERSION_SUCCESS,
  GET_USER_CONVERSION_ERROR,
  SET_LOGIN_TO_REDIRECT,
  LOG_OUT,
  CHANGE_PERSONAL_CODE,
} from './constants';

import { getGlobalErrorCode } from '../common/errorMessage';
import { UPDATE_USER_SUCCESS } from '../common/user/constants';
import { getAuthentication } from '../common/authenticationManager';

export const initialState = {
  phoneNumber: '',
  personalCode: '',
  controlCode: null,
  loadingAuthentication: false,
  error: null,
  user: null,
  loadingUser: false,
  userError: null,
  userConversion: null,
  loadingUserConversion: false,
  userConversionError: null,
  redirectLogin: false,
  email: null,
};

export default function loginReducer(state = initialState, action) {
  switch (action.type) {
    case CHANGE_PHONE_NUMBER:
      return { ...state, phoneNumber: action.phoneNumber };
    case CHANGE_PERSONAL_CODE:
      return { ...state, personalCode: action.personalCode };
    case CHANGE_EMAIL:
      return { ...state, email: action.email };
    case MOBILE_AUTHENTICATION_START:
      return { ...state, loadingAuthentication: true, error: null };
    case MOBILE_AUTHENTICATION_START_SUCCESS:
      return {
        ...state,
        controlCode: action.controlCode,
        error: null,
      };
    case MOBILE_AUTHENTICATION_START_ERROR:
    case ID_CARD_AUTHENTICATION_START_ERROR:
      return {
        ...state,
        error: getGlobalErrorCode(action.error.body),
        loadingAuthentication: false,
        loadingUser: false,
      };

    case MOBILE_AUTHENTICATION_SUCCESS:
      return {
        // reset all state so page is clean when entered again.
        ...state,
        loadingAuthentication: false,
        controlCode: null,
        error: null,
        phoneNumber: '',
        personalCode: '',
      };
    case ID_CARD_AUTHENTICATION_ERROR:
    case MOBILE_AUTHENTICATION_ERROR:
      return {
        ...state,
        error: getGlobalErrorCode(action.error.body),
        controlCode: null,
        loadingAuthentication: false,
        loadingUser: false,
      };

    case MOBILE_AUTHENTICATION_CANCEL:
      return {
        ...state,
        loadingAuthentication: false,
        error: null,
        controlCode: null,
        loadingUser: false,
      };

    case ID_CARD_AUTHENTICATION_START:
      return { ...state, loadingAuthentication: true, error: null };

    case ID_CARD_AUTHENTICATION_SUCCESS:
      return {
        // reset all state so page is clean when entered again.
        ...state,
        loadingAuthentication: false,
        error: null,
      };

    case GET_USER_START:
      return { ...state, loadingUser: true, userError: null };
    case GET_USER_SUCCESS:
      return {
        ...state,
        loadingUser: false,
        user: action.user,
        userError: null,
      };
    case GET_USER_ERROR:
      return {
        ...state,
        loadingUser: false,
        userError: getGlobalErrorCode(action.error.body),
        error: getGlobalErrorCode(action.error.body),
      };

    case UPDATE_USER_SUCCESS:
      return {
        ...state,
        user: action.newUser,
      };

    case GET_USER_CONVERSION_START:
      return {
        ...state,
        loadingUserConversion: true,
        userConversionError: null,
      };
    case GET_USER_CONVERSION_SUCCESS:
      return {
        ...state,
        loadingUserConversion: false,
        userConversion: action.userConversion,
        userConversionError: null,
      };
    case GET_USER_CONVERSION_ERROR:
      return {
        ...state,
        loadingUserConversion: false,
        userConversionError: getGlobalErrorCode(action.error.body),
        error: getGlobalErrorCode(action.error.body),
      };
    case SET_LOGIN_TO_REDIRECT:
      return {
        ...state,
        redirectLogin: true,
      };

    case LOG_OUT:
      // possibly duplicate with logout api action
      getAuthentication().remove();
      return {
        ...initialState,
      };

    default:
      return state;
  }
}
