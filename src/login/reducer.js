import {
  CHANGE_PHONE_NUMBER,
  MOBILE_AUTHENTICATION_START,
  MOBILE_AUTHENTICATION_START_SUCCESS,
  MOBILE_AUTHENTICATION_START_ERROR,
  MOBILE_AUTHENTICATION_SUCCESS,
  MOBILE_AUTHENTICATION_ERROR,
  MOBILE_AUTHENTICATION_CANCEL,
  GET_USER_START,
  GET_USER_SUCCESS,
  GET_USER_ERROR,
  LOG_OUT
} from "./constants";

const TOKEN_STORAGE_KEY = 'token';

// get saved token if it's there
const token = (window.localStorage && localStorage.getItem(TOKEN_STORAGE_KEY)) || null;

const defaultState = {
  phoneNumber: '',
  controlCode: null,
  loadingControlCode: false,
  token,
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
      return { ...state, loadingControlCode: true, error: null };
    case MOBILE_AUTHENTICATION_START_SUCCESS:
      return { ...state, loadingControlCode: false, controlCode: action.controlCode, error: null };
    case MOBILE_AUTHENTICATION_START_ERROR:
      return { ...state, loadingControlCode: false, error: action.error };

    case MOBILE_AUTHENTICATION_SUCCESS:
      if (window.localStorage) {
        localStorage.setItem(TOKEN_STORAGE_KEY, action.token);
      }
      return { // reset all state so page is clean when entered again.
        ...state,
        token: action.token,
        loadingControlCode: false,
        controlCode: null,
        error: null,
        phoneNumber: '',
      };
    case MOBILE_AUTHENTICATION_ERROR:
      return { ...state, error: action.error };

    case MOBILE_AUTHENTICATION_CANCEL:
      return { ...state, loadingControlCode: false, error: null, controlCode: null };


    case GET_USER_START:
      return { ...state, loadingUser: true, userError: null };
    case GET_USER_SUCCESS:
      return { ...state, loadingUser: false, user: action.user, userError: null };
    case GET_USER_ERROR:
      return { ...state, loadingUser: false, userError: action.error };

    case LOG_OUT:
      if (window.localStorage) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
      return { ...state, token: null };

    default:
      return state;
  }
}
