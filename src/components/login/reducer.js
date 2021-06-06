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

const TOKEN_STORAGE_KEY = 'accessToken';
const LOGIN_METHOD_STORAGE_KEY = 'loginMethod';

// get saved token if it's there
const token = (window.sessionStorage && sessionStorage.getItem(TOKEN_STORAGE_KEY)) || null;
const loginMethod =
  (window.sessionStorage && sessionStorage.getItem(LOGIN_METHOD_STORAGE_KEY)) || null;

export const initialState = {
  phoneNumber: '',
  personalCode: '',
  controlCode: null,
  loadingAuthentication: false,
  token,
  loginMethod,
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

function updateSessionStorage(action, loginMethodUsed) {
  if (window.sessionStorage) {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, action.tokens.accessToken);
    if (loginMethodUsed) {
      sessionStorage.setItem(LOGIN_METHOD_STORAGE_KEY, loginMethodUsed);
    }
  }
}
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
      updateSessionStorage(action, action.method);

      return {
        // reset all state so page is clean when entered again.
        ...state,
        token: action.tokens.accessToken,
        loginMethod: action.method,
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
        error: (action.error.body || {}).error_description,
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
      updateSessionStorage(action, 'idCard');
      return {
        // reset all state so page is clean when entered again.
        ...state,
        token: action.tokens.accessToken,
        loadingAuthentication: false,
        loginMethod: 'idCard',
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
      if (window.sessionStorage) {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        sessionStorage.removeItem(LOGIN_METHOD_STORAGE_KEY);
      }
      return {
        ...initialState,
        token: null,
        loginMethod: null,
      };

    default:
      return state;
  }
}
