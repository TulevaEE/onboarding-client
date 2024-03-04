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
  UPDATE_AUTHENTICATION_PRINCIPAL,
} from './constants';

import { getGlobalErrorCode } from '../common/errorMessage';
import { UPDATE_USER_SUCCESS } from '../common/user/constants';

const AUTHENTICATION_PRINCIPAL_STORAGE_KEY = 'authenticationPrincipal';
let authenticationPrincipal = null;
if (window.sessionStorage && sessionStorage.getItem(AUTHENTICATION_PRINCIPAL_STORAGE_KEY)) {
  authenticationPrincipal = JSON.parse(
    sessionStorage.getItem(AUTHENTICATION_PRINCIPAL_STORAGE_KEY),
  );
}

export const initialState = {
  phoneNumber: '',
  personalCode: '',
  controlCode: null,
  loadingAuthentication: false,
  authenticationPrincipal,
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

function updateSessionStorage(authentication) {
  if (window.sessionStorage) {
    sessionStorage.setItem(AUTHENTICATION_PRINCIPAL_STORAGE_KEY, JSON.stringify(authentication));
  } else {
    // eslint-disable-next-line no-console
    console.error('No session storage present');
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

    case UPDATE_AUTHENTICATION_PRINCIPAL:
      updateSessionStorage({
        accessToken: action.principal.accessToken,
        refreshToken: action.principal.refreshToken,
        loginMethod: action.principal.loginMethod,
      });
      return {
        ...state,
        authenticationPrincipal: action.principal,
      };

    case MOBILE_AUTHENTICATION_SUCCESS:
      updateSessionStorage({
        accessToken: action.tokens.accessToken,
        refreshToken: action.tokens.refreshToken,
        loginMethod: action.method,
      });

      return {
        // reset all state so page is clean when entered again.
        ...state,
        authenticationPrincipal: {
          accessToken: action.tokens.accessToken,
          refreshToken: action.tokens.refreshToken,
          loginMethod: action.method,
        },
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
      updateSessionStorage({
        accessToken: action.tokens.accessToken,
        refreshToken: action.tokens.refreshToken,
        loginMethod: 'ID_CARD',
      });
      return {
        // reset all state so page is clean when entered again.
        ...state,
        authenticationPrincipal: {
          accessToken: action.tokens.accessToken,
          refreshToken: action.tokens.refreshToken,
          loginMethod: 'ID_CARD',
        },
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
      if (window.sessionStorage) {
        sessionStorage.removeItem(AUTHENTICATION_PRINCIPAL_STORAGE_KEY);
      }
      return {
        ...initialState,
        authenticationPrincipal: null,
      };

    default:
      return state;
  }
}
