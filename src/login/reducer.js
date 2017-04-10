import {
  CHANGE_PHONE_NUMBER,
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
  LOG_OUT,
} from './constants';

const TOKEN_STORAGE_KEY = 'token';
const LOGIN_METHOD_STORAGE_KEY = 'loginMethod';


// get saved token if it's there
const token = (window.localStorage && localStorage.getItem(TOKEN_STORAGE_KEY)) || null;
const loginMethod = (window.localStorage && localStorage.getItem(LOGIN_METHOD_STORAGE_KEY)) || null;

const defaultState = {
  phoneNumber: '',
  controlCode: null,
  loadingAuthentication: false,
  token,
  loginMethod,
  error: null,
  user: null,
  loadingUser: false,
  userError: null,
};

export default function loginReducer(state = defaultState, action) {
  switch (action.type) {
    case CHANGE_PHONE_NUMBER:
      return { ...state, phoneNumber: action.phoneNumber };

    case MOBILE_AUTHENTICATION_START:
      return { ...state, loadingAuthentication: true, error: null };
    case MOBILE_AUTHENTICATION_START_SUCCESS:
      return {
        ...state,
        loadingAuthentication: false,
        controlCode: action.controlCode,
        error: null,
      };
    case MOBILE_AUTHENTICATION_START_ERROR:
      return { ...state, loadingAuthentication: false, error: action.error };

    case MOBILE_AUTHENTICATION_SUCCESS:
      if (window.localStorage) {
        localStorage.setItem(TOKEN_STORAGE_KEY, action.token);
        localStorage.setItem(LOGIN_METHOD_STORAGE_KEY, 'mobileId');
      }
      return { // reset all state so page is clean when entered again.
        ...state,
        token: action.token,
        loginMethod: 'mobileId',
        loadingAuthentication: false,
        controlCode: null,
        error: null,
        phoneNumber: '',
      };
    case MOBILE_AUTHENTICATION_ERROR:
      return {
        ...state,
        error: action.error,
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
      if (window.localStorage) {
        localStorage.setItem(TOKEN_STORAGE_KEY, action.token);
        localStorage.setItem(LOGIN_METHOD_STORAGE_KEY, 'idCard');
      }
      return { // reset all state so page is clean when entered again.
        ...state,
        token: action.token,
        loadingAuthentication: false,
        loginMethod: 'idCard',
        error: null,
      };
    case ID_CARD_AUTHENTICATION_START_ERROR:
    case ID_CARD_AUTHENTICATION_ERROR:
      return { ...state, error: action.error, loadingAuthentication: false, loadingUser: false };


    case GET_USER_START:
      return { ...state, loadingUser: true, userError: null };
    case GET_USER_SUCCESS:
      return { ...state, loadingUser: false, user: action.user, userError: null };
    case GET_USER_ERROR:
      return { ...state, loadingUser: false, userError: action.error };

    case LOG_OUT:
      if (window.localStorage) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(LOGIN_METHOD_STORAGE_KEY);
      }
      return { ...state, token: null, loginMethod: null, loadingUser: false };

    default:
      return state;
  }
}
